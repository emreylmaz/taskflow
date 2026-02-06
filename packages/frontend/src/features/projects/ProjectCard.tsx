/**
 * ProjectCard Component
 * Proje kartı (grid içinde gösterilir)
 */

import { Link } from "react-router";
import { Users, CheckSquare, MoreVertical, Trash2 } from "lucide-react";
import type { ProjectWithDetails } from "@taskflow/shared";
import { useState, useRef, useEffect } from "react";

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
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Color Bar */}
      <div
        className="h-2 rounded-t-xl"
        style={{ backgroundColor: project.color }}
      />

      {/* Content */}
      <Link to={`/projects/${project.id}`} className="block p-4">
        <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
        {project.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
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
            className="p-1 rounded hover:bg-gray-100 transition"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
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
          className={`text-xs px-2 py-0.5 rounded-full ${
            project.role === "OWNER"
              ? "bg-indigo-100 text-indigo-700"
              : project.role === "ADMIN"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
          }`}
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
