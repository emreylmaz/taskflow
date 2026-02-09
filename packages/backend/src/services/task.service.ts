/**
 * Task Service
 * Görev CRUD işlemleri
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  TaskWithDetails,
  Priority,
  Role,
} from "@taskflow/shared";

// ═══════════════════════════════════════════════════════════════════════════════
// Prisma Include Configuration & Response Mapper
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard include configuration for task queries
 */
export const taskIncludeConfig = {
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
  list: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

// Type for task with includes
type TaskWithIncludes = Prisma.TaskGetPayload<{
  include: typeof taskIncludeConfig;
}>;

/**
 * Convert Prisma Task entity to TaskWithDetails response type
 * Centralizes response mapping to avoid DRY violations
 */
export function toTaskWithDetails(task: TaskWithIncludes): TaskWithDetails {
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
    list: task.list,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Task Service Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Task'ı detaylı olarak getir
 */
export async function getTaskById(taskId: string): Promise<TaskWithDetails> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskIncludeConfig,
  });

  if (!task) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  return toTaskWithDetails(task);
}

/**
 * Yeni task oluştur
 */
export async function createTask(
  listId: string,
  input: CreateTaskInput,
): Promise<TaskWithDetails> {
  // List'i kontrol et
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw ApiError.notFound("Liste bulunamadı");
  }

  // Archive listesine doğrudan task eklenemez
  if (list.isArchive) {
    throw ApiError.badRequest("Arşiv listesine görev eklenemez");
  }

  // Position: Listenin sonuna ekle
  const lastTask = await prisma.task.findFirst({
    where: {
      listId,
      archivedAt: null,
    },
    orderBy: { position: "desc" },
  });
  const position = (lastTask?.position ?? -1) + 1;

  // Label'ları doğrula (aynı projeye ait mi)
  if (input.labelIds?.length) {
    const labels = await prisma.label.findMany({
      where: {
        id: { in: input.labelIds },
        projectId: list.projectId,
      },
    });
    if (labels.length !== input.labelIds.length) {
      throw ApiError.badRequest("Geçersiz etiket ID'leri");
    }
  }

  // Assignee'yi doğrula (proje üyesi mi)
  if (input.assigneeId) {
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId: input.assigneeId,
        projectId: list.projectId,
      },
    });
    if (!membership) {
      throw ApiError.badRequest("Atanan kullanıcı proje üyesi değil");
    }
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority || "MEDIUM",
      position,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      listId,
      projectId: list.projectId,
      assigneeId: input.assigneeId,
      labels: input.labelIds?.length
        ? {
            create: input.labelIds.map((labelId) => ({ labelId })),
          }
        : undefined,
    },
    include: taskIncludeConfig,
  });

  return toTaskWithDetails(task);
}

/**
 * Task'ı güncelle
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskWithDetails> {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existing) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  // Arşivlenmiş task güncellenemez
  if (existing.archivedAt) {
    throw ApiError.badRequest("Arşivlenmiş görev güncellenemez");
  }

  // Label'ları doğrula
  if (input.labelIds !== undefined) {
    if (input.labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: input.labelIds },
          projectId: existing.projectId,
        },
      });
      if (labels.length !== input.labelIds.length) {
        throw ApiError.badRequest("Geçersiz etiket ID'leri");
      }
    }
  }

  // Assignee'yi doğrula
  if (input.assigneeId) {
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId: input.assigneeId,
        projectId: existing.projectId,
      },
    });
    if (!membership) {
      throw ApiError.badRequest("Atanan kullanıcı proje üyesi değil");
    }
  }

  // Transaction: Label'ları güncelle + task'ı güncelle
  const task = await prisma.$transaction(async (tx) => {
    // Label'ları güncelle (varsa)
    if (input.labelIds !== undefined) {
      // Mevcut label'ları sil
      await tx.taskLabel.deleteMany({
        where: { taskId },
      });
      // Yeni label'ları ekle
      if (input.labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: input.labelIds.map((labelId) => ({ taskId, labelId })),
        });
      }
    }

    // Metadata'yı merge et (varsa)
    const existingMetadata = (existing.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const newMetadata = input.metadata
      ? { ...existingMetadata, ...input.metadata }
      : undefined;

    // Task'ı güncelle
    return await tx.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate:
          input.dueDate === null
            ? null
            : input.dueDate
              ? new Date(input.dueDate)
              : undefined,
        assigneeId: input.assigneeId,
        metadata: newMetadata as Prisma.InputJsonValue | undefined,
      },
      include: taskIncludeConfig,
    });
  });

  return toTaskWithDetails(task);
}

/**
 * Flow control validation helper
 * Checks if user has permission to move task out of source list and into target list
 */
export async function validateFlowControl(
  sourceList: { requiredRoleToLeave: string[] },
  targetList: { requiredRoleToEnter: string[] },
  userRole: Role,
): Promise<{ allowed: boolean; reason?: string }> {
  // Check leave permission
  if (sourceList.requiredRoleToLeave.length > 0) {
    if (!sourceList.requiredRoleToLeave.includes(userRole)) {
      return {
        allowed: false,
        reason: "Bu listeden görev taşıma yetkiniz yok",
      };
    }
  }

  // Check enter permission
  if (targetList.requiredRoleToEnter.length > 0) {
    if (!targetList.requiredRoleToEnter.includes(userRole)) {
      return {
        allowed: false,
        reason: "Hedef listeye görev taşıma yetkiniz yok",
      };
    }
  }

  return { allowed: true };
}

