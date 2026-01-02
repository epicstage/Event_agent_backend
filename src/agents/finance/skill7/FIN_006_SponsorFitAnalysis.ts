/**
 * FIN-006: 스폰서 적합성 분석 (이벤트 호환성)
 *
 * CMP-IS Reference: 7.1.d - Identifying potential sponsors
 * Task Type: AI
 *
 * Input: 스폰서 브랜드 정보, 이벤트 성격
 * Output: 적합성 점수 및 이유
 */

import { z } from "zod";
import { generateUUID, nowISO } from "../../../schemas/financial";

// =============================================================================
// AGENT PERSONA
// =============================================================================

export const AGENT_PERSONA = `You are an expert Sponsor Fit Analysis Agent specializing in brand-event alignment evaluation.

Your expertise includes:
- Analyzing brand values and event characteristics for compatibility
- Evaluating audience overlap between sponsor and event
- Assessing potential brand risks and benefits
- Providing strategic alignment recommendations

CMP-IS Standard: 7.1.d - Identifying potential sponsors

You provide objective compatibility assessments that help event organizers select sponsors who will enhance rather than detract from the event experience.`;

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

export const InputSchema = z.object({
  event_id: z.string().uuid().describe("이벤트 ID"),
  sponsor_profile: z.object({
    company_name: z.string().describe("회사명"),
    industry: z.string().describe("산업"),
    brand_values: z.array(z.string()).describe("브랜드 핵심 가치"),
    target_demographics: z
      .object({
        age_range: z.string().optional(),
        income_level: z.string().optional(),
        interests: z.array(z.string()).optional(),
      })
      .optional()
      .describe("타겟 고객층"),
    brand_image: z
      .enum(["premium", "mainstream", "budget", "innovative", "traditional"])
      .describe("브랜드 이미지"),
    controversy_history: z.array(z.string()).optional().describe("과거 논란 이력"),
    competitor_brands: z.array(z.string()).optional().describe("경쟁 브랜드"),
  }),
  event_profile: z.object({
    event_name: z.string().describe("이벤트명"),
    event_type: z.string().describe("이벤트 유형"),
    event_values: z.array(z.string()).describe("이벤트 핵심 가치"),
    attendee_profile: z
      .object({
        age_range: z.string().optional(),
        income_level: z.string().optional(),
        interests: z.array(z.string()).optional(),
        professional_level: z.string().optional(),
      })
      .describe("참석자 프로필"),
    event_tone: z
      .enum(["formal", "casual", "innovative", "educational", "entertainment"])
      .describe("이벤트 톤"),
    existing_sponsors: z.array(z.string()).optional().describe("기존 확정 스폰서"),
  }),
});

export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  analysis_id: z.string().uuid().describe("분석 ID"),
  event_id: z.string().uuid(),
  company_name: z.string(),
  overall_fit_score: z.number().min(0).max(100).describe("종합 적합도 점수"),
  fit_grade: z.enum(["A", "B", "C", "D", "F"]).describe("적합도 등급"),
  recommendation: z
    .enum(["highly_recommended", "recommended", "conditional", "not_recommended"])
    .describe("추천 수준"),
  dimension_scores: z
    .object({
      brand_alignment: z.number().min(0).max(100).describe("브랜드 가치 정렬"),
      audience_overlap: z.number().min(0).max(100).describe("타겟 오디언스 중복"),
      image_compatibility: z.number().min(0).max(100).describe("이미지 호환성"),
      risk_assessment: z.number().min(0).max(100).describe("리스크 평가 (높을수록 안전)"),
    })
    .describe("차원별 점수"),
  strengths: z.array(z.string()).describe("강점"),
  concerns: z.array(z.string()).describe("우려 사항"),
  risk_factors: z
    .array(
      z.object({
        factor: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        mitigation: z.string(),
      })
    )
    .describe("리스크 요인"),
  competitor_conflicts: z.array(z.string()).describe("경쟁사 충돌"),
  strategic_recommendations: z.array(z.string()).describe("전략적 권고"),
  analyzed_at: z.string(),
});

export type Output = z.infer<typeof OutputSchema>;

// =============================================================================
// TASK LOGIC
// =============================================================================

/**
 * 브랜드 가치 정렬 점수 계산
 */
