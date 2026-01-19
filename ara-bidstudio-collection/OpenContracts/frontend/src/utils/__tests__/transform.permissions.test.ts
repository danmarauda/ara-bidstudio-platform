import { describe, it, expect } from "vitest";
import { getPermissions } from "../transform";
import { PermissionTypes } from "../../components/types";

describe("getPermissions() - Backend to Frontend Permission Transformation", () => {
  describe("Document Permissions", () => {
    it("should transform read_document to CAN_READ", () => {
      const result = getPermissions(["read_document"]);
      expect(result).toContain(PermissionTypes.CAN_READ);
    });

    it("should transform update_document to CAN_UPDATE", () => {
      const result = getPermissions(["update_document"]);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
    });

    it("should transform change_document to CAN_UPDATE", () => {
      const result = getPermissions(["change_document"]);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
    });

    it("should transform create_document to CAN_CREATE", () => {
      const result = getPermissions(["create_document"]);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
    });

    it("should transform add_document to CAN_CREATE", () => {
      const result = getPermissions(["add_document"]);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
    });

    it("should transform remove_document to CAN_REMOVE", () => {
      const result = getPermissions(["remove_document"]);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
    });

    it("should handle multiple document permissions", () => {
      const result = getPermissions([
        "read_document",
        "update_document",
        "create_document",
      ]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
      expect(result).toHaveLength(3);
    });
  });

  describe("Corpus Permissions", () => {
    it("should transform read_corpus to CAN_READ", () => {
      const result = getPermissions(["read_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_READ);
    });

    it("should transform update_corpus to CAN_UPDATE", () => {
      const result = getPermissions(["update_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
    });

    it("should transform change_corpus to CAN_UPDATE", () => {
      const result = getPermissions(["change_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
    });

    it("should transform create_corpus to CAN_CREATE", () => {
      const result = getPermissions(["create_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
    });

    it("should transform remove_corpus to CAN_REMOVE", () => {
      const result = getPermissions(["remove_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
    });

    it("should handle multiple corpus permissions", () => {
      const result = getPermissions([
        "read_corpus",
        "update_corpus",
        "remove_corpus",
      ]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
      expect(result).toHaveLength(3);
    });
  });

  describe("Annotation Permissions", () => {
    it("should transform read_annotation to CAN_READ", () => {
      const result = getPermissions(["read_annotation"]);
      expect(result).toContain(PermissionTypes.CAN_READ);
    });

    it("should transform update_annotation to CAN_UPDATE", () => {
      const result = getPermissions(["update_annotation"]);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
    });

    it("should transform create_annotation to CAN_CREATE", () => {
      const result = getPermissions(["create_annotation"]);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
    });

    it("should transform remove_annotation to CAN_REMOVE", () => {
      const result = getPermissions(["remove_annotation"]);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
    });
  });

  describe("Special Permissions", () => {
    it("should transform publish_ permissions to CAN_PUBLISH", () => {
      const result = getPermissions(["publish_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_PUBLISH);
    });

    it("should transform permission_ permissions to CAN_PERMISSION", () => {
      const result = getPermissions(["permission_corpus"]);
      expect(result).toContain(PermissionTypes.CAN_PERMISSION);
    });

    it("should transform comment_ permissions to CAN_COMMENT", () => {
      const result = getPermissions(["comment_document"]);
      expect(result).toContain(PermissionTypes.CAN_COMMENT);
    });

    it("should transform view_ permissions to CAN_READ", () => {
      const result = getPermissions(["view_document"]);
      expect(result).toContain(PermissionTypes.CAN_READ);
    });
  });

  describe("Superuser", () => {
    it("should grant all permissions for superuser", () => {
      const result = getPermissions(["superuser"]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
      expect(result).toContain(PermissionTypes.CAN_PUBLISH);
      expect(result).toContain(PermissionTypes.CAN_PERMISSION);
      expect(result).toContain(PermissionTypes.CAN_COMMENT);
      expect(result).toHaveLength(7);
    });

    it("should stop processing after superuser", () => {
      const result = getPermissions(["superuser", "read_document"]);
      // Should have all 7 permissions from superuser
      expect(result).toHaveLength(7);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined input", () => {
      const result = getPermissions(undefined);
      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = getPermissions([]);
      expect(result).toEqual([]);
    });

    it("should handle unknown permission strings", () => {
      const result = getPermissions(["unknown_permission"]);
      expect(result).toEqual([]);
    });

    it("should not duplicate permissions", () => {
      const result = getPermissions([
        "read_document",
        "read_corpus",
        "view_annotation",
      ]);
      // All three should map to CAN_READ, but should only appear once
      expect(result).toEqual([PermissionTypes.CAN_READ]);
    });

    it("should handle mixed valid and invalid permissions", () => {
      const result = getPermissions([
        "read_document",
        "invalid_permission",
        "update_corpus",
      ]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toHaveLength(2);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle typical read-only user permissions", () => {
      const result = getPermissions(["read_document", "read_corpus"]);
      expect(result).toEqual([PermissionTypes.CAN_READ]);
    });

    it("should handle typical editor permissions", () => {
      const result = getPermissions([
        "read_document",
        "update_document",
        "create_annotation",
        "update_annotation",
      ]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
      expect(result).toHaveLength(3);
    });

    it("should handle typical admin permissions", () => {
      const result = getPermissions([
        "read_corpus",
        "update_corpus",
        "create_corpus",
        "remove_corpus",
        "permission_corpus",
      ]);
      expect(result).toContain(PermissionTypes.CAN_READ);
      expect(result).toContain(PermissionTypes.CAN_UPDATE);
      expect(result).toContain(PermissionTypes.CAN_CREATE);
      expect(result).toContain(PermissionTypes.CAN_REMOVE);
      expect(result).toContain(PermissionTypes.CAN_PERMISSION);
      expect(result).toHaveLength(5);
    });
  });
});
