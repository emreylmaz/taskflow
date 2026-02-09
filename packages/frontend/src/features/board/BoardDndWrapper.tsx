import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import type { ListWithTasks, TaskWithDetails } from "@taskflow/shared";
import { TaskCard } from "./TaskCard";
import { ListColumn } from "./ListColumn";
import { createPortal } from "react-dom";

interface BoardDndWrapperProps {
  children: React.ReactNode;
  lists: ListWithTasks[];
  onReorderLists: (newLists: ListWithTasks[]) => void;
  onReorderTasks: (listId: string, newTasks: TaskWithDetails[]) => void;
  onMoveTask: (
    taskId: string,
    fromListId: string,
    toListId: string,
    newIndex: number,
  ) => void;
  onDragStartCallback?: (task: TaskWithDetails | null) => void;
  onDragEndCallback?: () => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function BoardDndWrapper({
  children,
  lists,
  onReorderLists,
  onReorderTasks,
  onMoveTask,
  onDragStartCallback,
  onDragEndCallback,
}: BoardDndWrapperProps) {
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [activeList, setActiveList] = useState<ListWithTasks | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === "Task") {
      const task = active.data.current.task as TaskWithDetails;
      setActiveTask(task);
      // Notify parent for flow control
      onDragStartCallback?.(task);
    } else if (active.data.current?.type === "List") {
      setActiveList(active.data.current.list);
      onDragStartCallback?.(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverList = over.data.current?.type === "List";

    if (!isActiveTask) return;

    // Task over Task
    if (isActiveTask && isOverTask) {
      const activeTask = active.data.current?.task as TaskWithDetails;
      const overTask = over.data.current?.task as TaskWithDetails;

      if (activeTask.listId !== overTask.listId) {
        // Different list - visual update handled by onMoveTask (optimistic)
        // But here we just need to find indices.
        // Actual state update is usually done in onDragEnd for commit,
        // or here for optimistic swap if using local state.
        // For simplicity in this implementation, we will rely on DndContext behavior
        // but typically you need to update state during drag over for cross-container sorting.
      }
    }

    // Task over List (Empty list)
    if (isActiveTask && isOverList) {
      const activeTask = active.data.current?.task as TaskWithDetails;
      const overList = over.data.current?.list as ListWithTasks;

      if (activeTask.listId !== overList.id) {
        // Dragging over an empty list
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      setActiveList(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handling List Reorder
    if (
      active.data.current?.type === "List" &&
      over.data.current?.type === "List"
    ) {
      if (activeId !== overId) {
        const oldIndex = lists.findIndex((l) => l.id === activeId);
        const newIndex = lists.findIndex((l) => l.id === overId);
        onReorderLists(arrayMove(lists, oldIndex, newIndex));
      }
    }

    // Handling Task Reorder/Move
    if (active.data.current?.type === "Task") {
      const activeTask = active.data.current.task as TaskWithDetails;
      const overData = over.data.current;

      if (overData?.type === "Task") {
        const overTask = overData.task as TaskWithDetails;

        // Same list reorder
        if (activeTask.listId === overTask.listId) {
          if (activeId !== overId) {
            const listIndex = lists.findIndex(
              (l) => l.id === activeTask.listId,
            );
            const list = lists[listIndex];
            const oldIndex = list.tasks.findIndex((t) => t.id === activeId);
            const newIndex = list.tasks.findIndex((t) => t.id === overId);

            const newTasks = arrayMove(list.tasks, oldIndex, newIndex);
            onReorderTasks(activeTask.listId, newTasks as TaskWithDetails[]);
          }
        } else {
          // Different list move (dropped on another task)
          const fromListId = activeTask.listId;
          const toListId = overTask.listId;
          // Calculate index: if dropping below, index+1, if above index.
          // But arrayMove handles indices. Here we are moving cross lists.
          // Dnd-kit sortable requires items to be in the same SortableContext for smooth animation.
          // For cross-list, we need `onMoveTask`.

          // NOTE: Real implementation needs more complex index calculation.
          // For MVP, simply appending or using over index.
          const list = lists.find((l) => l.id === toListId)!;
          const newIndex = list.tasks.findIndex((t) => t.id === overId);

          onMoveTask(activeId, fromListId, toListId, newIndex);
        }
      } else if (overData?.type === "List") {
        // Dropped on a list (likely empty or at end)
        const toListId = overData.list.id;
        if (activeTask.listId !== toListId) {
          onMoveTask(activeId, activeTask.listId, toListId, 0); // or end
        }
      }
    }

    setActiveTask(null);
    setActiveList(null);
    // Notify parent that drag ended
    onDragEndCallback?.();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask && (
            <div className="w-72">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
          {activeList && (
            <div className="h-full">
              <ListColumn
                list={activeList}
                onTaskClick={() => {}}
                onCreateTask={async () => {}}
              />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
