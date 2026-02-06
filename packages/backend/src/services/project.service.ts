/**
 * Project Service
 * Proje CRUD işlemleri
 */

import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectWithDetails,
  ProjectWithRole,
  Role,
} from "@taskflow/shared";

// Default listeler her proje oluşturulduğunda eklenir
const DEFAULT_LISTS = [
  { name: "To Do", position: 0, color: "#6B7280" },
  { name: "In Progress", position: 1, color: "#3B82F6" },
  { name: "Done", position: 2, color: "#10B981" },
  { name: "Archive", position: 999, color: "#9CA3AF", isArchive: true },
];

/**
 * Kullanıcının projelerini getir
 */
export async function getUserProjects(
  userId: string,
): Promise<ProjectWithDetails[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          _count: {
            select: {
              members: true,
              tasks: {
                where: { archivedAt: null }, // Sadece aktif task'ları say
              },
            },
          },
        },
      },
    },
    orderBy: {
      project: { updatedAt: "desc" },
    },
  });

  return memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    description: m.project.description,
    color: m.project.color,
    modules: m.project.modules as Record<string, boolean>,
    createdAt: m.project.createdAt,
    updatedAt: m.project.updatedAt,
    role: m.role as Role,
    memberCount: m.project._count.members,
    taskCount: m.project._count.tasks,
  }));
}

/**
 * Proje detayını getir (kullanıcı rolü ile)
 */
export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<ProjectWithRole> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
    include: {
      project: true,
    },
  });

  if (!membership) {
    throw ApiError.notFound("Proje bulunamadı veya erişim izniniz yok");
  }

  return {
    id: membership.project.id,
    name: membership.project.name,
    description: membership.project.description,
    color: membership.project.color,
    modules: membership.project.modules as Record<string, boolean>,
    createdAt: membership.project.createdAt,
    updatedAt: membership.project.updatedAt,
    role: membership.role as Role,
  };
}

/**
 * Yeni proje oluştur
 */
export async function createProject(
  input: CreateProjectInput,
  userId: string,
): Promise<ProjectWithRole> {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      color: input.color || "#6366f1",
      modules: {},
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      lists: {
        create: DEFAULT_LISTS.map((list) => ({
          name: list.name,
          position: list.position,
          color: list.color,
          isArchive: list.isArchive ?? false,
        })),
      },
    },
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    modules: project.modules as Record<string, boolean>,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    role: "OWNER",
  };
}

/**
 * Projeyi güncelle
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectWithRole> {
  // Mevcut projeyi al (modules merge için)
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    throw ApiError.notFound("Proje bulunamadı");
  }

  // Modules'ü merge et
  const existingModules = existing.modules as Record<string, boolean> | null;
  const updatedModules = input.modules
    ? { ...existingModules, ...input.modules }
    : existingModules;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: input.name,
      description: input.description,
      color: input.color,
      modules: updatedModules ?? {},
    },
    include: {
      members: {
        where: {
          role: "OWNER",
        },
        take: 1,
      },
    },
  });

  // Güncelleyen kişinin rolünü al
  const membership = await prisma.projectMember.findFirst({
    where: { projectId },
    orderBy: { role: "asc" },
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    modules: project.modules as Record<string, boolean>,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    role: (membership?.role || "MEMBER") as Role,
  };
}

/**
 * Projeyi sil
 */
export async function deleteProject(projectId: string): Promise<void> {
  // Cascade ile tüm ilişkili veriler silinir (lists, tasks, members, labels)
  await prisma.project.delete({
    where: { id: projectId },
  });
}

/**
 * Proje üyelerini getir
 */
export async function getProjectMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
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
    role: m.role as Role,
    joinedAt: m.joinedAt,
    user: m.user,
  }));
}

/**
 * Projeye üye ekle
 */
export async function addProjectMember(
  projectId: string,
  email: string,
  role: Role = "MEMBER",
): Promise<{
  id: string;
  role: Role;
  user: { id: string; name: string; email: string };
}> {
  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw ApiError.notFound("Bu e-posta adresine sahip kullanıcı bulunamadı");
  }

  // Zaten üye mi kontrol et
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: user.id, projectId },
    },
  });

  if (existingMember) {
    throw ApiError.conflict("Bu kullanıcı zaten projenin üyesi");
  }

  // OWNER olarak eklenemez (sadece oluşturucu OWNER olabilir)
  if (role === "OWNER") {
    throw ApiError.badRequest("Kullanıcı OWNER olarak eklenemez");
  }

  const member = await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    id: member.id,
    role: member.role as Role,
    user: member.user,
  };
}

/**
 * Üye rolünü güncelle
 */
export async function updateMemberRole(
  memberId: string,
  newRole: Role,
  currentUserRole: Role,
): Promise<void> {
  const member = await prisma.projectMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  // OWNER değiştirilemez
  if (member.role === "OWNER") {
    throw ApiError.forbidden("Proje sahibinin rolü değiştirilemez");
  }

  // OWNER yapılamaz (transfer için ayrı endpoint)
  if (newRole === "OWNER") {
    throw ApiError.badRequest("OWNER rolü atanamaz");
  }

  // Sadece OWNER başkasını ADMIN yapabilir
  if (newRole === "ADMIN" && currentUserRole !== "OWNER") {
    throw ApiError.forbidden("Sadece proje sahibi ADMIN atayabilir");
  }

  await prisma.projectMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

/**
 * Üyeyi projeden çıkar
 */
export async function removeMember(memberId: string): Promise<void> {
  const member = await prisma.projectMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound("Üye bulunamadı");
  }

  // OWNER çıkarılamaz
  if (member.role === "OWNER") {
    throw ApiError.forbidden("Proje sahibi projeden çıkarılamaz");
  }

  await prisma.projectMember.delete({
    where: { id: memberId },
  });
}

/**
 * Proje labellerini getir
 */
export async function getProjectLabels(projectId: string) {
  return prisma.label.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
}

/**
 * Label oluştur
 */
export async function createLabel(
  projectId: string,
  name: string,
  color: string,
) {
  // Aynı isimde label var mı kontrol et
  const existing = await prisma.label.findUnique({
    where: {
      name_projectId: { name, projectId },
    },
  });

  if (existing) {
    throw ApiError.conflict("Bu isimde bir etiket zaten var");
  }

  return prisma.label.create({
    data: {
      name,
      color,
      projectId,
    },
  });
}

/**
 * Label güncelle
 */
export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
) {
  const label = await prisma.label.findUnique({
    where: { id: labelId },
  });

  if (!label) {
    throw ApiError.notFound("Etiket bulunamadı");
  }

  // İsim değişiyorsa, aynı projede aynı isimde başka label var mı kontrol et
  if (data.name && data.name !== label.name) {
    const existing = await prisma.label.findUnique({
      where: {
        name_projectId: { name: data.name, projectId: label.projectId },
      },
    });

    if (existing) {
      throw ApiError.conflict("Bu isimde bir etiket zaten var");
    }
  }

  return prisma.label.update({
    where: { id: labelId },
    data,
  });
}

/**
 * Label sil
 */
export async function deleteLabel(labelId: string): Promise<void> {
  await prisma.label.delete({
    where: { id: labelId },
  });
}
