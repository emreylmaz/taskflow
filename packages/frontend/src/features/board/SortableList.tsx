import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ListColumn } from "./ListColumn";
import { SortableTask } from "./SortableTask";
import type { ListWithTasks, TaskWithDetails } from "@taskflow/shared";
import { useMemo } from "react";

interface SortableListProps {
  list: ListWithTasks;
  onTaskClick: (task: TaskWithDetails) => void;
  onCreateTask: (listId: string, title: string) => Promise<void>;
}

export function SortableList({
  list,
  onTaskClick,
  onCreateTask,
}: SortableListProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "List",
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskIds = useMemo(() => list.tasks.map((t) => t.id), [list.tasks]);

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <div {...attributes} {...listeners} className="h-full">
        {/* We need to modify ListColumn to accept children or render prop to inject SortableTask */}
        {/* For now, let's modify ListColumn to handle this internally or duplicate the structure */}
        {/* Better: Let's pass a custom TaskComponent to ListColumn */}
        <ListColumn
          list={list}
          onTaskClick={onTaskClick}
          onCreateTask={onCreateTask}
          renderTask={(task) => (
            <SortableTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          )}
          contextWrapper={(children) => (
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              {children}
            </SortableContext>
          )}
        />
      </div>
    </div>
  );
}
