/**
 * Project Access Middleware
 * Kullanıcının projeye erişimini ve rolünü kontrol eder
 */

import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type { Role } from "@taskflow/shared";

// Express Request'e projectRole ve projectId ekle
declare module "express" {
  interface Request {
    projectRole?: Role;
    projectId?: string;
  }
}

// Role hierarchy: OWNER > ADMIN > MEMBER
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Proje erişim kontrolü middleware'i
 * @param minRole Minimum gerekli rol (opsiyonel)
 * @param projectIdParam URL parametresi adı (default: 'projectId' veya 'id')
 */
export function requireProjectAccess(minRole?: Role, projectIdParam?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      // Project ID'yi bul (farklı route parametrelerinden)
      const projectId = (req.params[projectIdParam || "projectId"] ||
        req.params.id) as string | undefined;
      if (!projectId) {
        throw ApiError.badRequest("Proje ID'si gerekli");
      }

      // Membership kontrolü
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu projeye erişim izniniz yok");
      }

      // Minimum rol kontrolü
      if (minRole && !hasMinRole(membership.role, minRole)) {
        throw ApiError.forbidden("Bu işlem için yetkiniz yok");
      }

      // Request'e project bilgilerini ekle
      req.projectRole = membership.role as Role;
      req.projectId = projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Liste üzerinden proje erişim kontrolü
 * List ID'den project'e gidip erişim kontrolü yapar
 */
export function requireListAccess(minRole?: Role) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      const listId = (req.params.listId || req.params.id) as string | undefined;
      if (!listId) {
        throw ApiError.badRequest("Liste ID'si gerekli");
      }

      // List'i bul ve project bilgisini al
      const list = await prisma.list.findUnique({
        where: { id: listId },
        select: { projectId: true },
      });

      if (!list) {
        throw ApiError.notFound("Liste bulunamadı");
      }

      // Membership kontrolü
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId: list.projectId,
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu listeye erişim izniniz yok");
      }

      // Minimum rol kontrolü
      if (minRole && !hasMinRole(membership.role, minRole)) {
        throw ApiError.forbidden("Bu işlem için yetkiniz yok");
      }

      // Request'e bilgileri ekle
      req.projectRole = membership.role as Role;
      req.projectId = list.projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Task üzerinden proje erişim kontrolü
 * Task ID'den project'e gidip erişim kontrolü yapar
 */
export function requireTaskAccess(minRole?: Role) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      const taskId = (req.params.taskId || req.params.id) as string | undefined;
      if (!taskId) {
        throw ApiError.badRequest("Görev ID'si gerekli");
      }

      // Task'ı bul ve project bilgisini al
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      });

      if (!task) {
        throw ApiError.notFound("Görev bulunamadı");
      }

      // Membership kontrolü
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId: task.projectId,
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu göreve erişim izniniz yok");
      }

      // Minimum rol kontrolü
      if (minRole && !hasMinRole(membership.role, minRole)) {
        throw ApiError.forbidden("Bu işlem için yetkiniz yok");
      }

      // Request'e bilgileri ekle
      req.projectRole = membership.role as Role;
      req.projectId = task.projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
}
