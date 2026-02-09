/**
 * useFlowControl Hook
 * Manages flow control permissions and provides helpers for DnD
 */

import { useMemo, useCallback } from "react";
import type { ListWithTasks, Role } from "@taskflow/shared";

// Minimal task interface for flow control (just needs listId)
interface TaskLike {
  listId: string;
}

interface UseFlowControlProps {
  lists: ListWithTasks[];
  userRole: Role;
}

interface FlowControlResult {
  /** Check if user can move a task to a specific list */
  canMoveToList: (task: TaskLike, targetListId: string) => boolean;
  /** Check if user can move a task from its current list */
  canMoveFromList: (task: TaskLike) => boolean;
  /** Get list IDs that are blocked for a given task */
  getBlockedListIds: (task: TaskLike) => string[];
  /** Check if a specific list has flow control restrictions */
  hasFlowRestrictions: (listId: string) => boolean;
  /** Get reason why move is not allowed (for toast messages) */
  getMoveBlockedReason: (task: TaskLike, targetListId: string) => string | null;
}

export function useFlowControl({
  lists,
  userRole,
}: UseFlowControlProps): FlowControlResult {
  // Create a map of lists by ID for quick lookup
  const listMap = useMemo(() => {
    const map = new Map<string, ListWithTasks>();
    lists.forEach((list) => map.set(list.id, list));
    return map;
  }, [lists]);

  // Check if user can leave a list
  const canLeaveList = useCallback(
    (list: ListWithTasks): boolean => {
      // No restrictions - anyone can leave
      if (list.requiredRoleToLeave.length === 0) return true;
      // Check if user's role is in the allowed list
      return list.requiredRoleToLeave.includes(userRole);
    },
    [userRole],
  );

  // Check if user can enter a list
  const canEnterList = useCallback(
    (list: ListWithTasks): boolean => {
      // No restrictions - anyone can enter
      if (list.requiredRoleToEnter.length === 0) return true;
      // Check if user's role is in the allowed list
      return list.requiredRoleToEnter.includes(userRole);
    },
    [userRole],
  );

  const canMoveFromList = useCallback(
    (task: TaskLike): boolean => {
      const sourceList = listMap.get(task.listId);
      if (!sourceList) return false;
      return canLeaveList(sourceList);
    },
    [listMap, canLeaveList],
  );

  const canMoveToList = useCallback(
    (task: TaskLike, targetListId: string): boolean => {
      // Same list - always allowed (reorder)
      if (task.listId === targetListId) return true;

      const sourceList = listMap.get(task.listId);
      const targetList = listMap.get(targetListId);

      if (!sourceList || !targetList) return false;

      // Check both leave and enter permissions
      return canLeaveList(sourceList) && canEnterList(targetList);
    },
    [listMap, canLeaveList, canEnterList],
  );

  const getBlockedListIds = useCallback(
    (task: TaskLike): string[] => {
      const blocked: string[] = [];

      // First check if we can even leave the source list
      const sourceList = listMap.get(task.listId);
      if (!sourceList || !canLeaveList(sourceList)) {
        // Can't leave - all other lists are blocked
        return lists.filter((l) => l.id !== task.listId).map((l) => l.id);
      }

      // Check each potential target
      lists.forEach((list) => {
        if (list.id !== task.listId && !canEnterList(list)) {
          blocked.push(list.id);
        }
      });

      return blocked;
    },
    [lists, listMap, canLeaveList, canEnterList],
  );

  const hasFlowRestrictions = useCallback(
    (listId: string): boolean => {
      const list = listMap.get(listId);
      if (!list) return false;
      return (
        list.requiredRoleToEnter.length > 0 ||
        list.requiredRoleToLeave.length > 0
      );
    },
    [listMap],
  );

  const getMoveBlockedReason = useCallback(
    (task: TaskLike, targetListId: string): string | null => {
      if (task.listId === targetListId) return null;

      const sourceList = listMap.get(task.listId);
      const targetList = listMap.get(targetListId);

      if (!sourceList || !targetList) return null;

      if (!canLeaveList(sourceList)) {
        return `"${sourceList.name}" listesinden görev taşıma yetkiniz yok`;
      }

      if (!canEnterList(targetList)) {
        return `"${targetList.name}" listesine görev taşıma yetkiniz yok`;
      }

      return null;
    },
    [listMap, canLeaveList, canEnterList],
  );

  return {
    canMoveToList,
    canMoveFromList,
    getBlockedListIds,
    hasFlowRestrictions,
    getMoveBlockedReason,
  };
}
