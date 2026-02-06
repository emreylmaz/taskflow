/**
 * ListColumn Component
 * Board üzerindeki bir liste kolonu
 */

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import type { ListWithTasks, TaskWithDetails } from "@taskflow/shared";
import { TaskCard } from "./TaskCard";
import { CreateTaskForm } from "./CreateTaskForm";

interface ListColumnProps {
  list: ListWithTasks;
  onTaskClick: (task: TaskWithDetails) => void;
  onCreateTask: (listId: string, title: string) => Promise<void>;
  onDeleteList?: (listId: string) => void;
  renderTask?: (task: TaskWithDetails) => React.ReactNode;
  contextWrapper?: (children: React.ReactNode) => React.ReactNode;
}

export function ListColumn({
  list,
  onTaskClick,
  onCreateTask,
  renderTask,
  contextWrapper,
}: ListColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);

  const tasksContent = (
    <div className="flex flex-col gap-2 pb-2">
      {list.tasks.map((task) =>
        renderTask ? (
          renderTask(task as TaskWithDetails)
        ) : (
          <TaskCard
            key={task.id}
            task={task as TaskWithDetails}
            onClick={() => onTaskClick(task as TaskWithDetails)}
          />
        ),
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-72 max-h-full bg-gray-50 rounded-xl border border-gray-200 shrink-0">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 text-sm">{list.name}</h3>
          <span className="text-xs text-gray-400 font-medium">
            {list.tasks.length}
          </span>
        </div>
        <button className="p-1 text-gray-400 hover:bg-gray-200 rounded transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        {contextWrapper ? contextWrapper(tasksContent) : tasksContent}
      </div>

      {/* Footer / Add Task */}
      {!isAddingTask ? (
        <button
          onClick={() => setIsAddingTask(true)}
          className="m-2 flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition text-left"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      ) : (
        <CreateTaskForm
          listId={list.id}
          onCancel={() => setIsAddingTask(false)}
          onSubmit={async (title) => {
            await onCreateTask(list.id, title);
            setIsAddingTask(false);
          }}
        />
      )}
    </div>
  );
}
