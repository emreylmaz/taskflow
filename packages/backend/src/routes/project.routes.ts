/**
 * Project Routes
 * /api/v1/projects
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema,
  createLabelSchema,
  updateLabelSchema,
} from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectAccess } from "../middleware/projectAccess.js";
import * as projectService from "../services/project.service.js";

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// ══════════════════════════════════════════════════════════════════════════════
// Project CRUD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/projects
 * Kullanıcının projelerini listele
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await projectService.getUserProjects(req.userId!);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/projects
 * Yeni proje oluştur
 */
router.post(
  "/",
  validate(createProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.createProject(req.body, req.userId!);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/projects/:id
 * Proje detayını getir
 */
router.get(
  "/:id",
  requireProjectAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.getProjectById(
        req.params.id as string,
        req.userId!,
      );
      res.json(project);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/projects/:id
 * Projeyi güncelle (Admin+)
 */
router.put(
  "/:id",
  requireProjectAccess("ADMIN"),
  validate(updateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.updateProject(
        req.params.id as string,
        req.body,
      );
      res.json(project);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/projects/:id
 * Projeyi sil (Owner only)
 */
router.delete(
  "/:id",
  requireProjectAccess("OWNER"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.deleteProject(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Project Members
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/projects/:id/members
 * Proje üyelerini listele
 */
router.get(
  "/:id/members",
  requireProjectAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await projectService.getProjectMembers(
        req.params.id as string,
      );
      res.json(members);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/projects/:id/members
 * Projeye üye ekle (Admin+)
 */
router.post(
  "/:id/members",
  requireProjectAccess("ADMIN"),
  validate(addMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await projectService.addProjectMember(
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
 * PUT /api/v1/projects/:id/members/:memberId
 * Üye rolünü güncelle (Admin+)
 */
router.put(
  "/:id/members/:memberId",
  requireProjectAccess("ADMIN"),
  validate(updateMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.updateMemberRole(
        req.params.memberId as string,
        req.body.role,
        req.projectRole!,
      );
      res.json({ message: "Üye rolü güncellendi" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/projects/:id/members/:memberId
 * Üyeyi projeden çıkar (Admin+)
 */
router.delete(
  "/:id/members/:memberId",
  requireProjectAccess("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.removeMember(
        req.params.memberId as string,
        req.projectRole!,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Project Labels
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/projects/:id/labels
 * Proje etiketlerini listele
 */
router.get(
  "/:id/labels",
  requireProjectAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const labels = await projectService.getProjectLabels(
        req.params.id as string,
      );
      res.json(labels);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/projects/:id/labels
 * Yeni etiket oluştur (Admin+)
 */
router.post(
  "/:id/labels",
  requireProjectAccess("ADMIN"),
  validate(createLabelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const label = await projectService.createLabel(
        req.params.id as string,
        req.body.name,
        req.body.color,
      );
      res.status(201).json(label);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/projects/:id/labels/:labelId
 * Etiketi güncelle (Admin+)
 */
router.put(
  "/:id/labels/:labelId",
  requireProjectAccess("ADMIN"),
  validate(updateLabelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const label = await projectService.updateLabel(
        req.params.labelId as string,
        req.body,
      );
      res.json(label);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/projects/:id/labels/:labelId
 * Etiketi sil (Admin+)
 */
router.delete(
  "/:id/labels/:labelId",
  requireProjectAccess("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.deleteLabel(req.params.labelId as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
