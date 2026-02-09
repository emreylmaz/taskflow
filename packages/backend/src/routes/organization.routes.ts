/**
 * Organization Routes
 * /api/v1/organizations
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addOrgMemberSchema,
  updateOrgMemberSchema,
} from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { requireOrgAccess } from "../middleware/orgAccess.js";
import * as orgService from "../services/organization.service.js";

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// ══════════════════════════════════════════════════════════════════════════════
// Organization CRUD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/organizations
 * Kullanıcının organizasyonlarını listele
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await orgService.getUserOrganizations(req.userId!);
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/organizations
 * Yeni organizasyon oluştur
 */
router.post(
  "/",
  validate(createOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await orgService.createOrganization(
        req.body,
        req.userId!,
      );
      res.status(201).json(organization);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/organizations/:id
 * Organizasyon detayını getir
 */
router.get(
  "/:id",
  requireOrgAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await orgService.getOrganizationById(
        req.params.id as string,
        req.userId!,
      );
      res.json(organization);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/organizations/slug/:slug
 * Slug ile organizasyon getir
 */
router.get(
  "/slug/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await orgService.getOrganizationBySlug(
        req.params.slug as string,
        req.userId!,
      );
      res.json(organization);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/organizations/:id
 * Organizasyonu güncelle (Admin+)
 */
router.put(
  "/:id",
  requireOrgAccess("ADMIN"),
  validate(updateOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await orgService.updateOrganization(
        req.params.id as string,
        req.body,
      );
      res.json(organization);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/organizations/:id
 * Organizasyonu sil (Owner only)
 */
router.delete(
  "/:id",
  requireOrgAccess("OWNER"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orgService.deleteOrganization(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Organization Members
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/organizations/:id/members
 * Organizasyon üyelerini listele
 */
router.get(
  "/:id/members",
  requireOrgAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await orgService.getOrganizationMembers(
        req.params.id as string,
      );
      res.json(members);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/organizations/:id/members
 * Organizasyona üye ekle (Admin+)
 */
router.post(
  "/:id/members",
  requireOrgAccess("ADMIN"),
  validate(addOrgMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await orgService.addOrganizationMember(
        req.params.id as string,
        req.body.email,
        req.body.role,
      );
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/organizations/:id/members/:memberId
 * Üye rolünü güncelle (Admin+)
 */
router.put(
  "/:id/members/:memberId",
  requireOrgAccess("ADMIN"),
  validate(updateOrgMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orgService.updateMemberRole(
        req.params.memberId as string,
        req.body.role,
        req.orgRole!,
      );
      res.json({ message: "Üye rolü güncellendi" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/organizations/:id/members/:memberId
 * Üyeyi organizasyondan çıkar (Admin+)
 */
router.delete(
  "/:id/members/:memberId",
  requireOrgAccess("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orgService.removeMember(
        req.params.memberId as string,
        req.orgRole!,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
