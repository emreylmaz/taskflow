/**
 * List Service
 * Liste CRUD işlemleri
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  CreateListInput,
  UpdateListInput,
  ListWithTasks,
  ListWithTaskCount,
  Role,
  TaskWithDetails,
  Priority,
} from "@taskflow/shared";

// ═══════════════════════════════════════════════════════════════════════════════
// Include Configurations & Response Mappers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard task include for list queries (without list relation to avoid circular)
 */
const taskInListInclude = {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  labels: {
    include: {
      label: true,
    },
  },
} as const;

// Type for task within list includes
type TaskInListPayload = Prisma.TaskGetPayload<{
  include: typeof taskInListInclude;
}>;

/**
 * Convert Prisma Task (from list query) to TaskWithDetails-like response
 * Omits 'list' field since it's already part of parent
 */
function toTaskInList(task: TaskInListPayload): Omit<TaskWithDetails, "list"> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority as Priority,
    position: task.position,
    dueDate: task.dueDate,
    metadata: task.metadata as Record<string, unknown>,
    archivedAt: task.archivedAt,
    listId: task.listId,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignee: task.assignee,
    labels: task.labels.map((tl) => tl.label),
  };
}

// Type for list with count
type ListWithCountPayload = Prisma.ListGetPayload<{
  include: { _count: { select: { tasks: true } } };
}>;

/**
 * Convert Prisma List to ListWithTaskCount response
 */
export function toListWithCount(list: ListWithCountPayload): ListWithTaskCount {
  return {
    id: list.id,
    name: list.name,
    position: list.position,
    color: list.color,
    isArchive: list.isArchive,
    requiredRoleToEnter: list.requiredRoleToEnter as Role[],
    requiredRoleToLeave: list.requiredRoleToLeave as Role[],
    projectId: list.projectId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    taskCount: list._count.tasks,
  };
}

/**
 * Convert Prisma List (without count) to ListWithTaskCount with taskCount = 0
 */
export function toListResponse(
  list: Prisma.ListGetPayload<object>,
  taskCount = 0,
): ListWithTaskCount {
  return {
    id: list.id,
    name: list.name,
    position: list.position,
    color: list.color,
    isArchive: list.isArchive,
    requiredRoleToEnter: list.requiredRoleToEnter as Role[],
    requiredRoleToLeave: list.requiredRoleToLeave as Role[],
    projectId: list.projectId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    taskCount,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// List Service Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Proje listelerini getir (task'larla birlikte)
 */
export async function getProjectLists(
  projectId: string,
  includeArchive = false,
): Promise<ListWithTasks[]> {
  const lists = await prisma.list.findMany({
    where: {
      projectId,
      // Archive listesi default olarak gizli
      ...(includeArchive ? {} : { isArchive: false }),
    },
    include: {
      tasks: {
        where: {
          archivedAt: null, // Sadece aktif task'lar
        },
        orderBy: { position: "asc" },
        include: taskInListInclude,
      },
    },
    orderBy: { position: "asc" },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    position: list.position,
    color: list.color,
    isArchive: list.isArchive,
    requiredRoleToEnter: list.requiredRoleToEnter as Role[],
    requiredRoleToLeave: list.requiredRoleToLeave as Role[],
    projectId: list.projectId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    tasks: list.tasks.map(toTaskInList),
  }));
}

/**
 * Tek listeyi getir
 */
export async function getListById(listId: string): Promise<ListWithTaskCount> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      _count: {
        select: {
          tasks: {
            where: { archivedAt: null },
          },
        },
      },
    },
  });

  if (!list) {
    throw ApiError.notFound("Liste bulunamadı");
  }

  return toListWithCount(list);
}

/**
 * Yeni liste oluştur
 */
export async function createList(
  projectId: string,
  input: CreateListInput,
): Promise<ListWithTaskCount> {
  // Position belirtilmemişse, Archive'dan önceki son pozisyona ekle
  let position = input.position;
  if (position === undefined) {
    const lastList = await prisma.list.findFirst({
      where: {
        projectId,
        isArchive: false,
      },
      orderBy: { position: "desc" },
    });
    position = (lastList?.position ?? -1) + 1;
  }

  const list = await prisma.list.create({
    data: {
      name: input.name,
      color: input.color,
      position,
      projectId,
    },
  });

  return toListResponse(list, 0);
}

/**
 * Listeyi güncelle
 */
