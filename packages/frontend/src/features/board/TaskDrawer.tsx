/**
 * TaskDrawer Component
 * Sağdan açılan task detay paneli
 */

import { useEffect, useState } from "react";
import { X, Calendar, User, Archive } from "lucide-react";
import type { TaskWithDetails, UpdateTaskRequest } from "@taskflow/shared";

interface TaskDrawerProps {
  task: TaskWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, data: UpdateTaskRequest) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskDrawer({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Task değişince state'i güncelle
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  // ESC ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const handleTitleBlur = () => {
    if (title !== task.title) {
      onUpdate(task.id, { title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || "")) {
      onUpdate(task.id, { description });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
              {task.list?.name || "Task"}
            </span>
            <span className="text-gray-300">/</span>
            <span>{task.id.slice(-6)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Arşivle"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Title */}
            <div>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full text-2xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 p-0 resize-none placeholder-gray-300"
                placeholder="Görev başlığı"
                rows={1}
                style={{ minHeight: "2.5rem" }}
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Atanan
                </label>
                <div className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                    {task.assignee ? (
                      task.assignee.avatar ? (
                        <img
                          src={task.assignee.avatar}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        task.assignee.name[0]
                      )
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">
                    {task.assignee?.name || "Atanmamış"}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Bitiş Tarihi
                </label>
                <div className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                  <span className="text-sm text-gray-700">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                        })
                      : "Tarih yok"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 block">
                Açıklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                className="w-full min-h-[12rem] text-sm text-gray-600 bg-gray-50/50 border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
                placeholder="Bu görev hakkında detaylı bilgi ekleyin..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
