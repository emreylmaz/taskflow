/**
 * Team Routes
 * /api/v1/organizations/:orgId/teams - Organization-scoped
 * /api/v1/teams - Standalone (user's teams)
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
} from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  requireOrgAccess,
  requireTeamOrgAccess,
  requireOrgAdminOrTeamLead,
} from "../middleware/orgAccess.js";
import * as teamService from "../services/team.service.js";
import { z } from "zod";

// ══════════════════════════════════════════════════════════════════════════════
// Route Parameter Schemas (typed params)
// ══════════════════════════════════════════════════════════════════════════════

const orgIdParamSchema = z.object({
  orgId: z.string().min(1, "Organization ID gerekli"),
});

const teamIdParamSchema = z.object({
  orgId: z.string().min(1, "Organization ID gerekli"),
  teamId: z.string().min(1, "Team ID gerekli"),
});

const memberIdParamSchema = z.object({
  orgId: z.string().min(1, "Organization ID gerekli"),
  teamId: z.string().min(1, "Team ID gerekli"),
  memberId: z.string().min(1, "Member ID gerekli"),
});

const standaloneTeamIdParamSchema = z.object({
  id: z.string().min(1, "Team ID gerekli"),
});

// Helper to parse and validate route params
function parseParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  return schema.parse(params);
}

// ══════════════════════════════════════════════════════════════════════════════
// Organization-scoped Team Routes (/api/v1/organizations/:orgId/teams)
// ══════════════════════════════════════════════════════════════════════════════

const orgTeamRouter = Router({ mergeParams: true });

// Tüm route'lar authentication gerektirir
orgTeamRouter.use(authenticate);

/**
 * GET /api/v1/organizations/:orgId/teams
 * Organizasyonun takımlarını listele
 */
orgTeamRouter.get(
  "/",
  requireOrgAccess("VIEWER", "orgId"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = parseParams(orgIdParamSchema, req.params);
      const teams = await teamService.getOrganizationTeams(orgId);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/organizations/:orgId/teams
 * Yeni takım oluştur (Member+)
 */
orgTeamRouter.post(
  "/",
  requireOrgAccess("MEMBER", "orgId"),
  validate(createTeamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = parseParams(orgIdParamSchema, req.params);
      const team = await teamService.createTeam(orgId, req.body, req.userId!);
      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/organizations/:orgId/teams/:teamId
 * Takım detayını getir
 */
orgTeamRouter.get(
  "/:teamId",
  requireOrgAccess("VIEWER", "orgId"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, teamId } = parseParams(teamIdParamSchema, req.params);
      const team = await teamService.getTeamById(teamId);

      // Takımın bu organizasyona ait olduğunu doğrula
      if (team.organizationId !== orgId) {
        return res.status(404).json({ message: "Takım bulunamadı" });
      }

      res.json(team);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/organizations/:orgId/teams/:teamId
 * Takımı güncelle (Admin+ veya Team Lead)
 */
orgTeamRouter.put(
  "/:teamId",
  requireOrgAccess("MEMBER", "orgId"),
  requireOrgAdminOrTeamLead(),
  validate(updateTeamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = parseParams(teamIdParamSchema, req.params);
      const team = await teamService.updateTeam(teamId, req.body);
      res.json(team);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/organizations/:orgId/teams/:teamId
 * Takımı sil (Admin+)
 */
orgTeamRouter.delete(
  "/:teamId",
  requireOrgAccess("ADMIN", "orgId"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = parseParams(teamIdParamSchema, req.params);
      await teamService.deleteTeam(teamId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Team Members
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/organizations/:orgId/teams/:teamId/members
 * Takım üyelerini listele
 */
orgTeamRouter.get(
  "/:teamId/members",
  requireOrgAccess("VIEWER", "orgId"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = parseParams(teamIdParamSchema, req.params);
      const members = await teamService.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/organizations/:orgId/teams/:teamId/members
 * Takıma üye ekle (Admin+ veya Team Lead)
 */
orgTeamRouter.post(
  "/:teamId/members",
  requireOrgAccess("MEMBER", "orgId"),
  requireOrgAdminOrTeamLead(),
  validate(addTeamMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = parseParams(teamIdParamSchema, req.params);
      const member = await teamService.addTeamMember(
        teamId,
        req.body.userId,
        req.body.role,
      );
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/organizations/:orgId/teams/:teamId/members/:memberId
 * Takım üyesi rolünü güncelle (Admin+ veya Team Lead)
 */
orgTeamRouter.put(
  "/:teamId/members/:memberId",
  requireOrgAccess("MEMBER", "orgId"),
  requireOrgAdminOrTeamLead(),
  validate(updateTeamMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memberId } = parseParams(memberIdParamSchema, req.params);
      await teamService.updateTeamMemberRole(memberId, req.body.role);
      res.json({ message: "Üye rolü güncellendi" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/organizations/:orgId/teams/:teamId/members/:memberId
 * Takım üyesini çıkar (Admin+ veya Team Lead)
 */
orgTeamRouter.delete(
  "/:teamId/members/:memberId",
  requireOrgAccess("MEMBER", "orgId"),
  requireOrgAdminOrTeamLead(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memberId } = parseParams(memberIdParamSchema, req.params);
      await teamService.removeTeamMember(memberId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Standalone Team Routes (/api/v1/teams)
// ══════════════════════════════════════════════════════════════════════════════

const standaloneTeamRouter = Router();

standaloneTeamRouter.use(authenticate);

/**
 * GET /api/v1/teams
 * Kullanıcının takımlarını listele
 */
standaloneTeamRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teams = await teamService.getUserTeams(req.userId!);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/teams/:id
 * Takım detayını getir (üye olmak gerekli)
 */
standaloneTeamRouter.get(
  "/:id",
  requireTeamOrgAccess("VIEWER"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = parseParams(standaloneTeamIdParamSchema, req.params);
      const team = await teamService.getTeamById(id);
      res.json(team);
    } catch (error) {
      next(error);
    }
  },
);

export { orgTeamRouter, standaloneTeamRouter };
export default orgTeamRouter;
