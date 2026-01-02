/**
 * Strategy Domain Agent Registry
 *
 * CMP-IS Domain A: Strategic Planning
 * - Skill 1: Goal Setting (STR-001)
 * - Skill 2: Stakeholder Analysis (STR-002)
 * - Skill 3: Risk Assessment (STR-003)
 *
 * Total: 3 Agents (AI: 3)
 */

// =============================================================================
// AGENT IMPORTS
// =============================================================================

import STR_001 from "./STR_001_GoalSetting";
import STR_002 from "./STR_002_StakeholderAnalysis";
import STR_003 from "./STR_003_RiskIdentification";

// =============================================================================
// TYPES
// =============================================================================

export interface StrategyAgent {
  taskId: string;
  taskName: string;
  domain: string;
  skill: string;
  taskType: "AI" | "Human" | "Hybrid";
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  persona: string;
  execute: (input: unknown) => Promise<unknown>;
}

// =============================================================================
// AGENT REGISTRY
// =============================================================================

const agents: StrategyAgent[] = [
  STR_001,
  STR_002,
  STR_003,
];

// Map for quick lookup
const agentMap = new Map<string, StrategyAgent>();
agents.forEach((agent) => {
  agentMap.set(agent.taskId, agent);
});

// =============================================================================
// AGENT PERSONAS (for LLM enhancement)
// =============================================================================

export const agentPersonas: Record<string, string> = {
  "STR-001": STR_001.persona,
  "STR-002": STR_002.persona,
  "STR-003": STR_003.persona,
};

// =============================================================================
// REGISTRY FUNCTIONS
// =============================================================================

/**
 * 모든 에이전트 목록 조회
 */
export function listAgents(filters?: {
  skill?: string;
  taskType?: "AI" | "Human" | "Hybrid";
}): StrategyAgent[] {
  let result = [...agents];

  if (filters?.skill) {
    result = result.filter((a) => a.skill.toLowerCase().includes(filters.skill!.toLowerCase()));
  }

  if (filters?.taskType) {
    result = result.filter((a) => a.taskType === filters.taskType);
  }

  return result;
}

/**
 * 특정 에이전트 조회
 */
export function getAgent(taskId: string): StrategyAgent | undefined {
  return agentMap.get(taskId);
}

/**
 * 에이전트 실행
 */
export async function executeAgent(
  taskId: string,
  input: unknown
): Promise<unknown> {
  const agent = getAgent(taskId);
  if (!agent) {
    throw new Error(`Agent not found: ${taskId}`);
  }
  return agent.execute(input);
}

/**
 * AI 보강 에이전트 실행
 *
 * Finance 도메인과 동일한 패턴:
 * 1. 로컬 로직 실행
 * 2. Llama 3.3으로 결과 검토 및 보강
 * 3. Short-term Memory 세션 컨텍스트 지원
 */
export async function executeAgentWithLLM(
  taskId: string,
  input: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ai: any,
  shortTermMemory?: string,
  userPreferences?: {
    language?: string;
    detail_level?: "brief" | "standard" | "detailed";
    industry_focus?: string;
    past_topics?: string[];
  }
): Promise<{
  result: unknown;
  ai_enhanced: boolean;
  ai_insights?: {
    analysis: string;
    recommendations: string[];
    risk_factors: string[];
    confidence_score: number;
    evolution_note?: string;
    gap_detected?: {
      type: "MISSING_FEAT" | "LOGIC_ERROR" | "USER_FRUSTRATION" | "DATA_GAP" | "PERF_ISSUE";
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      suggested_fix?: string;
    };
  };
  ai_error?: string;
}> {
  const agent = getAgent(taskId);
  if (!agent) {
    throw new Error(`Agent not found: ${taskId}`);
  }

  // 1. 로컬 로직 실행
  const localResult = await agent.execute(input);

  // 2. AI 타입 에이전트만 LLM으로 보강
  if (agent.taskType !== "AI") {
    return {
      result: localResult,
      ai_enhanced: false,
    };
  }

  // 3. Cloudflare Workers AI 연동 + Short-term Memory + User Preferences 주입
  try {
    const { createAIClient } = await import("../../lib/ai");
    const aiClient = createAIClient(ai);

    const persona = agentPersonas[taskId] || agent.skill;

    const context = {
      taskId: agent.taskId,
      taskName: agent.taskName,
      persona,
      input,
      localResult,
      shortTermMemory,
      userPreferences,
    };

    const enhanced = await aiClient.enhanceAgentResult(context);

    return {
      result: enhanced.enhanced_result || localResult,
      ai_enhanced: true,
      ai_insights: enhanced.ai_insights,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Cloudflare AI enhancement failed:", errorMessage);
    return {
      result: localResult,
      ai_enhanced: false,
      ai_error: errorMessage,
    };
  }
}

/**
 * 레지스트리 요약 출력
 */
export function getRegistrySummary(): {
  total: number;
  bySkill: Record<string, number>;
  byTaskType: Record<string, number>;
} {
  const bySkill: Record<string, number> = {};
  const byTaskType: Record<string, number> = {};

  agents.forEach((agent) => {
    bySkill[agent.skill] = (bySkill[agent.skill] || 0) + 1;
    byTaskType[agent.taskType] = (byTaskType[agent.taskType] || 0) + 1;
  });

  return {
    total: agents.length,
    bySkill,
    byTaskType,
  };
}

export default {
  listAgents,
  getAgent,
  executeAgent,
  executeAgentWithLLM,
  getRegistrySummary,
};
