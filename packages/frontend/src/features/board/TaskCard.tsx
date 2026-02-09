/**
 * TaskCard Component
 * Animated task card with hover effects
 */

import { Calendar, User, AlignLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { TaskWithDetails } from "@taskflow/shared";

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  MEDIUM:
    "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  URGENT:
    "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white dark:bg-surface-800 p-3.5 rounded-xl shadow-sm hover:shadow-md border border-surface-200 dark:border-surface-700 cursor-pointer group"
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.labels.map((label) => (
            <motion.div
              key={label.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-1.5 w-10 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {task.title}
      </h4>

      {/* Metadata Row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? "text-error-500"
                  : "text-surface-500 dark:text-surface-400"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
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
            <AlignLeft className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" />
          )}
        </div>

        {/* Assignee Avatar or Priority */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-[10px] font-semibold text-primary-700 dark:text-primary-300 ring-2 ring-white dark:ring-surface-800"
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
            </motion.div>
          ) : (
            <User className="w-4 h-4 text-surface-300 dark:text-surface-600" />
          )}

          {task.priority !== "MEDIUM" && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${PRIORITY_COLORS[task.priority]}`}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