export async function updateList(
  listId: string,
  input: UpdateListInput,
): Promise<ListWithTaskCount> {
  const existing = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!existing) {
    throw ApiError.notFound("Liste bulunamadı");
  }

  // Archive listesinin adı ve bazı özellikleri değiştirilemez
  if (existing.isArchive) {
    if (input.name && input.name !== existing.name) {
      throw ApiError.badRequest("Arşiv listesinin adı değiştirilemez");
    }
  }

  const list = await prisma.list.update({
    where: { id: listId },
    data: {
      name: input.name,
      color: input.color,
      requiredRoleToEnter: input.requiredRoleToEnter,
      requiredRoleToLeave: input.requiredRoleToLeave,
    },
    include: {
      _count: {
        select: {
          tasks: {
            where: { archivedAt: null },
          },
        },
      },
    },
  });

  return toListWithCount(list);
}

/**
 * Listeyi sil
 * Archive listesi silinemez
 * Silinen listenin task'ları Archive'a taşınır
 */
export async function deleteList(listId: string): Promise<void> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      project: {
        include: {
          lists: {
            where: { isArchive: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!list) {
    throw ApiError.notFound("Liste bulunamadı");
  }

  if (list.isArchive) {
    throw ApiError.badRequest("Arşiv listesi silinemez");
  }

  const archiveList = list.project.lists[0];
  if (!archiveList) {
    throw ApiError.internalError("Arşiv listesi bulunamadı");
  }

  // Transaction: Task'ları Archive'a taşı, sonra listeyi sil
  await prisma.$transaction([
    // Task'ları Archive listesine taşı
    prisma.task.updateMany({
      where: { listId },
      data: {
        listId: archiveList.id,
        archivedAt: new Date(),
      },
    }),
    // Listeyi sil
    prisma.list.delete({
      where: { id: listId },
    }),
  ]);
}

/**
 * Listeleri yeniden sırala
 * Batch update ile N+1 query problemini önler
 */
export async function reorderLists(
  projectId: string,
  listIds: string[],
): Promise<void> {
  // Tüm listelerin bu projeye ait olduğunu doğrula
  const lists = await prisma.list.findMany({
    where: {
      id: { in: listIds },
      projectId,
      isArchive: false, // Archive listesi yeniden sıralanamaz
    },
  });

  if (lists.length !== listIds.length) {
    throw ApiError.badRequest("Geçersiz liste ID'leri");
  }

  // Batch update: CASE-WHEN ile tek sorguda tüm pozisyonları güncelle
  if (listIds.length === 0) return;

  const caseStatements = listIds
    .map((id, index) => `WHEN id = '${id}' THEN ${index}`)
    .join(" ");

  await prisma.$executeRawUnsafe(`
    UPDATE "List"
    SET position = CASE ${caseStatements} END,
        "updatedAt" = NOW()
    WHERE id IN (${listIds.map((id) => `'${id}'`).join(", ")})
  `);
}

/**
 * Liste flow control ayarlarını güncelle
 */
export async function updateFlowControl(
  listId: string,
  requiredRoleToEnter: Role[],
  requiredRoleToLeave: Role[],
): Promise<ListWithTaskCount> {
  const existing = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!existing) {
    throw ApiError.notFound("Liste bulunamadı");
  }

  // Archive listesinin flow control ayarları değiştirilemez
  if (existing.isArchive) {
    throw ApiError.badRequest(
      "Arşiv listesinin flow control ayarları değiştirilemez",
    );
  }

  const list = await prisma.list.update({
    where: { id: listId },
    data: {
      requiredRoleToEnter,
      requiredRoleToLeave,
    },
    include: {
      _count: {
        select: {
          tasks: {
            where: { archivedAt: null },
          },
        },
      },
    },
  });

  return toListWithCount(list);
}

/**
 * Archive listesini getir
 */
export async function getArchiveList(
  projectId: string,
): Promise<ListWithTasks> {
  const archiveList = await prisma.list.findFirst({
    where: {
      projectId,
      isArchive: true,
    },
    include: {
      tasks: {
        where: {
          archivedAt: { not: null },
        },
        orderBy: { archivedAt: "desc" },
        include: taskInListInclude,
      },
    },
  });

  if (!archiveList) {
    throw ApiError.notFound("Arşiv listesi bulunamadı");
  }

  return {
    id: archiveList.id,
    name: archiveList.name,
    position: archiveList.position,
    color: archiveList.color,
    isArchive: archiveList.isArchive,
    requiredRoleToEnter: archiveList.requiredRoleToEnter as Role[],
    requiredRoleToLeave: archiveList.requiredRoleToLeave as Role[],
    projectId: archiveList.projectId,
    createdAt: archiveList.createdAt,
    updatedAt: archiveList.updatedAt,
    tasks: archiveList.tasks.map(toTaskInList),
  };
}
