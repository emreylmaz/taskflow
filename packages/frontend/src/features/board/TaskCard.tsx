/**
 * TaskCard Component
 * Board üzerindeki görev kartı
 */

import { Calendar, User, AlignLeft } from "lucide-react";
import type { TaskWithDetails } from "@taskflow/shared";

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-gray-100 text-gray-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow group"
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <div
              key={label.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-1 leading-snug">
        {task.title}
      </h4>

      {/* Metadata Row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}

          {/* Description Indicator */}
          {task.description && <AlignLeft className="w-3 h-3 text-gray-400" />}
        </div>

        {/* Assignee Avatar or Priority */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div
              className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-medium text-indigo-700 ring-2 ring-white"
              title={task.assignee.name}
            >
              {task.assignee.avatar ? (
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="w-full h-full rounded-full"
                />
              ) : (
                task.assignee.name.charAt(0).toUpperCase()
              )}
            </div>
          ) : (
            <User className="w-4 h-4 text-gray-300" />
          )}

          {task.priority !== "MEDIUM" && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
