import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/database.js";

// Mock prisma
vi.mock("../config/database.js", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("GET /api/v1/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 200 with status ok when DB is healthy", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("database");
    expect(res.body.database).toHaveProperty("status", "ok");
    expect(res.body.database).toHaveProperty("latencyMs");
  });

  it("should return 503 when DB is unavailable", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
      new Error("Connection failed"),
    );

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty("status", "error");
    expect(res.body.database).toHaveProperty("status", "error");
  });
});

describe("GET /api/health (legacy)", () => {
  it("should redirect to /api/v1/health", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe("/api/v1/health");
  });
});