function calculateBrandAlignment(
  brandValues: string[],
  eventValues: string[]
): { score: number; matches: string[] } {
  const normalizedBrand = brandValues.map((v) => v.toLowerCase());
  const normalizedEvent = eventValues.map((v) => v.toLowerCase());

  const matches = normalizedBrand.filter(
    (bv) =>
      normalizedEvent.some((ev) => ev.includes(bv) || bv.includes(ev))
  );

  const score = Math.min(
    100,
    (matches.length / Math.max(brandValues.length, eventValues.length)) * 100 + 30
  );

  return {
    score: Math.round(score),
    matches: matches.map(
      (m) => brandValues.find((v) => v.toLowerCase() === m) || m
    ),
  };
}

/**
 * 오디언스 중복 점수 계산
 */
function calculateAudienceOverlap(
  sponsorDemo: z.infer<typeof InputSchema>["sponsor_profile"]["target_demographics"],
  attendeeProfile: z.infer<typeof InputSchema>["event_profile"]["attendee_profile"]
): number {
  let score = 50; // 기준점

  if (!sponsorDemo) return score;

  // 연령대 매칭
  if (sponsorDemo.age_range && attendeeProfile.age_range) {
    if (sponsorDemo.age_range === attendeeProfile.age_range) {
      score += 20;
    }
  }

  // 소득 수준 매칭
  if (sponsorDemo.income_level && attendeeProfile.income_level) {
    if (sponsorDemo.income_level === attendeeProfile.income_level) {
      score += 15;
    }
  }

  // 관심사 매칭
  if (sponsorDemo.interests && attendeeProfile.interests) {
    const overlap = sponsorDemo.interests.filter((i) =>
      attendeeProfile.interests!.some(
        (ai) => ai.toLowerCase().includes(i.toLowerCase())
      )
    );
    score += Math.min(15, overlap.length * 5);
  }

  return Math.min(100, score);
}

/**
 * 이미지 호환성 점수 계산
 */
function calculateImageCompatibility(
  brandImage: string,
  eventTone: string
): number {
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    premium: {
      formal: 95,
      casual: 60,
      innovative: 80,
      educational: 75,
      entertainment: 65,
    },
    mainstream: {
      formal: 70,
      casual: 90,
      innovative: 75,
      educational: 80,
      entertainment: 85,
    },
    budget: {
      formal: 40,
      casual: 85,
      innovative: 50,
      educational: 70,
      entertainment: 80,
    },
    innovative: {
      formal: 70,
      casual: 80,
      innovative: 95,
      educational: 85,
      entertainment: 75,
    },
    traditional: {
      formal: 90,
      casual: 60,
      innovative: 50,
      educational: 80,
      entertainment: 55,
    },
  };

  return compatibilityMatrix[brandImage]?.[eventTone] || 60;
}

/**
 * 리스크 평가 (높을수록 안전)
 */
function assessRisk(
  controversyHistory: string[] | undefined,
  competitorBrands: string[] | undefined,
  existingSponsors: string[] | undefined
): { score: number; factors: z.infer<typeof OutputSchema>["risk_factors"]; conflicts: string[] } {
  let score = 100;
  const factors: z.infer<typeof OutputSchema>["risk_factors"] = [];
  const conflicts: string[] = [];

  // 논란 이력
  if (controversyHistory && controversyHistory.length > 0) {
    score -= controversyHistory.length * 15;
    factors.push({
      factor: `과거 논란 이력 ${controversyHistory.length}건`,
      severity: controversyHistory.length > 2 ? "high" : "medium",
      mitigation: "미디어 모니터링 강화 및 위기 대응 계획 수립",
    });
  }

  // 경쟁사 충돌
  if (competitorBrands && existingSponsors) {
    const conflicting = competitorBrands.filter((cb) =>
      existingSponsors.some(
        (es) =>
          es.toLowerCase().includes(cb.toLowerCase()) ||
          cb.toLowerCase().includes(es.toLowerCase())
      )
    );
    if (conflicting.length > 0) {
      score -= conflicting.length * 20;
      conflicts.push(...conflicting);
      factors.push({
        factor: `경쟁사 충돌: ${conflicting.join(", ")}`,
        severity: "high",
        mitigation: "독점 조항 검토 및 별도 노출 영역 확보",
      });
    }
  }

  return {
    score: Math.max(0, score),
    factors,
    conflicts,
  };
}

/**
 * 종합 등급 결정
 */
function determineGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

/**
 * 추천 수준 결정
 */
