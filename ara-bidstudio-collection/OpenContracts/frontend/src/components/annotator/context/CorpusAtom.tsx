import { atom, useAtom } from "jotai";
import { useMemo, useCallback } from "react";
import { CorpusType, AnnotationLabelType } from "../../../types/graphql-api";
import { PermissionTypes } from "../../types";

/**
 * Represents the entire corpus state stored in a single atom.
 */
export interface CorpusState {
  selectedCorpus: CorpusType | null | undefined;
  myPermissions: PermissionTypes[];
  spanLabels: AnnotationLabelType[];
  humanSpanLabels: AnnotationLabelType[];
  relationLabels: AnnotationLabelType[];
  docTypeLabels: AnnotationLabelType[];
  humanTokenLabels: AnnotationLabelType[];
  allowComments: boolean;
  isLoading: boolean;
}

export const corpusStateAtom = atom<CorpusState>({
  selectedCorpus: null,
  myPermissions: [],
  spanLabels: [],
  humanSpanLabels: [],
  relationLabels: [],
  docTypeLabels: [],
  humanTokenLabels: [],
  allowComments: true,
  isLoading: false,
});

/**
 * A hook that returns the entire corpus state, plus methods to perform
 * batch updates and derived permission checks.
 */
export function useCorpusState() {
  const [corpusState, setCorpusState] = useAtom(corpusStateAtom);

  /**
   * Batch-update the corpus state to avoid multiple, separate set calls.
   *
   * CRITICAL: Only update if values have actually changed to prevent infinite re-renders
   *
   * @param partial partial object to merge into the CorpusState
   */
  const setCorpus = useCallback(
    (partial: Partial<CorpusState>) => {
      setCorpusState((prev) => {
        // Build merged state, reusing previous object references when IDs match
        const mergedPartial: Partial<CorpusState> = {};
        let hasChanges = false;

        for (const key in partial) {
          const typedKey = key as keyof CorpusState;
          const prevVal = prev[typedKey];
          const newVal = partial[typedKey];

          // Special handling for selectedCorpus - compare by ID, REUSE prev object if same
          if (key === "selectedCorpus") {
            const prevId = (prevVal as any)?.id;
            const newId = (newVal as any)?.id;
            if (prevId === newId) {
              (mergedPartial as any)[typedKey] = prevVal; // REUSE previous object
              continue; // Not a change
            } else {
              (mergedPartial as any)[typedKey] = newVal;
              hasChanges = true;
              continue;
            }
          }

          // Deep equality check for arrays (like myPermissions)
          if (Array.isArray(prevVal) && Array.isArray(newVal)) {
            const prevArray = prevVal as any[];
            const newArray = newVal as any[];
            const arraysEqual =
              prevArray.length === newArray.length &&
              prevArray.every((val: any, idx: number) => val === newArray[idx]);
            if (!arraysEqual) {
              (mergedPartial as any)[typedKey] = newVal;
              hasChanges = true;
            } else {
              (mergedPartial as any)[typedKey] = prevVal; // REUSE previous array
            }
          } else if (prevVal !== newVal) {
            (mergedPartial as any)[typedKey] = newVal;
            hasChanges = true;
          } else {
            (mergedPartial as any)[typedKey] = prevVal; // REUSE previous value
          }
        }

        if (!hasChanges) {
          return prev; // Return same reference to prevent re-render
        }

        return { ...prev, ...mergedPartial };
      });
    },
    [setCorpusState]
  );

  /**
   * Helper to check for a given permission type in the corpus permissions.
   *
   * @param permission a specific PermissionTypes value to be checked
   * @returns boolean indicating if the user has the specified permission
   */
  const hasCorpusPermission = useCallback(
    (permission: PermissionTypes): boolean => {
      return corpusState.myPermissions?.includes(permission) || false;
    },
    [corpusState.myPermissions]
  );

  // Compute permission checks as derived state
  const canUpdateCorpus = hasCorpusPermission(PermissionTypes.CAN_UPDATE);
  const canDeleteCorpus = hasCorpusPermission(PermissionTypes.CAN_REMOVE);
  const canManageCorpus = hasCorpusPermission(PermissionTypes.CAN_PERMISSION);

  // Memoize for performance, so consumers don't re-render unnecessarily
  // CRITICAL: Depend on individual values from corpusState, NOT the corpusState object itself
  // to avoid re-creating the return object when corpusState reference changes but values don't
  return useMemo(
    () => ({
      // State
      ...corpusState,

      // Batch set
      setCorpus,

      // Derived permission checks
      canUpdateCorpus,
      canDeleteCorpus,
      canManageCorpus,
      hasCorpusPermission,
    }),
    [
      // Depend on individual values, not the whole corpusState object
      corpusState.selectedCorpus,
      corpusState.myPermissions,
      corpusState.spanLabels,
      corpusState.humanSpanLabels,
      corpusState.relationLabels,
      corpusState.docTypeLabels,
      corpusState.humanTokenLabels,
      corpusState.allowComments,
      corpusState.isLoading,
      setCorpus,
      canUpdateCorpus,
      canDeleteCorpus,
      canManageCorpus,
      hasCorpusPermission,
    ]
  );
}
