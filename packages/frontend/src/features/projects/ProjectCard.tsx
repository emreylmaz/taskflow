/**
 * ProjectCard Component
 * Modern animated project card with hover effects
 */

import { Link } from "react-router";
import { Users, CheckSquare, MoreVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProjectWithDetails } from "@taskflow/shared";
import { useState, useRef, useEffect } from "react";

interface ProjectCardProps {
  project: ProjectWithDetails;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleDelete = () => {
    if (onDelete && confirm("Bu projeyi silmek istediğinizden emin misiniz?")) {
      onDelete(project.id);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-lg border border-surface-200 dark:border-surface-700 overflow-hidden group transition-shadow"
    >
      {/* Color Bar */}
      <motion.div
        className="h-1.5"
        style={{ backgroundColor: project.color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      />

      {/* Content */}
      <Link to={`/projects/${project.id}`} className="block p-5">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-surface-500 dark:text-surface-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{project.memberCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            <span>{project.taskCount}</span>
          </div>
        </div>
      </Link>

      {/* Menu Button (only for OWNER) */}
      {project.role === "OWNER" && (
        <div className="absolute top-4 right-4" ref={menuRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-surface-400" />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-44 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-1.5 z-10"
              >
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Projeyi Sil
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Role Badge */}
      <div className="absolute bottom-4 right-4">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            project.role === "OWNER"
              ? "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
              : project.role === "ADMIN"
                ? "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300"
                : "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300"
          }`}
        >
          {project.role === "OWNER"
            ? "Sahip"
            : project.role === "ADMIN"
              ? "Admin"
              : "Üye"}
        </motion.span>
      </div>
    </motion.div>
  );
}
