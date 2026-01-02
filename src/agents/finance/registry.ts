/**
 * Finance Domain Agent Registry
 *
 * CMP-IS Domain D: Financial Management
 * Skill 7: Manage Event Funding (FIN-001 ~ FIN-016)
 *
 * 이 레지스트리는 16개의 재무 관리 에이전트를 시스템에서
 * 동적으로 호출할 수 있도록 맵핑합니다.
 */

// =============================================================================
// SKILL 7 AGENT IMPORTS
// =============================================================================

import FIN_001 from "./skill7/FIN_001_SponsorshipValueAssessment";
import FIN_002 from "./skill7/FIN_002_BenefitCostEstimation";
import FIN_003 from "./skill7/FIN_003_StakeholderApproval";
import FIN_004 from "./skill7/FIN_004_LegalReviewRequest";
import FIN_005 from "./skill7/FIN_005_PotentialSponsorIdentification";
import FIN_006 from "./skill7/FIN_006_SponsorFitAnalysis";
import FIN_007 from "./skill7/FIN_007_ExclusivityConflictCheck";
import FIN_008 from "./skill7/FIN_008_SponsorProposalGenerator";
import FIN_009 from "./skill7/FIN_009_ProposalDistribution";
import FIN_010 from "./skill7/FIN_010_InitialSponsorContact";
import FIN_011 from "./skill7/FIN_011_SupportTypeIdentification";
import FIN_012 from "./skill7/FIN_012_CommitmentNegotiation";
import FIN_013 from "./skill7/FIN_013_ContractDrafting";
import FIN_014 from "./skill7/FIN_014_RelationshipMaintenance";
import FIN_015 from "./skill7/FIN_015_ContractFulfillmentTracking";
import FIN_016 from "./skill7/FIN_016_SponsorROIEvaluation";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TaskType = "AI" | "Human" | "Hybrid";

export interface AgentMetadata {
  taskId: string;
  taskName: string;
  taskType: TaskType;
  cmpReference: string;
  skill: string;
  subSkill: string;
  inputSchema: unknown;
  outputSchema: unknown;
  execute: (input: unknown) => Promise<unknown>;
}

export interface AgentRegistry {
  [taskId: string]: AgentMetadata;
}

// =============================================================================
// SKILL 7 REGISTRY
// =============================================================================

export const skill7Agents: AgentRegistry = {
  "FIN-001": FIN_001,
  "FIN-002": FIN_002,
  "FIN-003": FIN_003,
  "FIN-004": FIN_004,
  "FIN-005": FIN_005,
  "FIN-006": FIN_006,
  "FIN-007": FIN_007,
  "FIN-008": FIN_008,
  "FIN-009": FIN_009,
  "FIN-010": FIN_010,
  "FIN-011": FIN_011,
  "FIN-012": FIN_012,
  "FIN-013": FIN_013,
  "FIN-014": FIN_014,
  "FIN-015": FIN_015,
  "FIN-016": FIN_016,
};

// =============================================================================
// FULL FINANCE REGISTRY (Domain D)
// =============================================================================

export const financeAgents: AgentRegistry = {
  ...skill7Agents,
  // Future: Skill 8 agents (FIN-017 ~ FIN-040)
  // Future: Skill 9 agents (FIN-041 ~ FIN-068)
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * 태스크 ID로 에이전트 조회
 */
export function getAgent(taskId: string): AgentMetadata | undefined {
  return financeAgents[taskId];
}

/**
 * 태스크 타입별 에이전트 필터링
 */
export function getAgentsByType(taskType: TaskType): AgentMetadata[] {
  return Object.values(financeAgents).filter(
    (agent) => agent.taskType === taskType
  );
}

/**
 * 스킬별 에이전트 필터링
 */
export function getAgentsBySkill(skillNumber: number): AgentMetadata[] {
  const skillPrefix = `Skill ${skillNumber}:`;
  return Object.values(financeAgents).filter((agent) =>
    agent.skill.startsWith(skillPrefix)
  );
}

/**
 * CMP-IS 레퍼런스로 에이전트 조회
 */
export function getAgentByCmpReference(
  reference: string
): AgentMetadata | undefined {
  return Object.values(financeAgents).find(
    (agent) => agent.cmpReference === reference
  );
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
 * 레지스트리 요약 출력
 */
export function getRegistrySummary(): {
  total: number;
  byType: Record<TaskType, number>;
  bySkill: Record<string, number>;
} {
  const agents = Object.values(financeAgents);

  const byType: Record<TaskType, number> = {
    AI: 0,
    Human: 0,
    Hybrid: 0,
  };

  const bySkill: Record<string, number> = {};

  for (const agent of agents) {
    byType[agent.taskType]++;

    const skillKey = agent.skill.split(":")[0];
    bySkill[skillKey] = (bySkill[skillKey] || 0) + 1;
  }

  return {
    total: agents.length,
    byType,
    bySkill,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default financeAgents;

// Re-export individual agents for direct imports
export {
  FIN_001,
  FIN_002,
  FIN_003,
  FIN_004,
  FIN_005,
  FIN_006,
  FIN_007,
  FIN_008,
  FIN_009,
  FIN_010,
  FIN_011,
  FIN_012,
  FIN_013,
  FIN_014,
  FIN_015,
  FIN_016,
};
