/**
 * ProjectsPage Component
 * Modern animated projects page with theme support
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useProjects } from "./hooks/useProjects";
import { ProjectCard } from "./ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import {
  Button,
  ThemeToggle,
  NoProjectsEmpty,
  SkeletonCard,
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/ui";

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const { projects, isLoading, error, createProject, deleteProject } =
    useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 shadow-sm border-b border-surface-200 dark:border-surface-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-surface-900 dark:text-white text-lg">
                TaskFlow
              </span>
            </motion.div>

            <div className="flex items-center gap-3">
              <ThemeToggle size="sm" />
              <span className="text-sm text-surface-600 dark:text-surface-400 hidden sm:block">
                Merhaba,{" "}
                <span className="font-medium text-surface-900 dark:text-white">
                  {user?.name}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Çıkış</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <PageTransition>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                Projelerim
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Tüm projelerini buradan yönet
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Yeni Proje
            </Button>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-xl p-4 text-error-600 dark:text-error-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!isLoading && !error && projects.length === 0 && (
            <NoProjectsEmpty onCreateClick={() => setIsModalOpen(true)} />
          )}

          {/* Projects Grid */}
          {!isLoading && !error && projects.length > 0 && (
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                  <StaggerItem key={project.id}>
                    <ProjectCard project={project} onDelete={deleteProject} />
                  </StaggerItem>
                ))}
              </AnimatePresence>
            </StaggerList>
          )}
        </main>
      </PageTransition>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await createProject(data);
        }}
      />
    </div>
  );
}