function determineRecommendation(
  score: number,
  riskFactors: z.infer<typeof OutputSchema>["risk_factors"]
): "highly_recommended" | "recommended" | "conditional" | "not_recommended" {
  const hasHighRisk = riskFactors.some((r) => r.severity === "high");

  if (score >= 80 && !hasHighRisk) return "highly_recommended";
  if (score >= 65 && !hasHighRisk) return "recommended";
  if (score >= 50 || (score >= 40 && !hasHighRisk)) return "conditional";
  return "not_recommended";
}

/**
 * FIN-006 메인 실행 함수
 */
export async function execute(input: Input): Promise<Output> {
  // 입력 검증
  const validatedInput = InputSchema.parse(input);
  const { sponsor_profile, event_profile } = validatedInput;

  // 차원별 점수 계산
  const brandAlignment = calculateBrandAlignment(
    sponsor_profile.brand_values,
    event_profile.event_values
  );

  const audienceOverlap = calculateAudienceOverlap(
    sponsor_profile.target_demographics,
    event_profile.attendee_profile
  );

  const imageCompatibility = calculateImageCompatibility(
    sponsor_profile.brand_image,
    event_profile.event_tone
  );

  const riskAssessment = assessRisk(
    sponsor_profile.controversy_history,
    sponsor_profile.competitor_brands,
    event_profile.existing_sponsors
  );

  // 종합 점수 계산 (가중 평균)
  const overallScore = Math.round(
    brandAlignment.score * 0.3 +
      audienceOverlap * 0.25 +
      imageCompatibility * 0.25 +
      riskAssessment.score * 0.2
  );

  // 강점 도출
  const strengths: string[] = [];
  if (brandAlignment.score >= 70) {
    strengths.push(`브랜드 가치 정렬: ${brandAlignment.matches.join(", ")}`);
  }
  if (audienceOverlap >= 70) {
    strengths.push("타겟 오디언스 높은 중복률");
  }
  if (imageCompatibility >= 80) {
    strengths.push("이벤트 톤과 우수한 이미지 호환성");
  }
  if (riskAssessment.score >= 80) {
    strengths.push("낮은 리스크 프로필");
  }

  // 우려 사항 도출
  const concerns: string[] = [];
  if (brandAlignment.score < 50) {
    concerns.push("브랜드 가치와 이벤트 가치 간 정렬 부족");
  }
  if (audienceOverlap < 50) {
    concerns.push("타겟 오디언스 중복 낮음");
  }
  if (imageCompatibility < 50) {
    concerns.push("브랜드 이미지와 이벤트 톤 불일치");
  }
  if (riskAssessment.conflicts.length > 0) {
    concerns.push(`경쟁사 스폰서 존재: ${riskAssessment.conflicts.join(", ")}`);
  }

  // 전략적 권고
  const recommendations: string[] = [];
  if (overallScore >= 70) {
    recommendations.push("적극적인 스폰서십 제안 권장");
    recommendations.push("맞춤형 활성화 프로그램 제안으로 가치 극대화");
  } else if (overallScore >= 50) {
    recommendations.push("조건부 스폰서십 논의 가능");
    recommendations.push("부족한 영역 보완을 위한 맞춤 혜택 설계 필요");
  } else {
    recommendations.push("스폰서십 진행 시 신중한 검토 필요");
    recommendations.push("대안 스폰서 후보 우선 탐색 권장");
  }

  const output: Output = {
    analysis_id: generateUUID(),
    event_id: validatedInput.event_id,
    company_name: sponsor_profile.company_name,
    overall_fit_score: overallScore,
    fit_grade: determineGrade(overallScore),
    recommendation: determineRecommendation(overallScore, riskAssessment.factors),
    dimension_scores: {
      brand_alignment: brandAlignment.score,
      audience_overlap: audienceOverlap,
      image_compatibility: imageCompatibility,
      risk_assessment: riskAssessment.score,
    },
    strengths,
    concerns,
    risk_factors: riskAssessment.factors,
    competitor_conflicts: riskAssessment.conflicts,
    strategic_recommendations: recommendations,
    analyzed_at: nowISO(),
  };

  // 출력 검증
  return OutputSchema.parse(output);
}

// =============================================================================
// AGENT METADATA
// =============================================================================

export const AGENT_METADATA = {
  taskId: "FIN-006",
  taskName: "스폰서 적합성 분석",
  taskType: "AI" as const,
  cmpReference: "CMP-IS 7.1.d",
  skill: "Skill 7: Manage Event Funding",
  subSkill: "7.1: Develop Budgeting Processes for Funding",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  execute,
};

export default AGENT_METADATA;
