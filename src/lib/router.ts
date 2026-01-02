/**
 * Intelligent Agent Router
 *
 * Cloudflare Workers AI를 사용한 지능형 에이전트 라우터.
 * - 사용자 질문을 분석하여 가장 적합한 에이전트 선택
 * - Intent 기반 라우팅 (키워드 매칭 아님)
 * - FIN-001~068 + STR-001~003 총 71개 에이전트 지원
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RouterInput {
  question: string;
  context?: {
    event_id?: string;
    event_type?: string;
    previous_tasks?: string[];
  };
}

export interface RouterOutput {
  taskId: string;
  domain: "finance" | "strategy";
  confidence: number;
  reasoning: string;
  suggested_input?: Record<string, unknown>;
}

export interface AgentMetadata {
  taskId: string;
  taskName: string;
  domain: "finance" | "strategy";
  keywords: string[];
  intentPatterns: string[];
}

// =============================================================================
// AGENT CATALOG
// =============================================================================

const AGENT_CATALOG: AgentMetadata[] = [
  // ============ STRATEGY DOMAIN (STR-001~003) ============
  {
    taskId: "STR-001",
    taskName: "Event Goal Setting",
    domain: "strategy",
    keywords: ["목표", "KPI", "성과", "지표", "달성", "목적", "SMART", "성공 기준"],
    intentPatterns: [
      "이벤트 목표를 설정하고 싶다",
      "KPI를 정의하고 싶다",
      "성과 지표가 필요하다",
      "무엇을 달성해야 하는가",
    ],
  },
  {
    taskId: "STR-002",
    taskName: "Stakeholder Analysis",
    domain: "strategy",
    keywords: ["이해관계자", "참여자", "관계자", "영향력", "관심도", "stakeholder", "누가"],
    intentPatterns: [
      "이해관계자를 분석하고 싶다",
      "누가 참여하는가",
      "관계자 매트릭스가 필요하다",
      "영향력 있는 사람이 누구인가",
    ],
  },
  {
    taskId: "STR-003",
    taskName: "Risk Identification & Assessment",
    domain: "strategy",
    keywords: ["리스크", "위험", "risk", "위협", "문제", "대비", "완화", "contingency"],
    intentPatterns: [
      "리스크를 식별하고 싶다",
      "위험 요소가 뭔가",
      "어떤 문제가 생길 수 있나",
      "대비책이 필요하다",
    ],
  },

  // ============ FINANCE DOMAIN - Skill 7: 스폰서십/수익 관리 (FIN-001~030) ============
  {
    taskId: "FIN-001",
    taskName: "스폰서십 프로그램 재정 가치 산정",
    domain: "finance",
    keywords: ["스폰서십", "가치", "산정", "평가", "sponsorship", "value"],
    intentPatterns: ["스폰서십 가치를 계산하고 싶다", "스폰서 프로그램 가치가 얼마인가"],
  },
  {
    taskId: "FIN-002",
    taskName: "스폰서 혜택 제공 비용 추정",
    domain: "finance",
    keywords: ["스폰서", "혜택", "비용", "추정", "benefit", "cost"],
    intentPatterns: ["스폰서 혜택 비용이 얼마인가", "혜택 제공에 드는 비용"],
  },
  {
    taskId: "FIN-003",
    taskName: "이해관계자 스폰서십 승인 획득",
    domain: "finance",
    keywords: ["스폰서십", "승인", "결재", "approval"],
    intentPatterns: ["스폰서십 승인을 받고 싶다", "승인 프로세스가 필요하다"],
  },
  {
    taskId: "FIN-005",
    taskName: "잠재 스폰서 후보 식별",
    domain: "finance",
    keywords: ["스폰서", "후보", "잠재", "찾기", "식별", "prospect"],
    intentPatterns: ["스폰서를 찾고 싶다", "누가 스폰서가 될 수 있나"],
  },
  {
    taskId: "FIN-006",
    taskName: "스폰서 적합성 분석",
    domain: "finance",
    keywords: ["스폰서", "적합", "분석", "fit", "매칭"],
    intentPatterns: ["이 스폰서가 적합한가", "스폰서 매칭 분석"],
  },
  {
    taskId: "FIN-016",
    taskName: "스폰서 ROI 평가",
    domain: "finance",
    keywords: ["ROI", "투자수익", "스폰서", "성과", "return"],
    intentPatterns: ["스폰서 ROI가 얼마인가", "투자 대비 수익"],
  },
  {
    taskId: "FIN-017",
    taskName: "등록 재정 목표 설정",
    domain: "finance",
    keywords: ["등록", "재정", "목표", "registration", "revenue"],
    intentPatterns: ["등록 수익 목표를 설정하고 싶다", "참가비 수익 목표"],
  },
  {
    taskId: "FIN-022",
    taskName: "전시 잠재 고객 식별",
    domain: "finance",
    keywords: ["전시", "전시사", "exhibitor", "부스", "booth"],
    intentPatterns: ["전시사를 찾고 싶다", "부스 판매 대상"],
  },
  {
    taskId: "FIN-026",
    taskName: "전시 수익 예측",
    domain: "finance",
    keywords: ["전시", "수익", "예측", "exhibition", "forecast"],
    intentPatterns: ["전시 수익이 얼마일까", "부스 판매 수익 예측"],
  },
  {
    taskId: "FIN-027",
    taskName: "추가 수익원 식별",
    domain: "finance",
    keywords: ["수익원", "추가", "다각화", "additional", "revenue stream"],
    intentPatterns: ["추가 수익을 만들고 싶다", "다른 수익원이 뭐가 있나"],
  },
  {
    taskId: "FIN-029",
    taskName: "F&B 수익 최적화",
    domain: "finance",
    keywords: ["F&B", "식음료", "케이터링", "음식", "catering"],
    intentPatterns: ["케이터링 수익을 높이고 싶다", "식음료 수익 최적화"],
  },
  {
    taskId: "FIN-030",
    taskName: "콘텐츠 수익화",
    domain: "finance",
    keywords: ["콘텐츠", "수익화", "monetization", "유료"],
    intentPatterns: ["콘텐츠로 수익을 내고 싶다", "세션 녹화 판매"],
  },

  // ============ FINANCE DOMAIN - Skill 8: 예산 관리 (FIN-031~057) ============
  {
    taskId: "FIN-031",
    taskName: "예산 구조 설계",
    domain: "finance",
    keywords: ["예산", "구조", "설계", "budget", "structure", "framework"],
    intentPatterns: ["예산을 짜고 싶다", "예산 구조가 필요하다"],
  },
  {
    taskId: "FIN-032",
    taskName: "과거 비용 분석",
    domain: "finance",
    keywords: ["과거", "비용", "분석", "historical", "cost"],
    intentPatterns: ["이전 이벤트 비용이 얼마였나", "과거 지출 분석"],
  },
  {
    taskId: "FIN-033",
    taskName: "공급사 견적 수집",
    domain: "finance",
    keywords: ["견적", "공급사", "벤더", "quote", "vendor"],
    intentPatterns: ["견적을 받고 싶다", "공급사 가격 비교"],
  },
  {
    taskId: "FIN-034",
    taskName: "예산 항목 상세화",
    domain: "finance",
    keywords: ["예산", "항목", "세부", "line item", "detail"],
    intentPatterns: ["예산 항목을 구체화하고 싶다", "세부 비용 내역"],
  },
  {
    taskId: "FIN-035",
    taskName: "예비비 계획",
    domain: "finance",
    keywords: ["예비비", "contingency", "여유", "reserve"],
    intentPatterns: ["예비비를 얼마나 잡아야 하나", "불확실성 대비 예산"],
  },
  {
    taskId: "FIN-036",
    taskName: "수익 예측",
    domain: "finance",
    keywords: ["수익", "예측", "forecast", "projection", "매출"],
    intentPatterns: ["수익이 얼마나 될까", "매출 예측"],
  },
  {
    taskId: "FIN-037",
    taskName: "손익분기점 분석",
    domain: "finance",
    keywords: ["손익분기", "BEP", "break-even", "흑자", "적자"],
    intentPatterns: ["몇 명이 와야 손익분기인가", "손익분기점 계산"],
  },
  {
    taskId: "FIN-038",
    taskName: "현금흐름 예측",
    domain: "finance",
    keywords: ["현금흐름", "cash flow", "자금", "유동성"],
    intentPatterns: ["현금 흐름이 어떻게 되나", "자금 필요 시점"],
  },
  {
    taskId: "FIN-041",
    taskName: "시나리오 플래닝",
    domain: "finance",
    keywords: ["시나리오", "scenario", "최악", "최선", "가정"],
    intentPatterns: ["다양한 시나리오를 보고 싶다", "최악의 경우 예산"],
  },
  {
    taskId: "FIN-043",
    taskName: "가격 책정 전략 개발",
    domain: "finance",
    keywords: ["가격", "책정", "pricing", "참가비", "티켓"],
    intentPatterns: ["참가비를 얼마로 할까", "가격 전략이 필요하다"],
  },
  {
    taskId: "FIN-044",
    taskName: "경쟁사 가격 분석",
    domain: "finance",
    keywords: ["경쟁사", "가격", "비교", "competitor", "benchmark"],
    intentPatterns: ["경쟁 이벤트 가격이 얼마인가", "시장 가격 분석"],
  },
  {
    taskId: "FIN-045",
    taskName: "할인 정책 설계",
    domain: "finance",
    keywords: ["할인", "discount", "얼리버드", "그룹", "early bird"],
    intentPatterns: ["할인을 어떻게 적용할까", "얼리버드 가격"],
  },
  {
    taskId: "FIN-046",
    taskName: "동적 가격 규칙",
    domain: "finance",
    keywords: ["동적", "dynamic", "가격", "변동", "surge"],
    intentPatterns: ["가격을 동적으로 조정하고 싶다", "수요에 따른 가격"],
  },
  {
    taskId: "FIN-048",
    taskName: "환불 정책 생성",
    domain: "finance",
    keywords: ["환불", "취소", "refund", "cancellation"],
    intentPatterns: ["환불 정책이 필요하다", "취소 시 환불 규정"],
  },
  {
    taskId: "FIN-052",
    taskName: "실제 vs 예산 분석",
    domain: "finance",
    keywords: ["실제", "actual", "예산", "비교", "variance"],
    intentPatterns: ["예산 대비 실제 지출이 어떤가", "차이 분석"],
  },
  {
    taskId: "FIN-054",
    taskName: "예산 재배분",
    domain: "finance",
    keywords: ["재배분", "조정", "reallocation", "이동"],
    intentPatterns: ["예산을 다시 배분하고 싶다", "항목 간 이동"],
  },
  {
    taskId: "FIN-056",
    taskName: "비용 통제 조치",
    domain: "finance",
    keywords: ["비용", "통제", "절감", "cost control", "saving"],
    intentPatterns: ["비용을 줄이고 싶다", "절감 방안"],
  },
  {
    taskId: "FIN-057",
    taskName: "이벤트 후 재무 정산",
    domain: "finance",
    keywords: ["정산", "마감", "결산", "post-event", "settlement"],
    intentPatterns: ["이벤트 끝나고 정산하고 싶다", "최종 재무 정리"],
  },

  // ============ FINANCE DOMAIN - Skill 9: 금전 거래 (FIN-058~068) ============
  {
    taskId: "FIN-058",
    taskName: "결제 처리 시스템 설정",
    domain: "finance",
    keywords: ["결제", "payment", "시스템", "PG", "카드"],
    intentPatterns: ["결제 시스템을 설정하고 싶다", "온라인 결제 방법"],
  },
  {
    taskId: "FIN-060",
    taskName: "환불 정책 구현",
    domain: "finance",
    keywords: ["환불", "구현", "처리", "refund", "process"],
    intentPatterns: ["환불을 처리하고 싶다", "환불 시스템 구축"],
  },
  {
    taskId: "FIN-062",
    taskName: "세금 준수 설정",
    domain: "finance",
    keywords: ["세금", "tax", "VAT", "부가세", "compliance"],
    intentPatterns: ["세금 처리가 필요하다", "부가세 설정"],
  },
  {
    taskId: "FIN-064",
    taskName: "결제 처리",
    domain: "finance",
    keywords: ["결제", "수납", "payment", "수금"],
    intentPatterns: ["결제를 받고 싶다", "참가비 수납"],
  },
  {
    taskId: "FIN-065",
    taskName: "환불 처리",
    domain: "finance",
    keywords: ["환불", "처리", "refund", "돌려주다"],
    intentPatterns: ["환불해야 한다", "돈을 돌려줘야 한다"],
  },
  {
    taskId: "FIN-066",
    taskName: "인보이스 생성",
    domain: "finance",
    keywords: ["인보이스", "청구서", "invoice", "bill"],
    intentPatterns: ["청구서를 만들고 싶다", "인보이스 발행"],
  },
  {
    taskId: "FIN-067",
    taskName: "수금 관리",
    domain: "finance",
    keywords: ["수금", "미수", "collection", "receivable"],
    intentPatterns: ["미수금을 관리하고 싶다", "안 낸 사람 추적"],
  },
  {
    taskId: "FIN-068",
    taskName: "재무 보고",
    domain: "finance",
    keywords: ["재무", "보고", "report", "리포트", "보고서"],
    intentPatterns: ["재무 보고서가 필요하다", "재정 현황 보고"],
  },
];

// =============================================================================
// ROUTER CLASS
// =============================================================================

export class IntelligentRouter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ai: any;
  private model = "@cf/meta/llama-3.1-70b-instruct";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(ai: any) {
    this.ai = ai;
  }

  /**
   * 사용자 질문을 분석하여 가장 적합한 에이전트 선택
   */
  async route(input: RouterInput): Promise<RouterOutput> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    try {
      const response = await this.ai.run(this.model, {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 512,
        temperature: 0.3, // 낮은 temperature로 일관된 라우팅
      });

      const responseText =
        typeof response === "string"
          ? response
          : (response as { response?: string }).response || "";

      return this.parseRouterResponse(responseText, input.question);
    } catch (error) {
      console.error("Router error:", error);
      // Fallback: 키워드 기반 라우팅
      return this.fallbackRoute(input.question);
    }
  }

  /**
   * 시스템 프롬프트 생성
   */
  private buildSystemPrompt(): string {
    const agentList = AGENT_CATALOG.map(
      (a) => `- ${a.taskId}: ${a.taskName} [${a.domain}] - Keywords: ${a.keywords.slice(0, 5).join(", ")}`
    ).join("\n");

    return `You are an intelligent routing assistant for an Event Management AI system.
Your job is to analyze the user's question and select the SINGLE MOST APPROPRIATE agent to handle it.

## Available Agents (71 total)

### Strategy Domain (STR-001~003)
- STR-001: Event Goal Setting - 이벤트 목표, KPI, 성과 지표 설정
- STR-002: Stakeholder Analysis - 이해관계자 분석, 영향도/관심도 매트릭스
- STR-003: Risk Identification - 리스크 식별, 위험 평가, 완화 전략

### Finance Domain (FIN-001~068)
${agentList}

## ROUTING RULES

1. **Intent-Based Selection**: Focus on what the user WANTS TO DO, not just keywords
2. **Domain Priority**:
   - Questions about GOALS, STAKEHOLDERS, RISKS → Strategy (STR-*)
   - Questions about MONEY, BUDGET, PRICING, SPONSORS → Finance (FIN-*)
3. **Specificity**: Choose the most specific agent that matches the intent
4. **Confidence**: Rate your confidence from 0.0 to 1.0

## OUTPUT FORMAT (STRICT JSON)

You MUST respond with ONLY a valid JSON object:
{
  "taskId": "FIN-001 or STR-001 etc",
  "domain": "finance" or "strategy",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this agent was selected"
}

CRITICAL: Output ONLY the JSON object, nothing else.`;
  }

  /**
   * 사용자 프롬프트 생성
   */
  private buildUserPrompt(input: RouterInput): string {
    let prompt = `## User Question\n"${input.question}"`;

    if (input.context) {
      prompt += `\n\n## Context`;
      if (input.context.event_type) {
        prompt += `\nEvent Type: ${input.context.event_type}`;
      }
      if (input.context.previous_tasks?.length) {
        prompt += `\nPrevious Tasks: ${input.context.previous_tasks.join(", ")}`;
      }
    }

    prompt += `\n\nAnalyze this question and select the single best agent. Output ONLY valid JSON.`;

    return prompt;
  }

  /**
   * LLM 응답 파싱
   */
  private parseRouterResponse(responseText: string, originalQuestion: string): RouterOutput {
    try {
      // JSON 블록 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(jsonStr.trim());

      // 유효한 taskId인지 확인
      const validAgent = AGENT_CATALOG.find((a) => a.taskId === parsed.taskId);
      if (!validAgent) {
        throw new Error(`Invalid taskId: ${parsed.taskId}`);
      }

      return {
        taskId: parsed.taskId,
        domain: validAgent.domain,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
        reasoning: parsed.reasoning || "AI-selected agent",
      };
    } catch {
      // 파싱 실패 시 fallback
      return this.fallbackRoute(originalQuestion);
    }
  }

  /**
   * Fallback: 키워드 기반 라우팅
   */
  private fallbackRoute(question: string): RouterOutput {
    const lowerQuestion = question.toLowerCase();

    // 키워드 매칭 점수 계산
    let bestMatch: { agent: AgentMetadata; score: number } | null = null;

    for (const agent of AGENT_CATALOG) {
      let score = 0;

      // 키워드 매칭
      for (const keyword of agent.keywords) {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Intent 패턴 매칭
      for (const pattern of agent.intentPatterns) {
        if (lowerQuestion.includes(pattern.substring(0, 5).toLowerCase())) {
          score += 5;
        }
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { agent, score };
      }
    }

    // 기본값: 목표가 언급되면 STR-001, 그 외 FIN-031 (예산)
    if (!bestMatch || bestMatch.score === 0) {
      if (lowerQuestion.includes("목표") || lowerQuestion.includes("goal")) {
        return {
          taskId: "STR-001",
          domain: "strategy",
          confidence: 0.5,
          reasoning: "Fallback: Goal-related keywords detected",
        };
      }
      return {
        taskId: "FIN-031",
        domain: "finance",
        confidence: 0.3,
        reasoning: "Fallback: No strong keyword match, defaulting to budget structure",
      };
    }

    return {
      taskId: bestMatch.agent.taskId,
      domain: bestMatch.agent.domain,
      confidence: Math.min(bestMatch.score / 30, 0.9),
      reasoning: `Keyword matching: ${bestMatch.agent.taskName}`,
    };
  }

  /**
   * 에이전트 카탈로그 조회
   */
  static getAgentCatalog(): AgentMetadata[] {
    return AGENT_CATALOG;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRouter(ai: any): IntelligentRouter {
  if (!ai) {
    throw new Error("Cloudflare AI binding is required");
  }
  return new IntelligentRouter(ai);
}

export default IntelligentRouter;
