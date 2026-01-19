import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { UnifiedContentFeedTestWrapper } from "./UnifiedContentFeedTestWrapper";
import { ServerTokenAnnotation } from "../src/components/annotator/types/annotations";
import { AnnotationLabelType, LabelType } from "../src/types/graphql-api";
import { PermissionTypes } from "../src/components/types";

/**
 * Tests for unified annotation and relationship filtering
 * Verifies that the atom-based filtering is consistent across all components
 */
test.describe("Unified Filtering System", () => {
  test("structural filter works correctly for annotations", async ({
    mount,
    page,
  }) => {
    // Create test data with both structural and non-structural items
    // Don't mix with relationships to avoid forced visibility issues
    const mockAnnotations = [
      new ServerTokenAnnotation(
        0, // page 0
        {
          id: "label-regular",
          text: "Regular",
          color: "#0000ff",
          description: "",
          icon: undefined,
          analyzer: null,
          labelType: LabelType.TokenLabel,
          __typename: "AnnotationLabelType",
        } as AnnotationLabelType,
        "Regular annotation content", // rawText
        false, // NOT structural
        {
          1: {
            bounds: { top: 100, bottom: 120, left: 50, right: 200 },
            tokensJsons: [],
            rawText: "Regular annotation content",
          },
        },
        [PermissionTypes.CAN_READ],
        false,
        false,
        false,
        "ann-1"
      ),
      new ServerTokenAnnotation(
        0, // page 0
        {
          id: "label-structural",
          text: "Structural",
          color: "#ff0000",
          description: "",
          icon: undefined,
          analyzer: null,
          labelType: LabelType.TokenLabel,
          __typename: "AnnotationLabelType",
        } as AnnotationLabelType,
        "Structural annotation content", // rawText
        true, // IS structural
        {
          1: {
            bounds: { top: 200, bottom: 220, left: 50, right: 200 },
            tokensJsons: [],
            rawText: "Structural annotation content",
          },
        },
        [PermissionTypes.CAN_READ],
        false,
        false,
        false,
        "ann-2"
      ),
    ];

    // Mount the test wrapper which initializes atoms with showStructural=false
    await mount(
      <UnifiedContentFeedTestWrapper
        notes={[]}
        mockAnnotations={mockAnnotations}
        mockRelations={[]} // No relationships to avoid forced visibility
        filters={{
          contentTypes: ["annotation"], // Just annotations
        }}
      />
    );

    // Wait for initial render and useEffect to run
    await page.waitForTimeout(100);

    // Regular annotation should be visible
    await expect(page.locator("text=Regular annotation content")).toBeVisible();

    // Structural annotation should NOT be visible
    const structuralLoc = page.locator("text=Structural annotation content");
    const count = await structuralLoc.count();
    expect(count).toBe(0);
  });

  test.skip("show selected only affects relationships connected to selected annotations", async () => {
    // Skip this test for now - it requires FloatingDocumentControls integration
    // which needs both components to share the same JotaiProvider
  });

  test.skip("structural toggle forces selected-only mode", async () => {
    // Skip this test for now - requires independent controls testing
  });
});

test.describe("Error Cases", () => {
  test("handles empty state gracefully", async ({ mount }) => {
    const component = await mount(
      <UnifiedContentFeedTestWrapper
        notes={[]}
        mockAnnotations={[]}
        mockRelations={[]}
        filters={{
          contentTypes: ["annotation", "relationship"],
        }}
      />
    );

    // Should show empty state
    await expect(component.locator("text=No content found")).toBeVisible();
  });
});
