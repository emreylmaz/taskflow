import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import listRoutes, { listRouter } from "./routes/list.routes.js";
import taskRoutes, { listTaskRouter } from "./routes/task.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import { orgTeamRouter, standaloneTeamRouter } from "./routes/team.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

const app = express();

// ── Security Middleware ────────────────────────────────
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);

// ── Compression ────────────────────────────────────────
app.use(compression());

// ── Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ── Request Logging ────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// ── Rate Limiting (test ortamında devre dışı) ──────────
if (env.NODE_ENV !== "test") {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Çok fazla istek, lütfen daha sonra tekrar deneyin" },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Çok fazla giriş denemesi, 15 dakika sonra tekrar deneyin",
    },
  });

  app.use(globalLimiter);
  app.post("/api/v1/auth/login", authLimiter);
  app.post("/api/v1/auth/register", authLimiter);
}

// ── Health Check with DB Validation ────────────────────
app.get("/api/v1/health", async (_req, res) => {
  const startTime = Date.now();

  try {
    // DB bağlantısını kontrol et
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: "ok",
        latencyMs,
      },
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: {
        status: "error",
      },
    });
  }
});

// Legacy health check (backward compatibility)
app.get("/api/health", (_req, res) => {
  res.redirect(301, "/api/v1/health");
});

// ══════════════════════════════════════════════════════════════════════════════
// API v1 Routes
// ══════════════════════════════════════════════════════════════════════════════

// Auth routes
app.use("/api/v1/auth", authRoutes);

// Project routes
app.use("/api/v1/projects", projectRoutes);

// Organization routes
app.use("/api/v1/organizations", organizationRoutes);

// Organization-scoped team routes
app.use("/api/v1/organizations/:orgId/teams", orgTeamRouter);

// Standalone team routes (user's teams)
app.use("/api/v1/teams", standaloneTeamRouter);

// Project-scoped list routes
app.use("/api/v1/projects/:projectId/lists", listRoutes);

// Standalone list routes
app.use("/api/v1/lists", listRouter);

// List-scoped task routes
app.use("/api/v1/lists/:listId/tasks", listTaskRouter);

// Standalone task routes
app.use("/api/v1/tasks", taskRoutes);

// ══════════════════════════════════════════════════════════════════════════════
// Legacy Routes (backward compatibility)
// ══════════════════════════════════════════════════════════════════════════════

app.use("/api/auth", (_req, res) => {
  const newPath = _req.originalUrl.replace("/api/auth", "/api/v1/auth");
  res.redirect(308, newPath);
});

// ── Error Handler (must be last) ───────────────────────
app.use(errorHandler);

export default app;
