/**
 * Flow Control Validation Tests
 */

import { describe, it, expect } from "vitest";
import { validateFlowControl } from "../task.service.js";
import type { Role } from "@taskflow/shared";

describe("Flow Control Validation", () => {
  describe("validateFlowControl", () => {
    it("should allow move when no restrictions are set", async () => {
      const sourceList = { requiredRoleToLeave: [] };
      const targetList = { requiredRoleToEnter: [] };

      const result = await validateFlowControl(
        sourceList,
        targetList,
        "MEMBER",
      );
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow OWNER to move when OWNER is required to leave", async () => {
      const sourceList = { requiredRoleToLeave: ["OWNER"] };
      const targetList = { requiredRoleToEnter: [] };

      const result = await validateFlowControl(sourceList, targetList, "OWNER");
      expect(result.allowed).toBe(true);
    });

    it("should deny MEMBER from leaving when OWNER is required", async () => {
      const sourceList = { requiredRoleToLeave: ["OWNER"] };
      const targetList = { requiredRoleToEnter: [] };

      const result = await validateFlowControl(
        sourceList,
        targetList,
        "MEMBER",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("listeden");
    });

    it("should deny MEMBER from entering when ADMIN is required", async () => {
      const sourceList = { requiredRoleToLeave: [] };
      const targetList = { requiredRoleToEnter: ["ADMIN", "OWNER"] };

      const result = await validateFlowControl(
        sourceList,
        targetList,
        "MEMBER",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("listeye");
    });

    it("should allow ADMIN to enter when ADMIN or OWNER is required", async () => {
      const sourceList = { requiredRoleToLeave: [] };
      const targetList = { requiredRoleToEnter: ["ADMIN", "OWNER"] };

      const result = await validateFlowControl(sourceList, targetList, "ADMIN");
      expect(result.allowed).toBe(true);
    });

    it("should check both leave and enter restrictions", async () => {
      const sourceList = { requiredRoleToLeave: ["ADMIN", "OWNER"] };
      const targetList = { requiredRoleToEnter: ["ADMIN", "OWNER"] };

      // MEMBER can't leave
      let result = await validateFlowControl(sourceList, targetList, "MEMBER");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("listeden");

      // ADMIN can do both
      result = await validateFlowControl(sourceList, targetList, "ADMIN");
      expect(result.allowed).toBe(true);

      // OWNER can do both
      result = await validateFlowControl(sourceList, targetList, "OWNER");
      expect(result.allowed).toBe(true);
    });

    it("should allow all roles when restriction includes all roles", async () => {
      const sourceList = { requiredRoleToLeave: ["OWNER", "ADMIN", "MEMBER"] };
      const targetList = { requiredRoleToEnter: ["OWNER", "ADMIN", "MEMBER"] };

      const roles: Role[] = ["OWNER", "ADMIN", "MEMBER"];
      for (const role of roles) {
        const result = await validateFlowControl(sourceList, targetList, role);
        expect(result.allowed).toBe(true);
      }
    });
  });
});
