/**
 * BoardHeader Component
 * Board sayfasının üst kısmı (Proje adı, üyeler, butonlar)
 */

import { Link } from "react-router";
import { ChevronLeft, Users, Settings, Share2, Filter } from "lucide-react";
import type { ProjectWithRole } from "@taskflow/shared";

interface BoardHeaderProps {
  project: ProjectWithRole;
}

export function BoardHeader({ project }: BoardHeaderProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition"
          title="Projelere Dön"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-bold text-gray-900 truncate max-w-xs">
            {project.name}
          </h1>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Quick Filters (Placeholder) */}
        <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Members</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
        {project.role !== "MEMBER" && (
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
