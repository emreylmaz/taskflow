/**
 * Organization API Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/database.js";
import { hashPassword } from "../utils/hash.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Organization API", () => {
  let accessToken: string;
  let userId: string;
  let testOrgId: string;

  beforeAll(async () => {
    // Test user oluştur
    const password = await hashPassword("Test1234!");
    const user = await prisma.user.create({
      data: {
        email: "org-test@example.com",
        name: "Org Test User",
        password,
      },
    });
    userId = user.id;
    accessToken = generateAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    // Temizlik
    await prisma.organization.deleteMany({
      where: {
        members: { some: { userId } },
      },
    });
    await prisma.user.delete({ where: { id: userId } });
  });

  beforeEach(async () => {
    // Her test öncesi test organizasyonunu temizle
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: "test-org" } },
    });
  });

  describe("POST /api/v1/organizations", () => {
    it("should create a new organization", async () => {
      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test Organization",
          slug: "test-org-create",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Organization");
      expect(res.body.slug).toBe("test-org-create");
      expect(res.body.role).toBe("OWNER");
      testOrgId = res.body.id;
    });

    it("should auto-generate slug from name", async () => {
      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "My Awesome Company",
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe("my-awesome-company");
    });

    it("should reject invalid slug format", async () => {
      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test Org",
          slug: "Invalid Slug!",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/organizations", () => {
    beforeEach(async () => {
      // Test organizasyonu oluştur
      const org = await prisma.organization.create({
        data: {
          name: "Test Org List",
          slug: "test-org-list",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });
      testOrgId = org.id;
    });

    it("should list user organizations", async () => {
      const res = await request(app)
        .get("/api/v1/organizations")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((o: any) => o.slug === "test-org-list")).toBe(true);
    });
  });

  describe("GET /api/v1/organizations/:id", () => {
    beforeEach(async () => {
      const org = await prisma.organization.create({
        data: {
          name: "Test Org Detail",
          slug: "test-org-detail",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });
      testOrgId = org.id;
    });

    it("should get organization by id", async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test Org Detail");
      expect(res.body.role).toBe("OWNER");
    });

    it("should return 403 for non-members", async () => {
      // Başka bir kullanıcı oluştur
      const otherUser = await prisma.user.create({
        data: {
          email: "other-org-test@example.com",
          name: "Other User",
          password: await hashPassword("Test1234!"),
        },
      });
      const otherToken = generateAccessToken({
        userId: otherUser.id,
        email: otherUser.email,
      });

      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe("PUT /api/v1/organizations/:id", () => {
    beforeEach(async () => {
      const org = await prisma.organization.create({
        data: {
          name: "Test Org Update",
          slug: "test-org-update",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });
      testOrgId = org.id;
    });

    it("should update organization", async () => {
      const res = await request(app)
        .put(`/api/v1/organizations/${testOrgId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated Organization Name",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Organization Name");
    });
  });

  describe("Organization Members", () => {
    let memberUserId: string;

    beforeEach(async () => {
      // Test organizasyonu
      const org = await prisma.organization.create({
        data: {
          name: "Test Org Members",
          slug: "test-org-members",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });
      testOrgId = org.id;

      // Test için üye olacak kullanıcı
      const memberUser = await prisma.user.create({
        data: {
          email: "member-test@example.com",
          name: "Member User",
          password: await hashPassword("Test1234!"),
        },
      });
      memberUserId = memberUser.id;
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: "member-test@example.com" },
      });
    });

    it("should add member to organization", async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/members`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "member-test@example.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe("MEMBER");
      expect(res.body.user.email).toBe("member-test@example.com");
    });

    it("should list organization members", async () => {
      // Önce üye ekle
      await prisma.organizationMember.create({
        data: {
          userId: memberUserId,
          organizationId: testOrgId,
          role: "MEMBER",
        },
      });

      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/members`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // OWNER + MEMBER
    });

    it("should not allow adding member as OWNER", async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/members`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "member-test@example.com",
          role: "OWNER",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/organizations/:id", () => {
    it("should delete organization (owner only)", async () => {
      const org = await prisma.organization.create({
        data: {
          name: "Test Org Delete",
          slug: "test-org-delete",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/v1/organizations/${org.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Silindiğini doğrula
      const deleted = await prisma.organization.findUnique({
        where: { id: org.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
