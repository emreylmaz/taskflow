/**
 * Team Service
 * Team CRUD ve üye yönetimi işlemleri
 */

import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  CreateTeamInput,
  UpdateTeamInput,
  TeamRole,
} from "@taskflow/shared";

/**
 * Organizasyonun takımlarını getir
 */
export async function getOrganizationTeams(orgId: string) {
  const teams = await prisma.team.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    organizationId: t.organizationId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    memberCount: t._count.members,
  }));
}

/**
 * Takım detayını getir
 */
export async function getTeamById(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!team) {
    throw ApiError.notFound("Takım bulunamadı");
  }

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    organizationId: team.organizationId,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    memberCount: team._count.members,
    organization: team.organization,
  };
}

/**
 * Yeni takım oluştur
 */
export async function createTeam(
  orgId: string,
  input: CreateTeamInput,
  creatorUserId: string,
) {
  const team = await prisma.team.create({
    data: {
      name: input.name,
      description: input.description,
      organizationId: orgId,
      members: {
        create: {
          userId: creatorUserId,
          role: "LEAD",
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    organizationId: team.organizationId,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    memberCount: team._count.members,
  };
}

/**
 * Takımı güncelle
 */
export async function updateTeam(teamId: string, input: UpdateTeamInput) {
  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      name: input.name,
      description: input.description,
    },
  });

  return team;
}

/**
 * Takımı sil
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await prisma.team.delete({
    where: { id: teamId },
  });
}

/**
 * Takım üyelerini getir
 */
export async function getTeamMembers(teamId: string) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return members.map((m) => ({
    id: m.id,
    role: m.role as TeamRole,
    joinedAt: m.joinedAt,
    user: m.user,
  }));
}

/**
 * Takıma üye ekle
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = "MEMBER",
) {
  // Takımı al (organizasyon kontrolü için)
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { organizationId: true },
  });

  if (!team) {
    throw ApiError.notFound("Takım bulunamadı");
  }

  // Kullanıcının organizasyon üyesi olduğunu doğrula
  const orgMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: team.organizationId,
      },
    },
  });

  if (!orgMembership) {
    throw ApiError.badRequest(
      "Kullanıcı organizasyonun üyesi değil. Önce organizasyona ekleyin.",
    );
  }

  // Zaten takım üyesi mi kontrol et
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  });

  if (existingMember) {
    throw ApiError.conflict("Bu kullanıcı zaten takımın üyesi");
  }

  const member = await prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return {
    id: member.id,
    role: member.role as TeamRole,
    joinedAt: member.joinedAt,
    user: member.user,
  };
}

/**
 * Takım üyesi rolünü güncelle
 */
export async function updateTeamMemberRole(
  memberId: string,
  newRole: TeamRole,
): Promise<void> {
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

/**
 * Takım üyesini çıkar
 */
export async function removeTeamMember(memberId: string): Promise<void> {
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: {
      team: {
        include: {
          members: {
            where: { role: "LEAD" },
          },
        },
      },
    },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  // Tek LEAD'i çıkarmaya çalışıyorsa ve başka LEAD yoksa hata ver
  if (member.role === "LEAD" && member.team.members.length === 1) {
    throw ApiError.badRequest(
      "Takımda en az bir LEAD olmalı. Önce başka birini LEAD yapın.",
    );
  }

  await prisma.teamMember.delete({
    where: { id: memberId },
  });
}

/**
 * Kullanıcının takımlarını getir
 */
export async function getUserTeams(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
    orderBy: {
      team: { name: "asc" },
    },
  });

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    organizationId: m.team.organizationId,
    createdAt: m.team.createdAt,
    updatedAt: m.team.updatedAt,
    role: m.role as TeamRole,
    memberCount: m.team._count.members,
    organization: m.team.organization,
  }));
}
