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
import { requireOrgAccess, requireTeamOrgAccess } from "../middleware/orgAccess.js";
import * as teamService from "../services/team.service.js";

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
      const teams = await teamService.getOrganizationTeams(
        req.params.orgId as string,
      );
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
      const team = await teamService.createTeam(
        req.params.orgId as string,
        req.body,
        req.userId!,
      );
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
      const team = await teamService.getTeamById(req.params.teamId as string);
      
      // Takımın bu organizasyona ait olduğunu doğrula
      if (team.organizationId !== req.params.orgId) {
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
  validate(updateTeamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admin değilse, team lead olmalı
      if (req.orgRole !== "OWNER" && req.orgRole !== "ADMIN") {
        const teamMembers = await teamService.getTeamMembers(
          req.params.teamId as string,
        );
        const userMembership = teamMembers.find((m) => m.user.id === req.userId);
        
        if (!userMembership || userMembership.role !== "LEAD") {
          return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
        }
      }

      const team = await teamService.updateTeam(
        req.params.teamId as string,
        req.body,
      );
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
      await teamService.deleteTeam(req.params.teamId as string);
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
      const members = await teamService.getTeamMembers(
        req.params.teamId as string,
      );
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
  validate(addTeamMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admin değilse, team lead olmalı
      if (req.orgRole !== "OWNER" && req.orgRole !== "ADMIN") {
        const teamMembers = await teamService.getTeamMembers(
          req.params.teamId as string,
        );
        const userMembership = teamMembers.find((m) => m.user.id === req.userId);
        
        if (!userMembership || userMembership.role !== "LEAD") {
          return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
        }
      }

      const member = await teamService.addTeamMember(
        req.params.teamId as string,
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
  validate(updateTeamMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admin değilse, team lead olmalı
      if (req.orgRole !== "OWNER" && req.orgRole !== "ADMIN") {
        const teamMembers = await teamService.getTeamMembers(
          req.params.teamId as string,
        );
        const userMembership = teamMembers.find((m) => m.user.id === req.userId);
        
        if (!userMembership || userMembership.role !== "LEAD") {
          return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
        }
      }

      await teamService.updateTeamMemberRole(
        req.params.memberId as string,
        req.body.role,
      );
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admin değilse, team lead olmalı
      if (req.orgRole !== "OWNER" && req.orgRole !== "ADMIN") {
        const teamMembers = await teamService.getTeamMembers(
          req.params.teamId as string,
        );
        const userMembership = teamMembers.find((m) => m.user.id === req.userId);
        
        if (!userMembership || userMembership.role !== "LEAD") {
          return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
        }
      }

      await teamService.removeTeamMember(req.params.memberId as string);
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
      const team = await teamService.getTeamById(req.params.id as string);
      res.json(team);
    } catch (error) {
      next(error);
    }
  },
);

export { orgTeamRouter, standaloneTeamRouter };
export default orgTeamRouter;
