/**
 * Task Routes
 * /api/v1/lists/:listId/tasks ve /api/v1/tasks/:id
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
} from "@taskflow/shared";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  requireListAccess,
  requireTaskAccess,
} from "../middleware/projectAccess.js";
import * as taskService from "../services/task.service.js";

// ══════════════════════════════════════════════════════════════════════════════
// List-scoped Task Routes (/api/v1/lists/:listId/tasks)
// ══════════════════════════════════════════════════════════════════════════════

const listTaskRouter = Router({ mergeParams: true });

listTaskRouter.use(authenticate);

/**
 * POST /api/v1/lists/:listId/tasks
 * Yeni task oluştur
 */
listTaskRouter.post(
  "/",
  requireListAccess(),
  validate(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(
        req.params.listId as string,
        req.body,
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/v1/lists/:listId/tasks/reorder
 * Liste içinde task'ları yeniden sırala
 */
listTaskRouter.patch(
  "/reorder",
  requireListAccess(),
  validate(reorderTasksSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.reorderTasks(
        req.params.listId as string,
        req.body.taskIds,
      );
      res.json({ message: "Görevler yeniden sıralandı" });
    } catch (error) {
      next(error);
    }
  },
);

export { listTaskRouter };

// ══════════════════════════════════════════════════════════════════════════════
// Standalone Task Routes (/api/v1/tasks/:id)
// ══════════════════════════════════════════════════════════════════════════════

const taskRouter = Router();

taskRouter.use(authenticate);

/**
 * GET /api/v1/tasks/:id
 * Task detayını getir
 */
taskRouter.get(
  "/:id",
  requireTaskAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTaskById(req.params.id as string);
      res.json(task);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/v1/tasks/:id
 * Task'ı güncelle
 */
taskRouter.put(
  "/:id",
  requireTaskAccess(),
  validate(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateTask(
        req.params.id as string,
        req.body,
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/v1/tasks/:id/move
 * Task'ı başka listeye taşı
 */
taskRouter.patch(
  "/:id/move",
  requireTaskAccess(),
  validate(moveTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.moveTask(
        req.params.id as string,
        req.body,
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/tasks/:id
 * Task'ı arşivle (soft delete)
 */
taskRouter.delete(
  "/:id",
  requireTaskAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.archiveTask(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/v1/tasks/:id/restore
 * Task'ı arşivden geri al
 */
taskRouter.post(
  "/:id/restore",
  requireTaskAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetListId = req.body.listId;
      const task = await taskService.restoreTask(
        req.params.id as string,
        targetListId,
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/v1/tasks/:id/permanent
 * Task'ı kalıcı olarak sil (Admin+)
 */
taskRouter.delete(
  "/:id/permanent",
  requireTaskAccess("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.deleteTaskPermanently(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default taskRouter;
