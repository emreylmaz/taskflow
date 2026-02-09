/**
 * Organization Service
 * Organization CRUD ve üye yönetimi işlemleri
 */

import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrgRole,
} from "@taskflow/shared";

/**
 * Slug oluştur (name'den)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Unique slug oluştur
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Kullanıcının organizasyonlarını getir
 */
export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: {
      organization: { name: "asc" },
    },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logo: m.organization.logo,
    createdAt: m.organization.createdAt,
    updatedAt: m.organization.updatedAt,
    role: m.role as OrgRole,
    memberCount: m.organization._count.members,
    teamCount: m.organization._count.teams,
    projectCount: m.organization._count.projects,
  }));
}

/**
 * Organizasyon detayını getir
 */
export async function getOrganizationById(orgId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
              projects: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    throw ApiError.notFound("Organizasyon bulunamadı veya erişim izniniz yok");
  }

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    logo: membership.organization.logo,
    createdAt: membership.organization.createdAt,
    updatedAt: membership.organization.updatedAt,
    role: membership.role as OrgRole,
    memberCount: membership.organization._count.members,
    teamCount: membership.organization._count.teams,
    projectCount: membership.organization._count.projects,
  };
}

/**
 * Slug ile organizasyon getir
 */
export async function getOrganizationBySlug(slug: string, userId: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!org) {
    throw ApiError.notFound("Organizasyon bulunamadı");
  }

  return getOrganizationById(org.id, userId);
}

/**
 * Yeni organizasyon oluştur
 */
export async function createOrganization(
  input: CreateOrganizationInput,
  userId: string,
) {
  const baseSlug = input.slug || generateSlug(input.name);
  const slug = await ensureUniqueSlug(baseSlug);

  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      logo: input.logo,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          teams: true,
          projects: true,
        },
      },
    },
  });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    role: "OWNER" as OrgRole,
    memberCount: organization._count.members,
    teamCount: organization._count.teams,
    projectCount: organization._count.projects,
  };
}

/**
 * Organizasyonu güncelle
 */
export async function updateOrganization(
  orgId: string,
  input: UpdateOrganizationInput,
) {
  // Slug değişiyorsa unique olmalı
  if (input.slug) {
    const existing = await prisma.organization.findFirst({
      where: {
        slug: input.slug,
        NOT: { id: orgId },
      },
    });

    if (existing) {
      throw ApiError.conflict("Bu slug zaten kullanılıyor");
    }
  }

  const organization = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: input.name,
      slug: input.slug,
      logo: input.logo,
    },
  });

  return organization;
}

/**
 * Organizasyonu sil
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  await prisma.organization.delete({
    where: { id: orgId },
  });
}

/**
 * Organizasyon üyelerini getir
 */
export async function getOrganizationMembers(orgId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
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
    role: m.role as OrgRole,
    joinedAt: m.joinedAt,
    user: m.user,
  }));
}

/**
 * Organizasyona üye ekle
 */
export async function addOrganizationMember(
  orgId: string,
  email: string,
  role: OrgRole = "MEMBER",
) {
  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw ApiError.notFound("Bu e-posta adresine sahip kullanıcı bulunamadı");
  }

  // Zaten üye mi kontrol et
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
  });

  if (existingMember) {
    throw ApiError.conflict("Bu kullanıcı zaten organizasyonun üyesi");
  }

  // OWNER olarak eklenemez
  if (role === "OWNER") {
    throw ApiError.badRequest("Kullanıcı OWNER olarak eklenemez");
  }

  const member = await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: orgId,
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
    role: member.role as OrgRole,
    joinedAt: member.joinedAt,
    user: member.user,
  };
}

/**
 * Üye rolünü güncelle
 */
export async function updateMemberRole(
  memberId: string,
  newRole: OrgRole,
  currentUserRole: OrgRole,
): Promise<void> {
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  // OWNER değiştirilemez
  if (member.role === "OWNER") {
    throw ApiError.forbidden("Organizasyon sahibinin rolü değiştirilemez");
  }

  // OWNER yapılamaz
  if (newRole === "OWNER") {
    throw ApiError.badRequest("OWNER rolü atanamaz");
  }

  // Sadece OWNER, ADMIN'leri yönetebilir
  if (member.role === "ADMIN" && currentUserRole !== "OWNER") {
    throw ApiError.forbidden(
      "Sadece organizasyon sahibi ADMIN'lerin rolünü değiştirebilir",
    );
  }

  // Sadece OWNER başkasını ADMIN yapabilir
  if (newRole === "ADMIN" && currentUserRole !== "OWNER") {
    throw ApiError.forbidden("Sadece organizasyon sahibi ADMIN atayabilir");
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

/**
 * Üyeyi organizasyondan çıkar
 */
export async function removeMember(
  memberId: string,
  currentUserRole: OrgRole,
): Promise<void> {
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  // OWNER çıkarılamaz
  if (member.role === "OWNER") {
    throw ApiError.forbidden("Organizasyon sahibi çıkarılamaz");
  }

  // Sadece OWNER, ADMIN'leri çıkarabilir
  if (member.role === "ADMIN" && currentUserRole !== "OWNER") {
    throw ApiError.forbidden(
      "Sadece organizasyon sahibi ADMIN'leri çıkarabilir",
    );
  }

  await prisma.organizationMember.delete({
    where: { id: memberId },
  });
}
