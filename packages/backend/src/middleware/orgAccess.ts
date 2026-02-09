/**
 * Organization Access Middleware
 * Kullanıcının organizasyona erişimini ve rolünü kontrol eder
 */

import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type { OrgRole } from "@taskflow/shared";

// Express Request'e orgRole ve orgId ekle
declare module "express" {
  interface Request {
    orgRole?: OrgRole;
    orgId?: string;
  }
}

// Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER
const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

function hasMinOrgRole(userRole: OrgRole, minRole: OrgRole): boolean {
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[minRole];
}

/**
 * Organizasyon erişim kontrolü middleware'i
 * @param minRole Minimum gerekli rol (opsiyonel)
 * @param orgIdParam URL parametresi adı (default: 'orgId' veya 'id')
 */
export function requireOrgAccess(minRole?: OrgRole, orgIdParam?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      // Organization ID'yi bul
      const orgId = (req.params[orgIdParam || "orgId"] || req.params.id) as
        | string
        | undefined;
      if (!orgId) {
        throw ApiError.badRequest("Organizasyon ID'si gerekli");
      }

      // Membership kontrolü
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: orgId,
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu organizasyona erişim izniniz yok");
      }

      // Minimum rol kontrolü
      if (minRole && !hasMinOrgRole(membership.role as OrgRole, minRole)) {
        throw ApiError.forbidden("Bu işlem için yetkiniz yok");
      }

      // Request'e org bilgilerini ekle
      req.orgRole = membership.role as OrgRole;
      req.orgId = orgId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Team üzerinden organizasyon erişim kontrolü
 * Team ID'den organization'a gidip erişim kontrolü yapar
 */
export function requireTeamOrgAccess(minRole?: OrgRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      const teamId = (req.params.teamId || req.params.id) as string | undefined;
      if (!teamId) {
        throw ApiError.badRequest("Team ID'si gerekli");
      }

      // Team'i bul ve organization bilgisini al
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { organizationId: true },
      });

      if (!team) {
        throw ApiError.notFound("Takım bulunamadı");
      }

      // Membership kontrolü
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: team.organizationId,
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu takıma erişim izniniz yok");
      }

      // Minimum rol kontrolü
      if (minRole && !hasMinOrgRole(membership.role as OrgRole, minRole)) {
        throw ApiError.forbidden("Bu işlem için yetkiniz yok");
      }

      // Request'e bilgileri ekle
      req.orgRole = membership.role as OrgRole;
      req.orgId = team.organizationId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Takım üyesi kontrolü
 * Kullanıcının belirli bir takımın üyesi olup olmadığını kontrol eder
 */
export function requireTeamMembership(minRole?: "LEAD" | "MEMBER") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw ApiError.unauthorized("Kullanıcı kimliği bulunamadı");
      }

      const teamId = (req.params.teamId || req.params.id) as string | undefined;
      if (!teamId) {
        throw ApiError.badRequest("Team ID'si gerekli");
      }

      // Team membership kontrolü
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: { userId, teamId },
        },
        include: {
          team: {
            select: { organizationId: true },
          },
        },
      });

      if (!membership) {
        throw ApiError.forbidden("Bu takımın üyesi değilsiniz");
      }

      // Minimum rol kontrolü
      if (minRole === "LEAD" && membership.role !== "LEAD") {
        throw ApiError.forbidden("Bu işlem için takım lideri olmalısınız");
      }

      // Request'e bilgileri ekle
      req.orgId = membership.team.organizationId;

      next();
    } catch (error) {
      next(error);
    }
  };
}
