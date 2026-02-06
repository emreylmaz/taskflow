/**
 * List Routes
 * /api/v1/projects/:projectId/lists ve /api/v1/lists/:id
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createListSchema,
  updateListSchema,
  reorderListsSchema,
} from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  requireProjectAccess,
  requireListAccess,
} from "../middleware/projectAccess.js";
import * as listService from "../services/list.service.js";

const router = Router({ mergeParams: true }); // projectId'yi parent route'dan al

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// ══════════════════════════════════════════════════════════════════════════════
// Project-scoped List Routes (/api/v1/projects/:projectId/lists)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/projects/:projectId/lists
 * Proje listelerini getir (task'larla birlikte)
 */
router.get(
  "/",
  requireProjectAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeArchive = req.query.includeArchive === "true";
      const lists = await listService.getProjectLists(
        req.projectId!,
        includeArchive,
      );
      res.json(lists);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/projects/:projectId/lists
 * Yeni liste oluştur
 */
router.post(
  "/",
  requireProjectAccess(),
  validate(createListSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await listService.createList(req.projectId!, req.body);
      res.status(201).json(list);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/v1/projects/:projectId/lists/reorder
 * Listeleri yeniden sırala
 */
router.patch(
  "/reorder",
  requireProjectAccess(),
  validate(reorderListsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await listService.reorderLists(req.projectId!, req.body.listIds);
      res.json({ message: "Listeler yeniden sıralandı" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/projects/:projectId/lists/archive
 * Arşiv listesini getir (arşivlenmiş task'larla)
 */
router.get(
  "/archive",
  requireProjectAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const archiveList = await listService.getArchiveList(req.projectId!);
      res.json(archiveList);
    } catch (error) {
      next(error);
    }
  },
);

export default router;

// ══════════════════════════════════════════════════════════════════════════════
// Standalone List Routes (/api/v1/lists/:id)
// Bu router ayrı olarak export edilir ve app.ts'de mount edilir
// ══════════════════════════════════════════════════════════════════════════════

export const listRouter = Router();

listRouter.use(authenticate);

/**
 * GET /api/v1/lists/:id
 * Tek listeyi getir
 */
listRouter.get(
  "/:id",
  requireListAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await listService.getListById(req.params.id as string);
      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/lists/:id
 * Listeyi güncelle (Admin+)
 */
listRouter.put(
  "/:id",
  requireListAccess("ADMIN"),
  validate(updateListSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await listService.updateList(
        req.params.id as string,
        req.body,
      );
      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/lists/:id
 * Listeyi sil (Admin+)
 */
listRouter.delete(
  "/:id",
  requireListAccess("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await listService.deleteList(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
