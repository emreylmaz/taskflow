/**
 * Team API Tests
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/database.js";
import { hashPassword } from "../utils/hash.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Team API", () => {
  let accessToken: string;
  let userId: string;
  let testOrgId: string;
  let testTeamId: string;

  beforeAll(async () => {
    // Test user oluştur
    const password = await hashPassword("Test1234!");
    const user = await prisma.user.create({
      data: {
        email: "team-test@example.com",
        name: "Team Test User",
        password,
      },
    });
    userId = user.id;
    accessToken = generateAccessToken({ userId: user.id, email: user.email });

    // Test organizasyonu oluştur
    const org = await prisma.organization.create({
      data: {
        name: "Team Test Org",
        slug: "team-test-org",
        members: {
          create: { userId, role: "OWNER" },
        },
      },
    });
    testOrgId = org.id;
  });

  afterAll(async () => {
    // Temizlik
    await prisma.organization.deleteMany({
      where: { id: testOrgId },
    });
    await prisma.user.delete({ where: { id: userId } });
  });

  beforeEach(async () => {
    // Her test öncesi test takımlarını temizle
    await prisma.team.deleteMany({
      where: { organizationId: testOrgId },
    });
  });

  describe("POST /api/v1/organizations/:orgId/teams", () => {
    it("should create a new team", async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/teams`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Development Team",
          description: "Our dev team",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Development Team");
      expect(res.body.description).toBe("Our dev team");
      expect(res.body.organizationId).toBe(testOrgId);
      testTeamId = res.body.id;
    });

    it("should make creator a LEAD", async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/teams`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Design Team",
        });

      expect(res.status).toBe(201);

      // Üyeleri kontrol et
      const membersRes = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/teams/${res.body.id}/members`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(membersRes.body[0].role).toBe("LEAD");
      expect(membersRes.body[0].user.id).toBe(userId);
    });
  });

  describe("GET /api/v1/organizations/:orgId/teams", () => {
    beforeEach(async () => {
      await prisma.team.create({
        data: {
          name: "Test Team 1",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });
      await prisma.team.create({
        data: {
          name: "Test Team 2",
          organizationId: testOrgId,
          members: { create: { userId, role: "MEMBER" } },
        },
      });
    });

    it("should list organization teams", async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/teams`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].memberCount).toBeDefined();
    });
  });

  describe("GET /api/v1/organizations/:orgId/teams/:teamId", () => {
    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          name: "Team Detail Test",
          description: "Test description",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });
      testTeamId = team.id;
    });

    it("should get team details", async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/teams/${testTeamId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Team Detail Test");
      expect(res.body.organization).toBeDefined();
      expect(res.body.organization.slug).toBe("team-test-org");
    });
  });

  describe("PUT /api/v1/organizations/:orgId/teams/:teamId", () => {
    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          name: "Team Update Test",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });
      testTeamId = team.id;
    });

    it("should update team", async () => {
      const res = await request(app)
        .put(`/api/v1/organizations/${testOrgId}/teams/${testTeamId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated Team Name",
          description: "New description",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Team Name");
    });
  });

  describe("Team Members", () => {
    let memberUserId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          name: "Team Members Test",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });
      testTeamId = team.id;

      // Test için üye olacak kullanıcı
      const memberUser = await prisma.user.create({
        data: {
          email: "team-member-test@example.com",
          name: "Team Member",
          password: await hashPassword("Test1234!"),
        },
      });
      memberUserId = memberUser.id;

      // Organizasyona ekle (takıma eklemeden önce gerekli)
      await prisma.organizationMember.create({
        data: {
          userId: memberUserId,
          organizationId: testOrgId,
          role: "MEMBER",
        },
      });
    });

    afterEach(async () => {
      await prisma.organizationMember.deleteMany({
        where: { userId: memberUserId },
      });
      await prisma.user.deleteMany({
        where: { email: "team-member-test@example.com" },
      });
    });

    it("should add member to team", async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/teams/${testTeamId}/members`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          userId: memberUserId,
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe("MEMBER");
    });

    it("should not add non-org-member to team", async () => {
      // Organizasyondaki üyeliği sil
      await prisma.organizationMember.delete({
        where: {
          userId_organizationId: {
            userId: memberUserId,
            organizationId: testOrgId,
          },
        },
      });

      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/teams/${testTeamId}/members`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          userId: memberUserId,
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("organizasyonun üyesi değil");

      // Tekrar ekle (afterEach için)
      await prisma.organizationMember.create({
        data: {
          userId: memberUserId,
          organizationId: testOrgId,
          role: "MEMBER",
        },
      });
    });

    it("should list team members", async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/teams/${testTeamId}/members`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].role).toBe("LEAD");
    });
  });

  describe("GET /api/v1/teams (User's teams)", () => {
    beforeEach(async () => {
      await prisma.team.create({
        data: {
          name: "My Team 1",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });
      await prisma.team.create({
        data: {
          name: "My Team 2",
          organizationId: testOrgId,
          members: { create: { userId, role: "MEMBER" } },
        },
      });
    });

    it("should list user teams across organizations", async () => {
      const res = await request(app)
        .get("/api/v1/teams")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].organization).toBeDefined();
    });
  });

  describe("DELETE /api/v1/organizations/:orgId/teams/:teamId", () => {
    it("should delete team (admin only)", async () => {
      const team = await prisma.team.create({
        data: {
          name: "Team To Delete",
          organizationId: testOrgId,
          members: { create: { userId, role: "LEAD" } },
        },
      });

      const res = await request(app)
        .delete(`/api/v1/organizations/${testOrgId}/teams/${team.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Silindiğini doğrula
      const deleted = await prisma.team.findUnique({
        where: { id: team.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
