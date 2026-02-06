import { describe, it, expect } from "vitest";
import { toTaskWithDetails } from "../services/task.service.js";
import { toListWithCount, toListResponse } from "../services/list.service.js";

describe("toTaskWithDetails", () => {
  it("should correctly map a Prisma task to TaskWithDetails", () => {
    const prismaTask = {
      id: "task-1",
      title: "Test Task",
      description: "Description",
      priority: "HIGH" as const,
      position: 0,
      dueDate: new Date("2026-02-10"),
      metadata: { custom: "value" },
      archivedAt: null,
      listId: "list-1",
      projectId: "project-1",
      assigneeId: "user-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-02-01"),
      assignee: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        avatar: null,
      },
      labels: [
        {
          taskId: "task-1",
          labelId: "label-1",
          label: {
            id: "label-1",
            name: "Bug",
            color: "#ff0000",
            projectId: "project-1",
          },
        },
      ],
      list: {
        id: "list-1",
        name: "To Do",
      },
    };

    const result = toTaskWithDetails(prismaTask);

    expect(result).toEqual({
      id: "task-1",
      title: "Test Task",
      description: "Description",
      priority: "HIGH",
      position: 0,
      dueDate: prismaTask.dueDate,
      metadata: { custom: "value" },
      archivedAt: null,
      listId: "list-1",
      projectId: "project-1",
      assigneeId: "user-1",
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
      assignee: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        avatar: null,
      },
      labels: [
        {
          id: "label-1",
          name: "Bug",
          color: "#ff0000",
          projectId: "project-1",
        },
      ],
      list: {
        id: "list-1",
        name: "To Do",
      },
    });
  });

  it("should handle null assignee", () => {
    const prismaTask = {
      id: "task-2",
      title: "Unassigned Task",
      description: null,
      priority: "LOW" as const,
      position: 1,
      dueDate: null,
      metadata: {},
      archivedAt: null,
      listId: "list-1",
      projectId: "project-1",
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignee: null,
      labels: [],
      list: {
        id: "list-1",
        name: "To Do",
      },
    };

    const result = toTaskWithDetails(prismaTask);

    expect(result.assignee).toBeNull();
    expect(result.labels).toEqual([]);
    expect(result.description).toBeNull();
  });
});

describe("toListWithCount", () => {
  it("should correctly map a Prisma list with count", () => {
    const prismaList = {
      id: "list-1",
      name: "To Do",
      position: 0,
      color: "#6B7280",
      isArchive: false,
      requiredRoleToEnter: [],
      requiredRoleToLeave: [],
      projectId: "project-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-02-01"),
      _count: {
        tasks: 5,
      },
    };

    const result = toListWithCount(prismaList);

    expect(result).toEqual({
      id: "list-1",
      name: "To Do",
      position: 0,
      color: "#6B7280",
      isArchive: false,
      requiredRoleToEnter: [],
      requiredRoleToLeave: [],
      projectId: "project-1",
      createdAt: prismaList.createdAt,
      updatedAt: prismaList.updatedAt,
      taskCount: 5,
    });
  });
});

describe("toListResponse", () => {
  it("should correctly map a Prisma list with explicit taskCount", () => {
    const prismaList = {
      id: "list-2",
      name: "In Progress",
      position: 1,
      color: "#3B82F6",
      isArchive: false,
      requiredRoleToEnter: ["ADMIN"] as ("OWNER" | "ADMIN" | "MEMBER")[],
      requiredRoleToLeave: [],
      projectId: "project-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-02-01"),
    };

    const result = toListResponse(prismaList, 3);

    expect(result.taskCount).toBe(3);
    expect(result.name).toBe("In Progress");
    expect(result.requiredRoleToEnter).toEqual(["ADMIN"]);
  });

  it("should default taskCount to 0", () => {
    const prismaList = {
      id: "list-3",
      name: "Done",
      position: 2,
      color: "#10B981",
      isArchive: false,
      requiredRoleToEnter: [],
      requiredRoleToLeave: [],
      projectId: "project-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toListResponse(prismaList);

    expect(result.taskCount).toBe(0);
  });
});
