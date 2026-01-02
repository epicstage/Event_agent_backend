/**
 * Global Standard Event Agent API
 *
 * 이벤트 기획 및 실행을 위한 AI-Native Agent System API.
 * - CMP International Standards 준수
 * - EMBOK 5x5 Matrix 기반 도메인 설계
 * - Cvent REST API 호환
 *
 * Version: 0.1.0
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./types";
import finance from "./routes/finance";
import strategy from "./routes/strategy";
import ask from "./routes/ask";
import { IntelligentRouter } from "./lib/router";
import { listAgents as listFinanceAgents } from "./agents/finance/registry";
import { listAgents as listStrategyAgents } from "./agents/strategy/registry";

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = new Hono<{ Bindings: Env }>();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Logger
app.use("*", logger());

// CORS - Lovable 및 모든 프론트엔드 허용
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// =============================================================================
// ROUTES
// =============================================================================

// Finance Router (/finance/*)
app.route("/finance", finance);

// Strategy Router (/strategy/*)
app.route("/strategy", strategy);

// Intelligent Ask Router (/ask/*)
app.route("/ask", ask);

// =============================================================================
// ROOT ENDPOINTS
// =============================================================================

/**
 * GET /
 * API 상태 확인
 */
app.get("/", (c) => {
  return c.json({
    message: "Global Standard Event Agent API is Running",
    version: "0.3.0",
    standards: ["CMP-IS", "EMBOK", "APEX"],
    active_domains: ["Financial Management", "Strategic Planning"],
    features: ["Intelligent Router", "Session Memory", "Gap Detection"],
    endpoints: {
      ask: "/ask - Natural language routing & execution",
      finance: "/finance/agents - Financial management agents",
      strategy: "/strategy/agents - Strategic planning agents",
    },
    docs: "/docs",
  });
});

/**
 * GET /health
 * 헬스체크
 */
app.get("/health", (c) => {
  const financeAgents = listFinanceAgents();
  const strategyAgents = listStrategyAgents({});

  return c.json({
    status: "healthy",
    api_version: "0.3.0",
    total_agents: financeAgents.length + strategyAgents.length,
    domains: {
      strategic_planning: {
        status: "active",
        reference: "CMP-IS Domain A",
        agent_count: strategyAgents.length,
        skills: [
          "Skill 1: Goal Setting",
          "Skill 2: Stakeholder Analysis",
          "Skill 3: Risk Management",
          "Skill 4: Strategic Alignment",
        ],
      },
      financial_management: {
        status: "active",
        reference: "CMP-IS Domain D",
        agent_count: financeAgents.length,
        skills: [
          "Skill 7: Manage Event Funding",
          "Skill 8: Manage Budget",
          "Skill 9: Manage Monetary Transactions",
        ],
      },
      project_management: { status: "planned", reference: "CMP-IS Domain B" },
      risk_management: { status: "planned", reference: "CMP-IS Domain C" },
      human_resources: { status: "planned", reference: "CMP-IS Domain E" },
    },
  });
});

/**
 * GET /system/stats
 * 실시간 에이전트 통계 (Lovable UI 연동용)
 */
app.get("/system/stats", (c) => {
  const financeAgents = listFinanceAgents();
  const strategyAgents = listStrategyAgents({});
  const routerStats = IntelligentRouter.getAgentStats();

  // 타입별 분류
  const financeByType = { AI: 0, Human: 0, Hybrid: 0 };
  for (const agent of financeAgents) {
    financeByType[agent.taskType as keyof typeof financeByType]++;
  }

  const strategyByType = { AI: 0, Human: 0, Hybrid: 0 };
  for (const agent of strategyAgents) {
    strategyByType[agent.taskType as keyof typeof strategyByType]++;
  }

  return c.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_agents: financeAgents.length + strategyAgents.length,
    router_catalog_count: routerStats.total,
    domains: {
      finance: {
        code: "D",
        name: "Financial Management",
        total: financeAgents.length,
        by_type: financeByType,
        skills: ["Skill 7", "Skill 8", "Skill 9"],
      },
      strategy: {
        code: "A",
        name: "Strategic Planning",
        total: strategyAgents.length,
        by_type: strategyByType,
        skills: ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
      },
    },
    features: {
      intelligent_routing: true,
      session_memory: true,
      gap_detection: true,
      out_of_scope_detection: true,
    },
  });
});

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json(
    {
      error: "Internal Server Error",
      detail: err.message,
      path: c.req.url,
    },
    500
  );
});

// =============================================================================
// 404 HANDLER
// =============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      path: c.req.url,
    },
    404
  );
});

// =============================================================================
// EXPORT
// =============================================================================

export default app;
