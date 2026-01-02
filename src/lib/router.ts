/**
 * Intelligent Agent Router
 *
 * Cloudflare Workers AI를 사용한 지능형 에이전트 라우터.
 * - 사용자 질문을 분석하여 가장 적합한 에이전트 선택
 * - Intent 기반 라우팅 (키워드 매칭 아님)
 * - FIN-001~068 (68개) + STR-001~054 (54개) 총 122개 에이전트 지원
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
  domain: "finance" | "strategy" | "out_of_scope";
  confidence: number;
  reasoning: string;
  suggested_input?: Record<string, unknown>;
  isOutOfScope?: boolean;
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
  // ============ STRATEGY DOMAIN - Skill 1: Goal Setting (STR-001~013) ============
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
  {
    taskId: "STR-004",
    taskName: "Vision Definition",
    domain: "strategy",
    keywords: ["비전", "vision", "미래상", "방향", "지향점"],
    intentPatterns: ["이벤트 비전을 정의하고 싶다", "미래 방향이 필요하다"],
  },
  {
    taskId: "STR-005",
    taskName: "Mission Statement",
    domain: "strategy",
    keywords: ["미션", "mission", "사명", "존재 이유", "가치"],
    intentPatterns: ["이벤트 미션이 필요하다", "왜 이 이벤트를 하는가"],
  },
  {
    taskId: "STR-006",
    taskName: "Objective Setting",
    domain: "strategy",
    keywords: ["목적", "objective", "달성", "목표 설정"],
    intentPatterns: ["구체적인 목적을 설정하고 싶다", "목표를 세분화하고 싶다"],
  },
  {
    taskId: "STR-007",
    taskName: "Goal Alignment",
    domain: "strategy",
    keywords: ["정렬", "alignment", "일치", "연계", "조화"],
    intentPatterns: ["목표들이 서로 맞는지 확인하고 싶다", "목표 정렬이 필요하다"],
  },
  {
    taskId: "STR-008",
    taskName: "Success Criteria",
    domain: "strategy",
    keywords: ["성공 기준", "success criteria", "평가 기준", "달성 기준"],
    intentPatterns: ["성공을 어떻게 측정하나", "성공 기준이 필요하다"],
  },
  {
    taskId: "STR-009",
    taskName: "Goal Prioritization",
    domain: "strategy",
    keywords: ["우선순위", "priority", "중요도", "순서"],
    intentPatterns: ["목표 우선순위를 정하고 싶다", "무엇을 먼저 해야 하나"],
  },
  {
    taskId: "STR-010",
    taskName: "Milestone Definition",
    domain: "strategy",
    keywords: ["마일스톤", "milestone", "중간 목표", "이정표"],
    intentPatterns: ["마일스톤이 필요하다", "중간 체크포인트를 정하고 싶다"],
  },
  {
    taskId: "STR-011",
    taskName: "Goal Communication",
    domain: "strategy",
    keywords: ["목표 전달", "communication", "공유", "알림"],
    intentPatterns: ["목표를 팀에 전달하고 싶다", "목표 공유 방법이 필요하다"],
  },
  {
    taskId: "STR-012",
    taskName: "Goal Tracking",
    domain: "strategy",
    keywords: ["추적", "tracking", "모니터링", "진행 상황"],
    intentPatterns: ["목표 달성 진행상황을 추적하고 싶다", "어디까지 왔나"],
  },
  {
    taskId: "STR-013",
    taskName: "Goal Review",
    domain: "strategy",
    keywords: ["검토", "review", "평가", "재검토"],
    intentPatterns: ["목표를 검토하고 싶다", "목표 달성 여부 평가"],
  },

  // ============ STRATEGY DOMAIN - Skill 2: Stakeholder Analysis (STR-014~026) ============
  {
    taskId: "STR-014",
    taskName: "Stakeholder Identification",
    domain: "strategy",
    keywords: ["이해관계자 식별", "stakeholder identification", "누가 관련", "관계자 찾기"],
    intentPatterns: ["이해관계자가 누군가", "관련된 사람을 찾고 싶다"],
  },
  {
    taskId: "STR-015",
    taskName: "Stakeholder Mapping",
    domain: "strategy",
    keywords: ["매핑", "mapping", "매트릭스", "영향-관심"],
    intentPatterns: ["이해관계자 매핑이 필요하다", "영향력 매트릭스"],
  },
  {
    taskId: "STR-016",
    taskName: "Stakeholder Prioritization",
    domain: "strategy",
    keywords: ["이해관계자 우선순위", "stakeholder priority", "중요 관계자"],
    intentPatterns: ["누구를 먼저 관리해야 하나", "중요한 이해관계자는 누구"],
  },
  {
    taskId: "STR-017",
    taskName: "Stakeholder Engagement",
    domain: "strategy",
    keywords: ["참여", "engagement", "관여", "협력"],
    intentPatterns: ["이해관계자 참여를 높이고 싶다", "어떻게 관계자를 관여시키나"],
  },
  {
    taskId: "STR-018",
    taskName: "Expectation Management",
    domain: "strategy",
    keywords: ["기대 관리", "expectation", "요구사항", "예상"],
    intentPatterns: ["이해관계자 기대를 관리하고 싶다", "무엇을 기대하는가"],
  },
  {
    taskId: "STR-019",
    taskName: "Conflict Resolution",
    domain: "strategy",
    keywords: ["갈등", "conflict", "충돌", "해결", "조정"],
    intentPatterns: ["이해관계자 간 갈등이 있다", "갈등을 해결하고 싶다"],
  },
  {
    taskId: "STR-020",
    taskName: "Relationship Building",
    domain: "strategy",
    keywords: ["관계 구축", "relationship", "신뢰", "네트워킹"],
    intentPatterns: ["관계를 강화하고 싶다", "신뢰를 쌓고 싶다"],
  },
  {
    taskId: "STR-021",
    taskName: "Influence Analysis",
    domain: "strategy",
    keywords: ["영향력 분석", "influence", "파워", "권한"],
    intentPatterns: ["누가 영향력이 있나", "영향력을 분석하고 싶다"],
  },
  {
    taskId: "STR-022",
    taskName: "Stakeholder Feedback",
    domain: "strategy",
    keywords: ["피드백", "feedback", "의견", "반응"],
    intentPatterns: ["이해관계자 피드백을 수집하고 싶다", "의견을 들어보고 싶다"],
  },
  {
    taskId: "STR-023",
    taskName: "Coalition Building",
    domain: "strategy",
    keywords: ["연합", "coalition", "동맹", "지지"],
    intentPatterns: ["지지 세력을 만들고 싶다", "연합을 구축하고 싶다"],
  },
  {
    taskId: "STR-024",
    taskName: "Negotiation Support",
    domain: "strategy",
    keywords: ["협상", "negotiation", "교섭", "타협"],
    intentPatterns: ["협상을 준비하고 싶다", "협상 전략이 필요하다"],
  },
  {
    taskId: "STR-025",
    taskName: "Stakeholder Reporting",
    domain: "strategy",
    keywords: ["이해관계자 보고", "stakeholder report", "현황 보고"],
    intentPatterns: ["이해관계자에게 보고하고 싶다", "현황을 공유하고 싶다"],
  },
  {
    taskId: "STR-026",
    taskName: "Stakeholder Journey",
    domain: "strategy",
    keywords: ["여정", "journey", "경험", "터치포인트"],
    intentPatterns: ["이해관계자 여정을 설계하고 싶다", "경험을 매핑하고 싶다"],
  },

  // ============ STRATEGY DOMAIN - Skill 3: Risk Management (STR-027~040) ============
  {
    taskId: "STR-027",
    taskName: "Risk Identification",
    domain: "strategy",
    keywords: ["리스크 식별", "risk identification", "위험 찾기", "리스크 발견"],
    intentPatterns: ["어떤 리스크가 있나", "위험을 찾고 싶다"],
  },
  {
    taskId: "STR-028",
    taskName: "Risk Assessment",
    domain: "strategy",
    keywords: ["리스크 평가", "risk assessment", "위험 분석", "영향도"],
    intentPatterns: ["리스크를 평가하고 싶다", "위험 수준이 어떤가"],
  },
  {
    taskId: "STR-029",
    taskName: "Risk Prioritization",
    domain: "strategy",
    keywords: ["리스크 우선순위", "risk priority", "중요 리스크"],
    intentPatterns: ["어떤 리스크를 먼저 다뤄야 하나", "리스크 순위를 정하고 싶다"],
  },
  {
    taskId: "STR-030",
    taskName: "Risk Mitigation",
    domain: "strategy",
    keywords: ["완화", "mitigation", "대응", "저감"],
    intentPatterns: ["리스크를 줄이고 싶다", "완화 방안이 필요하다"],
  },
  {
    taskId: "STR-031",
    taskName: "Contingency Planning",
    domain: "strategy",
    keywords: ["비상 계획", "contingency", "백업", "대안"],
    intentPatterns: ["비상 계획이 필요하다", "만약의 경우 대비책"],
  },
  {
    taskId: "STR-032",
    taskName: "Risk Monitoring",
    domain: "strategy",
    keywords: ["리스크 모니터링", "risk monitoring", "감시", "추적"],
    intentPatterns: ["리스크를 지속 모니터링하고 싶다", "위험 추적이 필요하다"],
  },
  {
    taskId: "STR-033",
    taskName: "Risk Reporting",
    domain: "strategy",
    keywords: ["리스크 보고", "risk report", "현황 보고"],
    intentPatterns: ["리스크 현황을 보고하고 싶다", "위험 상태 공유"],
  },
  {
    taskId: "STR-034",
    taskName: "Risk Communication",
    domain: "strategy",
    keywords: ["리스크 커뮤니케이션", "위험 전달", "공유"],
    intentPatterns: ["리스크를 팀에 알리고 싶다", "위험 정보를 공유하고 싶다"],
  },
  {
    taskId: "STR-035",
    taskName: "Risk Review",
    domain: "strategy",
    keywords: ["리스크 검토", "risk review", "재평가"],
    intentPatterns: ["리스크를 다시 검토하고 싶다", "위험 상황이 바뀌었다"],
  },
  {
    taskId: "STR-036",
    taskName: "Risk Governance",
    domain: "strategy",
    keywords: ["리스크 거버넌스", "governance", "관리 체계", "의사결정"],
    intentPatterns: ["리스크 관리 체계가 필요하다", "누가 어떻게 결정하나"],
  },
  {
    taskId: "STR-037",
    taskName: "Insurance Analysis",
    domain: "strategy",
    keywords: ["보험", "insurance", "보장", "커버리지"],
    intentPatterns: ["보험이 필요한가", "어떤 보험이 필요하나"],
  },
  {
    taskId: "STR-038",
    taskName: "Safety Risk Management",
    domain: "strategy",
    keywords: ["안전", "safety", "사고", "재해"],
    intentPatterns: ["안전 리스크를 관리하고 싶다", "사고 예방이 필요하다"],
  },
  {
    taskId: "STR-039",
    taskName: "Vendor Risk Assessment",
    domain: "strategy",
    keywords: ["공급사 리스크", "vendor risk", "협력업체 위험"],
    intentPatterns: ["공급사 리스크를 평가하고 싶다", "벤더 신뢰성 확인"],
  },
  {
    taskId: "STR-040",
    taskName: "Risk Culture",
    domain: "strategy",
    keywords: ["리스크 문화", "risk culture", "인식", "태도"],
    intentPatterns: ["팀의 리스크 인식을 높이고 싶다", "리스크 문화를 만들고 싶다"],
  },

  // ============ STRATEGY DOMAIN - Skill 4: Strategic Alignment (STR-041~054) ============
  {
    taskId: "STR-041",
    taskName: "Strategic Objectives",
    domain: "strategy",
    keywords: ["전략 목표", "strategic objectives", "BSC", "밸런스드 스코어카드"],
    intentPatterns: ["전략적 목표를 수립하고 싶다", "BSC가 필요하다"],
  },
  {
    taskId: "STR-042",
    taskName: "Strategy Mapping",
    domain: "strategy",
    keywords: ["전략 맵", "strategy map", "인과관계", "연결"],
    intentPatterns: ["전략 맵이 필요하다", "목표 간 연결을 보고 싶다"],
  },
  {
    taskId: "STR-043",
    taskName: "KPI Design",
    domain: "strategy",
    keywords: ["KPI 설계", "지표 설계", "측정", "대시보드"],
    intentPatterns: ["KPI를 설계하고 싶다", "무엇을 측정해야 하나"],
  },
  {
    taskId: "STR-044",
    taskName: "Initiative Planning",
    domain: "strategy",
    keywords: ["이니셔티브", "initiative", "실행 계획", "프로젝트"],
    intentPatterns: ["실행 이니셔티브를 계획하고 싶다", "프로젝트를 정의하고 싶다"],
  },
  {
    taskId: "STR-045",
    taskName: "Resource Alignment",
    domain: "strategy",
    keywords: ["자원 정렬", "resource alignment", "배분", "할당"],
    intentPatterns: ["자원을 전략에 맞게 배분하고 싶다", "예산 정렬이 필요하다"],
  },
  {
    taskId: "STR-046",
    taskName: "Capability Assessment",
    domain: "strategy",
    keywords: ["역량 평가", "capability", "능력", "강점 약점"],
    intentPatterns: ["우리 역량이 어떤가", "역량 갭을 분석하고 싶다"],
  },
  {
    taskId: "STR-047",
    taskName: "Change Management",
    domain: "strategy",
    keywords: ["변화 관리", "change management", "변경", "전환"],
    intentPatterns: ["변화를 관리하고 싶다", "조직 변화가 필요하다"],
  },
  {
    taskId: "STR-048",
    taskName: "Performance Monitoring",
    domain: "strategy",
    keywords: ["성과 모니터링", "performance monitoring", "KPI 추적"],
    intentPatterns: ["성과를 모니터링하고 싶다", "진행 상황을 보고 싶다"],
  },
  {
    taskId: "STR-049",
    taskName: "Strategic Review",
    domain: "strategy",
    keywords: ["전략 검토", "strategic review", "평가", "효과성"],
    intentPatterns: ["전략을 검토하고 싶다", "전략이 효과적인가"],
  },
  {
    taskId: "STR-050",
    taskName: "Strategy Adaptation",
    domain: "strategy",
    keywords: ["전략 적응", "adaptation", "조정", "피벗"],
    intentPatterns: ["전략을 조정해야 하나", "환경이 변해서 전략 수정"],
  },
  {
    taskId: "STR-051",
    taskName: "Benchmark Analysis",
    domain: "strategy",
    keywords: ["벤치마크", "benchmark", "비교", "베스트 프랙티스"],
    intentPatterns: ["벤치마크 분석이 필요하다", "다른 데와 비교하고 싶다"],
  },
  {
    taskId: "STR-052",
    taskName: "Value Proposition",
    domain: "strategy",
    keywords: ["가치 제안", "value proposition", "차별화", "USP"],
    intentPatterns: ["가치 제안이 필요하다", "왜 우리 이벤트인가"],
  },
  {
    taskId: "STR-053",
    taskName: "Scenario Planning",
    domain: "strategy",
    keywords: ["시나리오 플래닝", "scenario", "미래 예측", "what-if"],
    intentPatterns: ["시나리오를 만들고 싶다", "여러 상황을 대비하고 싶다"],
  },
  {
    taskId: "STR-054",
    taskName: "Strategic Integration",
    domain: "strategy",
    keywords: ["전략 통합", "integration", "조정", "시너지"],
    intentPatterns: ["전략을 통합하고 싶다", "부서 간 조율이 필요하다"],
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

## CRITICAL: OUT-OF-SCOPE DETECTION

This system is ONLY for EVENT PLANNING and MANAGEMENT. If the question is about:
- Weather, news, general knowledge
- Personal questions (relationships, health, etc.)
- Unrelated topics (cooking, sports scores, etc.)
- Technical support for unrelated products
- Any topic NOT related to event planning, finance, strategy, or management

You MUST return "out_of_scope" domain with taskId "NONE".

## Available Agents (122 total)

### Strategy Domain (STR-001~054) - CMP-IS Domain A: Strategic Planning
**Skill 1: Goal Setting (STR-001~013)**
- STR-001~013: 이벤트 목표 설정, 비전/미션, KPI, 마일스톤, 목표 추적/검토

**Skill 2: Stakeholder Analysis (STR-014~026)**
- STR-014~026: 이해관계자 식별/매핑/우선순위, 기대 관리, 갈등 해결, 협상

**Skill 3: Risk Management (STR-027~040)**
- STR-027~040: 리스크 식별/평가/우선순위, 완화/비상계획, 보험, 안전 리스크

**Skill 4: Strategic Alignment (STR-041~054)**
- STR-041~054: 전략 목표(BSC), KPI 설계, 변화 관리, 벤치마크, 시나리오 플래닝

### Finance Domain (FIN-001~068)
${agentList}

## ROUTING RULES

1. **Out-of-Scope Check FIRST**: If NOT related to event management, return out_of_scope immediately
2. **Intent-Based Selection**: Focus on what the user WANTS TO DO, not just keywords
3. **Domain Priority**:
   - Questions about GOALS, STAKEHOLDERS, RISKS → Strategy (STR-*)
   - Questions about MONEY, BUDGET, PRICING, SPONSORS → Finance (FIN-*)
4. **Specificity**: Choose the most specific agent that matches the intent
5. **Confidence**: Rate your confidence from 0.0 to 1.0

## OUTPUT FORMAT (STRICT JSON)

You MUST respond with ONLY a valid JSON object:
{
  "taskId": "FIN-001 or STR-001 or NONE",
  "domain": "finance" or "strategy" or "out_of_scope",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this agent was selected or why it's out of scope"
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

      // Out-of-Scope 체크
      if (parsed.domain === "out_of_scope" || parsed.taskId === "NONE") {
        return {
          taskId: "NONE",
          domain: "out_of_scope",
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
          reasoning: parsed.reasoning || "This question is outside the scope of event management",
          isOutOfScope: true,
        };
      }

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
        isOutOfScope: false,
      };
    } catch {
      // 파싱 실패 시 fallback
      return this.fallbackRoute(originalQuestion);
    }
  }

  /**
   * Out-of-Scope 키워드 체크
   */
  private isOutOfScopeQuestion(question: string): boolean {
    const lowerQuestion = question.toLowerCase();

    // Out-of-scope 키워드 패턴
    const outOfScopePatterns = [
      // 날씨
      "날씨", "기온", "비가", "눈이", "weather", "temperature", "forecast",
      // 일반 지식
      "뉴스", "news", "정치", "politics", "축구", "야구", "basketball",
      // 개인적 질문
      "연애", "데이트", "건강", "다이어트", "요리", "레시피", "cooking",
      // 기술 지원 (비이벤트)
      "아이폰", "iphone", "안드로이드", "android", "컴퓨터 수리",
      // 기타
      "주식", "stock", "비트코인", "bitcoin", "crypto",
    ];

    // 이벤트 관련 키워드 - 이게 있으면 out-of-scope 아님
    const eventRelatedPatterns = [
      "이벤트", "event", "행사", "컨퍼런스", "conference", "세미나", "seminar",
      "목표", "goal", "예산", "budget", "스폰서", "sponsor", "리스크", "risk",
      "이해관계자", "stakeholder", "전략", "strategy", "참가자", "attendee",
      "등록", "registration", "가격", "price", "비용", "cost", "수익", "revenue",
    ];

    // 이벤트 관련 키워드가 있으면 out-of-scope 아님
    for (const pattern of eventRelatedPatterns) {
      if (lowerQuestion.includes(pattern)) {
        return false;
      }
    }

    // Out-of-scope 키워드가 있으면 true
    for (const pattern of outOfScopePatterns) {
      if (lowerQuestion.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Fallback: 키워드 기반 라우팅
   */
  private fallbackRoute(question: string): RouterOutput {
    const lowerQuestion = question.toLowerCase();

    // Out-of-scope 체크
    if (this.isOutOfScopeQuestion(question)) {
      return {
        taskId: "NONE",
        domain: "out_of_scope",
        confidence: 0.85,
        reasoning: "This question is not related to event management",
        isOutOfScope: true,
      };
    }

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
          isOutOfScope: false,
        };
      }
      return {
        taskId: "FIN-031",
        domain: "finance",
        confidence: 0.3,
        reasoning: "Fallback: No strong keyword match, defaulting to budget structure",
        isOutOfScope: false,
      };
    }

    return {
      taskId: bestMatch.agent.taskId,
      domain: bestMatch.agent.domain,
      confidence: Math.min(bestMatch.score / 30, 0.9),
      reasoning: `Keyword matching: ${bestMatch.agent.taskName}`,
      isOutOfScope: false,
    };
  }

  /**
   * 에이전트 카탈로그 조회
   */
  static getAgentCatalog(): AgentMetadata[] {
    return AGENT_CATALOG;
  }

  /**
   * 에이전트 통계 조회
   */
  static getAgentStats(): {
    total: number;
    byDomain: Record<string, number>;
  } {
    const stats = {
      total: AGENT_CATALOG.length,
      byDomain: {} as Record<string, number>,
    };

    for (const agent of AGENT_CATALOG) {
      if (!stats.byDomain[agent.domain]) {
        stats.byDomain[agent.domain] = 0;
      }
      stats.byDomain[agent.domain]++;
    }

    return stats;
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
