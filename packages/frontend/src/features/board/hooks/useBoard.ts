/**
 * useBoard Hook
 * Board data management, optimistic updates, and CRUD operations
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import type {
  ProjectWithRole,
  ListWithTasks,
  CreateListRequest,
  UpdateListRequest,
  UpdateFlowControlRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  TaskWithDetails,
  Role,
} from "@taskflow/shared";

interface UseBoardReturn {
  project: ProjectWithRole | null;
  lists: ListWithTasks[];
  isLoading: boolean;
  error: string | null;
  userRole: Role;
  refetch: () => Promise<void>;
  setLists: React.Dispatch<React.SetStateAction<ListWithTasks[]>>;
  createList: (data: CreateListRequest) => Promise<void>;
  updateList: (listId: string, data: UpdateListRequest) => Promise<void>;
  updateFlowControl: (
    listId: string,
    data: UpdateFlowControlRequest,
  ) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderLists: (listIds: string[]) => Promise<void>;
  createTask: (listId: string, data: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, data: UpdateTaskRequest) => Promise<void>;
  moveTask: (taskId: string, data: MoveTaskRequest) => Promise<void>;
  reorderTasks: (listId: string, taskIds: string[]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useBoard(projectId: string | undefined): UseBoardReturn {
  const [project, setProject] = useState<ProjectWithRole | null>(null);
  const [lists, setLists] = useState<ListWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [projectData, listsData] = await Promise.all([
        api.get<ProjectWithRole>(`/projects/${projectId}`),
        api.get<ListWithTasks[]>(`/projects/${projectId}/lists`),
      ]);

      setProject(projectData);
      setLists(listsData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Board verileri yüklenemedi";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const createList = useCallback(
    async (data: CreateListRequest) => {
      if (!projectId) return;
      const newList = await api.post<ListWithTasks>(
        `/projects/${projectId}/lists`,
        data,
      );
      setLists((prev) => [...prev, { ...newList, tasks: [] }]);
    },
    [projectId],
  );

  const updateList = useCallback(
    async (listId: string, data: UpdateListRequest) => {
      setLists((prev) =>
        prev.map((list) => (list.id === listId ? { ...list, ...data } : list)),
      );
      await api.put(`/lists/${listId}`, data);
    },
    [],
  );

  const updateFlowControl = useCallback(
    async (listId: string, data: UpdateFlowControlRequest) => {
      // Optimistic update
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                requiredRoleToEnter: data.requiredRoleToEnter,
                requiredRoleToLeave: data.requiredRoleToLeave,
              }
            : list,
        ),
      );
      await api.put(`/lists/${listId}/flow-control`, data);
    },
    [],
  );

  const deleteList = useCallback(async (listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
    await api.delete(`/lists/${listId}`);
  }, []);

  const reorderLists = useCallback(
    async (listIds: string[]) => {
      if (!projectId) return;
      await api.patch(`/projects/${projectId}/lists/reorder`, { listIds });
    },
    [projectId],
  );

  const createTask = useCallback(
    async (listId: string, data: CreateTaskRequest) => {
      const newTask = await api.post<TaskWithDetails>(
        `/lists/${listId}/tasks`,
        data,
      );
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return { ...list, tasks: [...list.tasks, newTask] };
          }
          return list;
        }),
      );
    },
    [],
  );

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest) => {
      // Optimistic update
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) => {
            if (task.id !== taskId) return task;

            // Merge data, handle date string to Date conversion for local state
            const updated: any = { ...task, ...data };
            if (typeof data.dueDate === "string") {
              updated.dueDate = new Date(data.dueDate);
            } else if (data.dueDate === null) {
              updated.dueDate = null;
            }
            return updated as TaskWithDetails;
          }),
        })),
      );
      await api.put(`/tasks/${taskId}`, data);
    },
    [],
  );

  const moveTask = useCallback(
    async (taskId: string, data: MoveTaskRequest) => {
      // Optimistic UI updates will be handled by DnD context usually,
      // but here is a basic implementation for API calls
      await api.patch(`/tasks/${taskId}/move`, data);
      fetchBoardData(); // Refresh to ensure sync for now
    },
    [fetchBoardData],
  );

  const reorderTasks = useCallback(
    async (listId: string, taskIds: string[]) => {
      await api.patch(`/lists/${listId}/tasks/reorder`, { taskIds });
    },
    [],
  );

  const deleteTask = useCallback(async (taskId: string) => {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      })),
    );
    await api.delete(`/tasks/${taskId}`);
  }, []);

  return {
    project,
    lists,
    isLoading,
    error,
    userRole: project?.role || "MEMBER",
    refetch: fetchBoardData,
    setLists,
    createList,
    updateList,
    updateFlowControl,
    deleteList,
    reorderLists,
    createTask,
    updateTask,
    moveTask,
    reorderTasks,
    deleteTask,
  };
}
