/**
 * ProjectCard Component
 * Proje kartı (grid içinde gösterilir)
 */

import { Link } from "react-router";
import { Users, CheckSquare, MoreVertical, Trash2 } from "lucide-react";
import type { ProjectWithDetails } from "@taskflow/shared";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectWithDetails;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
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
    <div
      className={cn(
        "relative bg-white dark:bg-surface-800 rounded-xl shadow-sm",
        "border border-gray-200 dark:border-surface-700",
        "hover:shadow-md transition-shadow",
      )}
    >
      {/* Color Bar */}
      <div
        className="h-2 rounded-t-xl"
        style={{ backgroundColor: project.color }}
      />

      {/* Content - Link is naturally keyboard accessible */}
      <Link
        to={`/projects/${project.id}`}
        className="block p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-b-xl"
      >
        <h3 className="font-semibold text-gray-900 dark:text-surface-100 truncate">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-gray-500 dark:text-surface-400 mt-1 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-surface-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{project.memberCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckSquare className="w-4 h-4" />
            <span>{project.taskCount}</span>
          </div>
        </div>
      </Link>

      {/* Menu Button (only for OWNER) */}
      {project.role === "OWNER" && (
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            aria-label="Proje menüsü"
            aria-expanded={showMenu}
            aria-haspopup="menu"
            className={cn(
              "p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-700 transition",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
            )}
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              role="menu"
              className={cn(
                "absolute right-0 mt-1 w-40 bg-white dark:bg-surface-800",
                "rounded-lg shadow-lg border border-gray-200 dark:border-surface-700",
                "py-1 z-10",
              )}
            >
              <button
                role="menuitem"
                onClick={handleDelete}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-50 dark:hover:bg-red-500/10 transition",
                )}
              >
                <Trash2 className="w-4 h-4" />
                Projeyi Sil
              </button>
            </div>
          )}
        </div>
      )}

      {/* Role Badge */}
      <div className="absolute bottom-3 right-3">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            project.role === "OWNER" &&
              "bg-indigo-100 text-indigo-700 dark:bg-primary-500/20 dark:text-primary-300",
            project.role === "ADMIN" &&
              "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
            project.role === "MEMBER" &&
              "bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-surface-300",
          )}
        >
          {project.role === "OWNER"
            ? "Sahip"
            : project.role === "ADMIN"
              ? "Admin"
              : "Üye"}
        </span>
      </div>
    </div>
  );
}
