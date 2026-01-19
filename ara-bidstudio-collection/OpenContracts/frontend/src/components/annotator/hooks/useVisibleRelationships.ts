import { useMemo } from "react";
import { usePdfAnnotations } from "./AnnotationHooks";
import { useAnnotationDisplay } from "../context/UISettingsAtom";
import { useAnnotationSelection } from "../context/UISettingsAtom";
import { useVisibleAnnotations } from "./useVisibleAnnotations";
import { RelationGroup } from "../types/annotations";

/**
 * Returns the set of relationships that should be visible given the current
 * view/filter settings.
 *
 * This hook ensures relationships follow the same filtering logic as annotations:
 * - Respects showStructural setting
 * - Respects showSelectedOnly setting
 * - Only shows relationships where at least one connected annotation is visible
 * - Forces visibility of selected relationships
 */
export function useVisibleRelationships(): RelationGroup[] {
  // Get all relationships from the PDF annotations
  const { pdfAnnotations } = usePdfAnnotations();
  const allRelationships = pdfAnnotations?.relations ?? [];

  // Get display settings (same ones used for annotations)
  const { showStructural, showSelectedOnly } = useAnnotationDisplay();

  // Get selection state
  const { selectedAnnotations, selectedRelations } = useAnnotationSelection();

  // Get visible annotations to check connectivity
  const visibleAnnotations = useVisibleAnnotations();
  const visibleAnnotationIds = useMemo(
    () => new Set(visibleAnnotations.map((a) => a.id)),
    [visibleAnnotations]
  );

  // Filter relationships based on unified criteria
  return useMemo(() => {
    // Create set of selected relationship IDs for forced visibility
    const selectedRelationIds = new Set(selectedRelations.map((r) => r.id));

    return allRelationships.filter((relationship) => {
      // 1. Always show selected relationships (forced visibility)
      if (selectedRelationIds.has(relationship.id)) {
        return true;
      }

      // 2. Filter structural relationships based on showStructural setting
      if (relationship.structural && !showStructural) {
        return false;
      }

      // 3. In "show selected only" mode, only show relationships connected to selected annotations
      if (showSelectedOnly) {
        const connectedToSelection =
          relationship.sourceIds.some((id) =>
            selectedAnnotations.includes(id)
          ) ||
          relationship.targetIds.some((id) => selectedAnnotations.includes(id));

        if (!connectedToSelection) {
          return false;
        }
      }

      // 4. Only show relationships where at least one connected annotation is visible
      // This ensures we don't show "orphaned" relationships
      const hasVisibleAnnotation =
        relationship.sourceIds.some((id) => visibleAnnotationIds.has(id)) ||
        relationship.targetIds.some((id) => visibleAnnotationIds.has(id));

      if (!hasVisibleAnnotation) {
        return false;
      }

      return true;
    });
  }, [
    allRelationships,
    showStructural,
    showSelectedOnly,
    selectedAnnotations,
    selectedRelations,
    visibleAnnotationIds,
  ]);
}
