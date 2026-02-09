/**
 * TaskCard Component
 * Board üzerindeki görev kartı - keyboard accessible
 */

import { Calendar, User, AlignLeft } from "lucide-react";
import type { TaskWithDetails } from "@taskflow/shared";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  MEDIUM: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "bg-white dark:bg-surface-800 p-3 rounded-lg shadow-sm",
        "border border-gray-200 dark:border-surface-700",
        "hover:shadow-md cursor-pointer transition-shadow group",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      )}
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
      <h4 className="text-sm font-medium text-gray-900 dark:text-surface-100 mb-1 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {task.title}
      </h4>

      {/* Metadata Row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue
                  ? "text-red-500"
                  : "text-gray-500 dark:text-surface-400",
              )}
            >
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
          {task.description && (
            <AlignLeft className="w-3 h-3 text-gray-400 dark:text-surface-500" />
          )}
        </div>

        {/* Assignee Avatar or Priority */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div
              className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-primary-500/20 flex items-center justify-center text-[10px] font-medium text-indigo-700 dark:text-primary-300 ring-2 ring-white dark:ring-surface-800"
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
            <User className="w-4 h-4 text-gray-300 dark:text-surface-600" />
          )}

          {task.priority !== "MEDIUM" && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                PRIORITY_COLORS[task.priority],
              )}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