/**
 * Task'ı başka listeye taşı
 */
export async function moveTask(
  taskId: string,
  input: MoveTaskInput,
  userRole?: Role,
): Promise<TaskWithDetails> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: {
        select: {
          id: true,
          requiredRoleToLeave: true,
        },
      },
    },
  });

  if (!task) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  // Hedef listeyi kontrol et
  const targetList = await prisma.list.findUnique({
    where: { id: input.listId },
  });

  if (!targetList) {
    throw ApiError.notFound("Hedef liste bulunamadı");
  }

  // Aynı projeye ait olmalı
  if (targetList.projectId !== task.projectId) {
    throw ApiError.badRequest("Görev farklı bir projeye taşınamaz");
  }

  // Skip flow control check if moving to same list (reorder)
  if (task.listId !== input.listId && userRole) {
    const flowCheck = await validateFlowControl(
      { requiredRoleToLeave: task.list.requiredRoleToLeave as string[] },
      { requiredRoleToEnter: targetList.requiredRoleToEnter as string[] },
      userRole,
    );

    if (!flowCheck.allowed) {
      throw ApiError.forbidden(
        flowCheck.reason || "Bu taşıma işlemi için yetkiniz yok",
      );
    }
  }

  // Archive'a taşınıyorsa archivedAt set et
  const archivedAt = targetList.isArchive ? new Date() : null;

  // Position hesapla
  let position = input.position;
  if (position === undefined) {
    const lastTask = await prisma.task.findFirst({
      where: {
        listId: input.listId,
        archivedAt: null,
      },
      orderBy: { position: "desc" },
    });
    position = (lastTask?.position ?? -1) + 1;
  }

  // Task'ı taşı
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      listId: input.listId,
      position,
      archivedAt,
    },
    include: taskIncludeConfig,
  });

  return toTaskWithDetails(updatedTask);
}

/**
 * Liste içinde task'ları yeniden sırala
 * Batch update ile N+1 query problemini önler
 */
export async function reorderTasks(
  listId: string,
  taskIds: string[],
): Promise<void> {
  // Tüm task'ların bu listeye ait olduğunu doğrula
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      listId,
      archivedAt: null,
    },
  });

  if (tasks.length !== taskIds.length) {
    throw ApiError.badRequest("Geçersiz görev ID'leri");
  }

  // Batch update: CASE-WHEN ile tek sorguda tüm pozisyonları güncelle
  // Bu, N ayrı UPDATE yerine tek bir UPDATE query çalıştırır
  if (taskIds.length === 0) return;

  const caseStatements = taskIds
    .map((id, index) => `WHEN id = '${id}' THEN ${index}`)
    .join(" ");

  await prisma.$executeRawUnsafe(`
    UPDATE "Task"
    SET position = CASE ${caseStatements} END,
        "updatedAt" = NOW()
    WHERE id IN (${taskIds.map((id) => `'${id}'`).join(", ")})
  `);
}

/**
 * Task'ı arşivle (soft delete)
 */
export async function archiveTask(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
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

  if (!task) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  if (task.archivedAt) {
    throw ApiError.badRequest("Görev zaten arşivlenmiş");
  }

  const archiveList = task.project.lists[0];
  if (!archiveList) {
    throw ApiError.internalError("Arşiv listesi bulunamadı");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      archivedAt: new Date(),
      listId: archiveList.id,
    },
  });
}

/**
 * Task'ı arşivden geri al
 */
export async function restoreTask(
  taskId: string,
  targetListId?: string,
): Promise<TaskWithDetails> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          lists: {
            where: { isArchive: false },
            orderBy: { position: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!task) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  if (!task.archivedAt) {
    throw ApiError.badRequest("Görev arşivlenmemiş");
  }

  // Hedef liste belirtilmemişse ilk listeye taşı
  let listId = targetListId;
  if (!listId) {
    const firstList = task.project.lists[0];
    if (!firstList) {
      throw ApiError.internalError("Proje listesi bulunamadı");
    }
    listId = firstList.id;
  }

  // Hedef listede yeni pozisyon
  const lastTask = await prisma.task.findFirst({
    where: {
      listId,
      archivedAt: null,
    },
    orderBy: { position: "desc" },
  });
  const position = (lastTask?.position ?? -1) + 1;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      archivedAt: null,
      listId,
      position,
    },
    include: taskIncludeConfig,
  });

  return toTaskWithDetails(updatedTask);
}

/**
 * Task'ı kalıcı olarak sil
 */
export async function deleteTaskPermanently(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw ApiError.notFound("Görev bulunamadı");
  }

  // Sadece arşivlenmiş task'lar kalıcı olarak silinebilir
  if (!task.archivedAt) {
    throw ApiError.badRequest(
      "Sadece arşivlenmiş görevler kalıcı olarak silinebilir",
    );
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}
