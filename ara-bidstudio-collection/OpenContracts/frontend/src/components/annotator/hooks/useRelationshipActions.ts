import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import {
  UPDATE_RELATIONSHIP,
  UpdateRelationshipInput,
  UpdateRelationshipOutput,
  REQUEST_CREATE_RELATIONSHIP,
  NewRelationshipInputType,
  NewRelationshipOutputType,
} from "../../../graphql/mutations";
import { usePdfAnnotations } from "./AnnotationHooks";
import { RelationGroup, PdfAnnotations } from "../types/annotations";

/**
 * Hook for managing relationship actions (create, update, add/remove annotations)
 * with proper permission handling and data refetching.
 */
export const useRelationshipActions = () => {
  const { pdfAnnotations, setPdfAnnotations } = usePdfAnnotations();

  const [updateRelationshipMutation, { loading: updateLoading }] = useMutation<
    UpdateRelationshipOutput,
    UpdateRelationshipInput
  >(UPDATE_RELATIONSHIP);

  const [addRelationshipMutation, { loading: createLoading }] = useMutation<
    NewRelationshipOutputType,
    NewRelationshipInputType
  >(REQUEST_CREATE_RELATIONSHIP);

  /**
   * Add annotations to an existing relationship
   * @param relationshipId - ID of the relationship to update
   * @param annotationIds - IDs of annotations to add
   * @param role - Whether to add as 'source' or 'target' annotations
   * @returns Promise<boolean> - true if successful
   */
  const addAnnotationsToRelationship = async (
    relationshipId: string,
    annotationIds: string[],
    role: "source" | "target"
  ): Promise<boolean> => {
    try {
      console.log("Adding annotations to relationship:", {
        relationshipId,
        annotationIds,
        role,
      });
      const result = await updateRelationshipMutation({
        variables: {
          relationshipId,
          ...(role === "source"
            ? { addSourceIds: annotationIds }
            : { addTargetIds: annotationIds }),
        },
      });

      console.log("Add annotations result:", result);
      if (
        result.data?.updateRelationship.ok &&
        result.data.updateRelationship.relationship
      ) {
        const updatedRel = result.data.updateRelationship.relationship;

        // Update jotai state with the updated relationship
        setPdfAnnotations((prev) => {
          const updatedRelations = prev.relations.map((rel) =>
            rel.id === updatedRel.id
              ? new RelationGroup(
                  updatedRel.sourceAnnotations.edges.map((e) => e.node.id),
                  updatedRel.targetAnnotations.edges.map((e) => e.node.id),
                  updatedRel.relationshipLabel,
                  updatedRel.id,
                  updatedRel.structural
                )
              : rel
          );
          return new PdfAnnotations(
            prev.annotations,
            updatedRelations,
            prev.docTypes,
            true
          );
        });

        toast.success(
          `Added ${annotationIds.length} annotation(s) as ${role} to relationship`
        );
        return true;
      } else {
        const errorMsg =
          result.data?.updateRelationship.message ||
          "Failed to update relationship";
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("Error adding annotations to relationship:", error);
      toast.error("Failed to update relationship - check permissions");
      return false;
    }
  };

  /**
   * Remove annotations from an existing relationship
   * @param relationshipId - ID of the relationship to update
   * @param annotationIds - IDs of annotations to remove
   * @param role - Whether to remove from 'source' or 'target' annotations
   * @returns Promise<boolean> - true if successful
   */
  const removeAnnotationsFromRelationship = async (
    relationshipId: string,
    annotationIds: string[],
    role: "source" | "target"
  ): Promise<boolean> => {
    try {
      const result = await updateRelationshipMutation({
        variables: {
          relationshipId,
          ...(role === "source"
            ? { removeSourceIds: annotationIds }
            : { removeTargetIds: annotationIds }),
        },
      });

      if (
        result.data?.updateRelationship.ok &&
        result.data.updateRelationship.relationship
      ) {
        const updatedRel = result.data.updateRelationship.relationship;

        // Update jotai state with the updated relationship
        setPdfAnnotations((prev) => {
          const updatedRelations = prev.relations.map((rel) =>
            rel.id === updatedRel.id
              ? new RelationGroup(
                  updatedRel.sourceAnnotations.edges.map((e) => e.node.id),
                  updatedRel.targetAnnotations.edges.map((e) => e.node.id),
                  updatedRel.relationshipLabel,
                  updatedRel.id,
                  updatedRel.structural
                )
              : rel
          );
          return new PdfAnnotations(
            prev.annotations,
            updatedRelations,
            prev.docTypes,
            true
          );
        });

        toast.success(
          `Removed ${annotationIds.length} annotation(s) from relationship`
        );
        return true;
      } else {
        const errorMsg =
          result.data?.updateRelationship.message ||
          "Failed to update relationship";
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("Error removing annotations from relationship:", error);
      toast.error("Failed to update relationship - check permissions");
      return false;
    }
  };

  /**
   * Create a new relationship with source and target annotations
   * @param sourceIds - IDs of source annotations
   * @param targetIds - IDs of target annotations
   * @param labelId - ID of the relationship label
   * @param corpusId - ID of the corpus
   * @param documentId - ID of the document
   * @returns Promise<boolean> - true if successful
   */
  const createRelationship = async (
    sourceIds: string[],
    targetIds: string[],
    labelId: string,
    corpusId: string,
    documentId: string
  ): Promise<boolean> => {
    try {
      const result = await addRelationshipMutation({
        variables: {
          sourceIds,
          targetIds,
          relationshipLabelId: labelId,
          corpusId,
          documentId,
        },
      });

      if (result.data?.addRelationship.ok) {
        const newRel = result.data.addRelationship.relationship;

        // Add the new relationship to jotai state
        setPdfAnnotations((prev) => {
          const newRelationGroup = new RelationGroup(
            newRel.sourceAnnotations.edges.map((e) => e.node.id),
            newRel.targetAnnotations.edges.map((e) => e.node.id),
            newRel.relationshipLabel,
            newRel.id,
            false // New relationships are not structural
          );
          return new PdfAnnotations(
            prev.annotations,
            [...prev.relations, newRelationGroup],
            prev.docTypes,
            true
          );
        });

        toast.success("Relationship created successfully");
        return true;
      } else {
        toast.error("Failed to create relationship");
        return false;
      }
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create relationship - check permissions");
      return false;
    }
  };

  return {
    addAnnotationsToRelationship,
    removeAnnotationsFromRelationship,
    createRelationship,
    isLoading: updateLoading || createLoading,
  };
};
