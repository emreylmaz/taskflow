/**
 * useProjects Hook
 * Proje listesi ve CRUD işlemleri
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import type {
  ProjectWithDetails,
  CreateProjectRequest,
} from "@taskflow/shared";

interface UseProjectsReturn {
  projects: ProjectWithDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<ProjectWithDetails>;
  deleteProject: (projectId: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<ProjectWithDetails[]>("/projects");
      setProjects(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Projeler yüklenemedi";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (data: CreateProjectRequest): Promise<ProjectWithDetails> => {
      const project = await api.post<ProjectWithDetails>("/projects", data);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    },
    [],
  );

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    createProject,
    deleteProject,
  };
}
