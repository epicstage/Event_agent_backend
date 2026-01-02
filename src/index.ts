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
    version: "0.2.0",
    standards: ["CMP-IS", "EMBOK", "APEX"],
    active_domains: ["Financial Management", "Strategic Planning"],
    docs: "/docs",
  });
});

/**
 * GET /health
 * 헬스체크
 */
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    api_version: "0.2.0",
    domains: {
      strategic_planning: {
        status: "active",
        reference: "CMP-IS Domain A",
        skills: [
          "Skill 1: Goal Setting",
          "Skill 2: Stakeholder Analysis",
          "Skill 3: Risk Assessment",
        ],
        agents: ["STR-001", "STR-002", "STR-003"],
      },
      financial_management: {
        status: "active",
        reference: "CMP-IS Domain D",
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
