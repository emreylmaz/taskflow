/**
 * useFlowControl Hook Tests
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFlowControl } from "../useFlowControl";
import type { ListWithTasks, TaskWithDetails } from "@taskflow/shared";

// Helper to create mock list
const createMockList = (
  overrides: Partial<ListWithTasks> = {},
): ListWithTasks => ({
  id: "list-1",
  name: "Test List",
  position: 0,
  color: null,
  isArchive: false,
  requiredRoleToEnter: [],
  requiredRoleToLeave: [],
  projectId: "project-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [],
  ...overrides,
});

// Helper to create mock task
const createMockTask = (
  overrides: Partial<TaskWithDetails> = {},
): TaskWithDetails => ({
  id: "task-1",
  title: "Test Task",
  description: null,
  priority: "MEDIUM",
  position: 0,
  dueDate: null,
  metadata: {},
  archivedAt: null,
  listId: "list-1",
  projectId: "project-1",
  assigneeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  assignee: null,
  labels: [],
  list: { id: "list-1", name: "Test List" },
  ...overrides,
});

describe("useFlowControl", () => {
  describe("canMoveToList", () => {
    it("should allow move when no restrictions", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({ id: "list-2" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveToList(task, "list-2")).toBe(true);
    });

    it("should allow move to same list (reorder)", () => {
      const lists = [
        createMockList({
          id: "list-1",
          requiredRoleToLeave: ["OWNER"],
          requiredRoleToEnter: ["OWNER"],
        }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveToList(task, "list-1")).toBe(true);
    });

    it("should deny move when user lacks leave permission", () => {
      const lists = [
        createMockList({ id: "list-1", requiredRoleToLeave: ["OWNER"] }),
        createMockList({ id: "list-2" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveToList(task, "list-2")).toBe(false);
    });

    it("should deny move when user lacks enter permission", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({
          id: "list-2",
          requiredRoleToEnter: ["ADMIN", "OWNER"],
        }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveToList(task, "list-2")).toBe(false);
    });

    it("should allow ADMIN when ADMIN is in the list", () => {
      const lists = [
        createMockList({
          id: "list-1",
          requiredRoleToLeave: ["ADMIN", "OWNER"],
        }),
        createMockList({
          id: "list-2",
          requiredRoleToEnter: ["ADMIN", "OWNER"],
        }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "ADMIN" }),
      );

      expect(result.current.canMoveToList(task, "list-2")).toBe(true);
    });
  });

  describe("canMoveFromList", () => {
    it("should return true when no leave restrictions", () => {
      const lists = [createMockList({ id: "list-1" })];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveFromList(task)).toBe(true);
    });

    it("should return false when user lacks leave permission", () => {
      const lists = [
        createMockList({ id: "list-1", requiredRoleToLeave: ["OWNER"] }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.canMoveFromList(task)).toBe(false);
    });
  });

  describe("getBlockedListIds", () => {
    it("should return empty array when no restrictions", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({ id: "list-2" }),
        createMockList({ id: "list-3" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.getBlockedListIds(task)).toEqual([]);
    });

    it("should return all other lists when user cannot leave source", () => {
      const lists = [
        createMockList({ id: "list-1", requiredRoleToLeave: ["OWNER"] }),
        createMockList({ id: "list-2" }),
        createMockList({ id: "list-3" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.getBlockedListIds(task)).toEqual([
        "list-2",
        "list-3",
      ]);
    });

    it("should return only restricted target lists when user can leave", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({ id: "list-2", requiredRoleToEnter: ["ADMIN"] }),
        createMockList({ id: "list-3" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.getBlockedListIds(task)).toEqual(["list-2"]);
    });
  });

  describe("hasFlowRestrictions", () => {
    it("should return false when no restrictions", () => {
      const lists = [createMockList({ id: "list-1" })];

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.hasFlowRestrictions("list-1")).toBe(false);
    });

    it("should return true when enter restrictions exist", () => {
      const lists = [
        createMockList({ id: "list-1", requiredRoleToEnter: ["ADMIN"] }),
      ];

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.hasFlowRestrictions("list-1")).toBe(true);
    });

    it("should return true when leave restrictions exist", () => {
      const lists = [
        createMockList({ id: "list-1", requiredRoleToLeave: ["OWNER"] }),
      ];

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.hasFlowRestrictions("list-1")).toBe(true);
    });
  });

  describe("getMoveBlockedReason", () => {
    it("should return null when move is allowed", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({ id: "list-2" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      expect(result.current.getMoveBlockedReason(task, "list-2")).toBeNull();
    });

    it("should return leave reason when user cannot leave", () => {
      const lists = [
        createMockList({
          id: "list-1",
          name: "Done",
          requiredRoleToLeave: ["OWNER"],
        }),
        createMockList({ id: "list-2" }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      const reason = result.current.getMoveBlockedReason(task, "list-2");
      expect(reason).toContain("Done");
      expect(reason).toContain("listesinden");
    });

    it("should return enter reason when user cannot enter", () => {
      const lists = [
        createMockList({ id: "list-1" }),
        createMockList({
          id: "list-2",
          name: "Review",
          requiredRoleToEnter: ["ADMIN"],
        }),
      ];
      const task = createMockTask({ listId: "list-1" });

      const { result } = renderHook(() =>
        useFlowControl({ lists, userRole: "MEMBER" }),
      );

      const reason = result.current.getMoveBlockedReason(task, "list-2");
      expect(reason).toContain("Review");
      expect(reason).toContain("listesine");
    });
  });
});
