/**
 * BoardPage Component
 * Ana Board sayfası
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoard } from "./hooks/useBoard";
import { useFlowControl } from "./hooks/useFlowControl";
import { BoardHeader } from "./BoardHeader";
import { SortableList } from "./SortableList";
import { CreateListButton } from "./CreateListButton";
import { TaskDrawer } from "./TaskDrawer";
import { BoardDndWrapper } from "./BoardDndWrapper";
import { ListSettingsModal } from "./ListSettingsModal";
import type { TaskWithDetails, ListWithTasks } from "@taskflow/shared";

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    project,
    lists,
    isLoading,
    error,
    userRole,
    setLists,
    createList,
    updateList,
    updateFlowControl,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderLists,
    reorderTasks,
  } = useBoard(projectId);

  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(
    null,
  );
  const [settingsList, setSettingsList] = useState<ListWithTasks | null>(null);
  const [blockedListIds, setBlockedListIds] = useState<string[]>([]);

  // Track currently dragged task for flow control
  const draggingTaskRef = useRef<TaskWithDetails | null>(null);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  // Flow control hook
  const flowControl = useFlowControl({
    lists,
    userRole,
  });

  // Handlers for DnD with error handling
  const handleReorderLists = useCallback(
    async (newLists: ListWithTasks[]) => {
      const previousLists = lists;
      try {
        // Optimistic update
        setLists(newLists);
        // API call
        await reorderLists(newLists.map((l) => l.id));
      } catch (err) {
        // Rollback on error
        setLists(previousLists);
        toast.error("Listeler yeniden sıralanamadı");
      }
    },
    [lists, setLists, reorderLists],
  );

  const handleReorderTasks = useCallback(
    async (listId: string, newTasks: TaskWithDetails[]) => {
      const previousLists = lists;
      try {
        // Optimistic update
        setLists((prev) =>
          prev.map((list) =>
            list.id === listId ? { ...list, tasks: newTasks } : list,
          ),
        );
        // API call
        await reorderTasks(
          listId,
          newTasks.map((t) => t.id),
        );
      } catch (err) {
        // Rollback on error
        setLists(previousLists);
        toast.error("Görevler yeniden sıralanamadı");
      }
    },
    [lists, setLists, reorderTasks],
  );

  const handleMoveTask = useCallback(
    async (
      taskId: string,
      fromListId: string,
      toListId: string,
      newIndex: number,
    ) => {
      const previousLists = lists;

      // Find the task being moved
      const fromList = lists.find((l) => l.id === fromListId);
      const task = fromList?.tasks.find((t) => t.id === taskId);

      if (!task) return;

      // Flow control check (client-side validation)
      if (fromListId !== toListId) {
        const blockedReason = flowControl.getMoveBlockedReason(task, toListId);
        if (blockedReason) {
          toast.error(blockedReason);
          return;
        }
      }

      try {
        // Optimistic update: Move task between lists
        setLists((prev) => {
          const fromList = prev.find((l) => l.id === fromListId);
          const toList = prev.find((l) => l.id === toListId);
          if (!fromList || !toList) return prev;

          const task = fromList.tasks.find((t) => t.id === taskId);
          if (!task) return prev;

          return prev.map((list) => {
            if (list.id === fromListId) {
              return {
                ...list,
                tasks: list.tasks.filter((t) => t.id !== taskId),
              };
            }
            if (list.id === toListId) {
              const newTasks = [...list.tasks];
              newTasks.splice(newIndex, 0, { ...task, listId: toListId });
              return { ...list, tasks: newTasks };
            }
            return list;
          });
        });
        // API call (server-side validation will also run)
        await moveTask(taskId, { listId: toListId, position: newIndex });
      } catch (err: unknown) {
        // Rollback on error
        setLists(previousLists);
        const errorMessage =
          err instanceof Error ? err.message : "Görev taşınamadı";
        toast.error(errorMessage);
      }
    },
    [lists, setLists, moveTask, flowControl],
  );

  // Update blocked lists when drag starts
  const handleDragStart = useCallback(
    (task: TaskWithDetails | null) => {
      draggingTaskRef.current = task;
      if (task) {
        const blocked = flowControl.getBlockedListIds(task);
        setBlockedListIds(blocked);
      } else {
        setBlockedListIds([]);
      }
    },
    [flowControl],
  );

  // Clear blocked lists when drag ends
  const handleDragEnd = useCallback(() => {
    draggingTaskRef.current = null;
    setBlockedListIds([]);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Hata Oluştu</h2>
          <p className="text-gray-500 mt-2">{error || "Proje bulunamadı"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <BoardHeader project={project} />

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <BoardDndWrapper
          lists={lists}
          onReorderLists={handleReorderLists}
          onReorderTasks={handleReorderTasks}
          onMoveTask={handleMoveTask}
          onDragStartCallback={handleDragStart}
          onDragEndCallback={handleDragEnd}
        >
          <div className="h-full p-4 inline-flex items-start gap-4">
            <SortableContext
              items={listIds}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <SortableList
                  key={list.id}
                  list={list}
                  onTaskClick={setSelectedTask}
                  onCreateTask={(listId, title) =>
                    createTask(listId, { title })
                  }
                  onSettingsClick={setSettingsList}
                  isBlocked={blockedListIds.includes(list.id)}
                />
              ))}
            </SortableContext>

            {/* Add List Button */}
            <CreateListButton onCreate={(name) => createList({ name })} />
          </div>
        </BoardDndWrapper>
      </div>

      {/* Task Details Drawer */}
      <TaskDrawer
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (taskId, data) => {
          await updateTask(taskId, data);
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask({ ...selectedTask, ...data } as TaskWithDetails);
          }
        }}
        onDelete={async (taskId) => {
          await deleteTask(taskId);
          setSelectedTask(null);
        }}
      />

      {/* List Settings Modal */}
      <ListSettingsModal
        list={settingsList}
        isOpen={!!settingsList}
        onClose={() => setSettingsList(null)}
        onUpdate={async (listId, data) => {
          await updateList(listId, data);
        }}
        onUpdateFlowControl={async (listId, data) => {
          await updateFlowControl(listId, data);
          toast.success("Flow control ayarları güncellendi");
        }}
        userRole={userRole}
        flowControlEnabled={project?.modules?.flow_control !== false}
      />
    </div>
  );
}
