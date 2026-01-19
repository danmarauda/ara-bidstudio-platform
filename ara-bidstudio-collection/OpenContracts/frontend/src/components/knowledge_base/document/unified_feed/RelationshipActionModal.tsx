import React, { useState, useMemo } from "react";
import {
  Modal,
  Button,
  Form,
  Dropdown,
  Radio,
  Icon,
  Input,
} from "semantic-ui-react";
import styled from "styled-components";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { RelationGroup } from "../../../annotator/types/annotations";
import { useCorpusState } from "../../../annotator/context/CorpusAtom";
import { LabelType } from "../../../../types/graphql-api";
import {
  SMART_LABEL_SEARCH_OR_CREATE,
  SmartLabelSearchOrCreateInputs,
  SmartLabelSearchOrCreateOutputs,
} from "../../../../graphql/mutations";

interface RelationshipActionModalProps {
  open: boolean;
  onClose: () => void;
  selectedAnnotationIds: string[];
  existingRelationships: RelationGroup[];
  corpusId: string;
  documentId: string;
  annotations?: Array<{ id: string; rawText?: string }>;
  onAddToExisting: (
    relationshipId: string,
    role: "source" | "target"
  ) => Promise<void>;
  onCreate: (
    labelId: string,
    sourceIds: string[],
    targetIds: string[]
  ) => Promise<void>;
}

const ModalContent = styled(Modal.Content)`
  max-height: 60vh;
  overflow-y: auto;

  /* Pretty scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    &:hover {
      background: #94a3b8;
    }
  }
`;

const RelationshipOption = styled.div<{ $selected: boolean }>`
  padding: 1rem;
  margin: 0.5rem 0;
  border: 2px solid ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$selected ? "#eff6ff" : "white")};

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  .relationship-label {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .relationship-stats {
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    gap: 1rem;
  }
`;

const InfoBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f1f5f9;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;

  strong {
    color: #1e293b;
  }
`;

const ModeSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
`;

const AnnotationPill = styled.div<{
  $role: "source" | "target" | "unassigned";
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin: 0.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) =>
    props.$role === "source"
      ? "#dbeafe"
      : props.$role === "target"
      ? "#dcfce7"
      : "#f1f5f9"};
  border: 2px solid
    ${(props) =>
      props.$role === "source"
        ? "#3b82f6"
        : props.$role === "target"
        ? "#22c55e"
        : "#e5e7eb"};
  color: ${(props) =>
    props.$role === "source"
      ? "#1e40af"
      : props.$role === "target"
      ? "#166534"
      : "#64748b"};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const AssignmentSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;

  .section-title {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    min-height: 40px;
    padding: 0.5rem;
    background: #fafafa;
    border-radius: 4px;
  }
`;

export const RelationshipActionModal: React.FC<
  RelationshipActionModalProps
> = ({
  open,
  onClose,
  selectedAnnotationIds,
  existingRelationships,
  corpusId,
  documentId,
  annotations = [],
  onAddToExisting,
  onCreate,
}) => {
  const { relationLabels, selectedCorpus, setCorpus } = useCorpusState();

  // CRITICAL: Corpus is required for all relationship operations
  const hasCorpus = Boolean(corpusId && selectedCorpus?.id);

  // Helper to get annotation text preview
  const getAnnotationPreview = (annId: string): string => {
    const ann = annotations.find((a) => a.id === annId);
    if (!ann?.rawText)
      return `Annotation ${selectedAnnotationIds.indexOf(annId) + 1}`;
    const text = ann.rawText.trim();
    return text.length > 30 ? text.substring(0, 30) + "..." : text;
  };
  const [mode, setMode] = useState<"add" | "create">("add");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);
  const [role, setRole] = useState<"source" | "target">("source");
  const [newLabelId, setNewLabelId] = useState<string | null>(null);
  const [sourceAnnotationIds, setSourceAnnotationIds] = useState<string[]>([]);
  const [targetAnnotationIds, setTargetAnnotationIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labelSearchTerm, setLabelSearchTerm] = useState("");
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#10b981");
  const [newLabelDescription, setNewLabelDescription] = useState("");

  const [smartLabelSearchOrCreate] = useMutation<
    SmartLabelSearchOrCreateOutputs,
    SmartLabelSearchOrCreateInputs
  >(SMART_LABEL_SEARCH_OR_CREATE);

  // Filter relationship labels - ONLY from current corpus's labelset
  const filteredRelationshipLabels = useMemo(() => {
    // Without a corpus, we cannot look up labels
    if (!hasCorpus || !selectedCorpus?.labelSet) {
      return [];
    }

    const labels =
      relationLabels?.filter(
        (label) => label.labelType === LabelType.RelationshipLabel
      ) || [];

    if (!labelSearchTerm) return labels;

    return labels.filter((label) =>
      label.text?.toLowerCase().includes(labelSearchTerm.toLowerCase())
    );
  }, [relationLabels, labelSearchTerm, hasCorpus, selectedCorpus?.labelSet]);

  const hasLabelset = Boolean(selectedCorpus?.labelSet);

  // Handle creating a new relationship label
  const handleCreateLabel = async () => {
    // CRITICAL: Cannot create labels without a corpus
    if (!hasCorpus) {
      toast.error("Cannot create labels without a selected corpus");
      return;
    }

    if (!newLabelText.trim()) {
      toast.error("Please enter a label name");
      return;
    }

    try {
      const result = await smartLabelSearchOrCreate({
        variables: {
          corpusId: corpusId,
          searchTerm: newLabelText,
          labelType: LabelType.RelationshipLabel,
          color: newLabelColor,
          description: newLabelDescription,
          createIfNotFound: true,
        },
      });

      if (result.data?.smartLabelSearchOrCreate?.ok) {
        const { labels, labelsetCreated, labelCreated } =
          result.data.smartLabelSearchOrCreate;

        if (labels && labels.length > 0) {
          const newLabel = labels[0];

          // Update corpus state with new label
          if (labelCreated) {
            setCorpus({
              relationLabels: [...(relationLabels || []), newLabel],
            });
          }

          // Select the new label and clear search
          setNewLabelId(newLabel.id);
          setShowCreateLabel(false);
          setLabelSearchTerm("");
          setNewLabelText("");
          setNewLabelDescription("");

          if (labelsetCreated) {
            toast.success(`Created labelset and label "${newLabelText}"`);
          } else if (labelCreated) {
            toast.success(`Created label "${newLabelText}"`);
          } else {
            toast.info(`Selected existing label "${newLabelText}"`);
          }
        }
      } else {
        toast.error(
          result.data?.smartLabelSearchOrCreate?.message ||
            "Failed to create label"
        );
      }
    } catch (error) {
      console.error("Error creating relationship label:", error);
      toast.error("Failed to create label");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === "add" && selectedRelationshipId) {
        await onAddToExisting(selectedRelationshipId, role);
      } else if (mode === "create" && newLabelId) {
        await onCreate(newLabelId, sourceAnnotationIds, targetAnnotationIds);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (mode === "add") {
      return (
        selectedRelationshipId !== null && selectedAnnotationIds.length > 0
      );
    } else {
      return (
        newLabelId !== null &&
        (sourceAnnotationIds.length > 0 || targetAnnotationIds.length > 0)
      );
    }
  };

  // Filter out structural relationships (user shouldn't modify these manually)
  const editableRelationships = existingRelationships.filter(
    (rel) => !rel.structural
  );

  return (
    <Modal open={open} onClose={onClose} size="small">
      <Modal.Header>
        <Icon name="linkify" />
        Add Annotations to Relationship
      </Modal.Header>
      <ModalContent>
        {!hasCorpus && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            <Icon name="warning circle" />
            <strong>No Corpus Selected</strong>
            <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              You must select a corpus to create or manage relationships.
              Relationships require a corpus context and labelset.
            </p>
          </div>
        )}
        <Form>
          {/* Mode Selection */}
          <ModeSection>
            <Form.Field>
              <Radio
                label="Add to existing relationship"
                value="add"
                checked={mode === "add"}
                onChange={() => setMode("add")}
                disabled={!hasCorpus}
              />
            </Form.Field>

            {mode === "add" && (
              <>
                <Form.Field style={{ marginTop: "1rem" }}>
                  <label>Select Relationship</label>
                  {editableRelationships.length === 0 ? (
                    <p style={{ color: "#64748b", fontStyle: "italic" }}>
                      No editable relationships found. Create a new one instead.
                    </p>
                  ) : (
                    <div>
                      {editableRelationships.map((rel) => (
                        <RelationshipOption
                          key={rel.id}
                          $selected={selectedRelationshipId === rel.id}
                          onClick={() => setSelectedRelationshipId(rel.id)}
                        >
                          <div className="relationship-label">
                            {rel.label.icon && <Icon name={rel.label.icon} />}
                            {rel.label.text}
                          </div>
                          <div className="relationship-stats">
                            <span>
                              <Icon name="arrow right" /> Sources:{" "}
                              {rel.sourceIds.length}
                            </span>
                            <span>
                              <Icon name="bullseye" /> Targets:{" "}
                              {rel.targetIds.length}
                            </span>
                          </div>
                        </RelationshipOption>
                      ))}
                    </div>
                  )}
                </Form.Field>

                {selectedRelationshipId && (
                  <Form.Field>
                    <label>Add selected annotations as:</label>
                    <Form.Group inline>
                      <Form.Radio
                        label="Source annotations"
                        value="source"
                        checked={role === "source"}
                        onChange={() => setRole("source")}
                      />
                      <Form.Radio
                        label="Target annotations"
                        value="target"
                        checked={role === "target"}
                        onChange={() => setRole("target")}
                      />
                    </Form.Group>
                  </Form.Field>
                )}
              </>
            )}
          </ModeSection>

          <ModeSection>
            <Form.Field>
              <Radio
                label="Create new relationship"
                value="create"
                checked={mode === "create"}
                onChange={() => setMode("create")}
                disabled={!hasCorpus}
              />
            </Form.Field>

            {mode === "create" && (
              <>
                {!newLabelId ? (
                  <>
                    {!hasLabelset && (
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "0.75rem",
                          background: "#fef3c7",
                          border: "1px solid #fbbf24",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          color: "#92400e",
                        }}
                      >
                        <Icon name="info circle" />
                        <strong>No labelset found.</strong> Creating a label
                        will automatically create a labelset for this corpus.
                      </div>
                    )}

                    {!showCreateLabel ? (
                      <>
                        <Form.Field style={{ marginTop: "1rem" }}>
                          <label>Search or Create Relationship Label</label>
                          <Input
                            fluid
                            icon="search"
                            placeholder="Search for a relationship label..."
                            value={labelSearchTerm}
                            onChange={(e) => setLabelSearchTerm(e.target.value)}
                          />
                        </Form.Field>

                        {filteredRelationshipLabels.length > 0 ? (
                          <Form.Field>
                            <label>Select from existing labels:</label>
                            <Dropdown
                              placeholder="Select relationship label"
                              fluid
                              selection
                              options={filteredRelationshipLabels.map(
                                (label) => ({
                                  key: label.id,
                                  text: label.text,
                                  value: label.id,
                                  icon: label.icon || undefined,
                                })
                              )}
                              value={newLabelId || undefined}
                              onChange={(_, data) =>
                                setNewLabelId(data.value as string)
                              }
                            />
                          </Form.Field>
                        ) : (
                          <p
                            style={{
                              color: "#64748b",
                              fontStyle: "italic",
                              margin: "0.5rem 0",
                            }}
                          >
                            No matching labels found.
                          </p>
                        )}

                        {labelSearchTerm && (
                          <Button
                            icon
                            labelPosition="left"
                            color="green"
                            onClick={() => {
                              setNewLabelText(labelSearchTerm);
                              setShowCreateLabel(true);
                            }}
                            style={{ marginTop: "0.5rem" }}
                          >
                            <Icon name="plus" />
                            Create "{labelSearchTerm}" label
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Form.Field style={{ marginTop: "1rem" }}>
                          <label>Label Name</label>
                          <Input
                            fluid
                            placeholder="Enter label name"
                            value={newLabelText}
                            onChange={(e) => setNewLabelText(e.target.value)}
                          />
                        </Form.Field>

                        <Form.Field>
                          <label>Color</label>
                          <Input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                          />
                        </Form.Field>

                        <Form.Field>
                          <label>Description (optional)</label>
                          <Input
                            fluid
                            placeholder="Enter description"
                            value={newLabelDescription}
                            onChange={(e) =>
                              setNewLabelDescription(e.target.value)
                            }
                          />
                        </Form.Field>

                        <Button.Group fluid style={{ marginTop: "0.5rem" }}>
                          <Button
                            onClick={() => {
                              setShowCreateLabel(false);
                              setNewLabelText("");
                              setNewLabelDescription("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button.Or />
                          <Button positive onClick={handleCreateLabel}>
                            Create Label
                          </Button>
                        </Button.Group>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Form.Field style={{ marginTop: "1rem" }}>
                      <label>Selected Label</label>
                      <div
                        style={{
                          padding: "0.75rem",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {
                            relationLabels?.find((l) => l.id === newLabelId)
                              ?.text
                          }
                        </span>
                        <Button
                          size="tiny"
                          basic
                          onClick={() => {
                            setNewLabelId(null);
                            setLabelSearchTerm("");
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </Form.Field>

                    <AssignmentSection>
                      <div className="section-title">
                        <Icon name="arrow right" color="blue" />
                        Source Annotations
                      </div>
                      <div className="pills-container">
                        {selectedAnnotationIds.map((annId) => {
                          const isSource = sourceAnnotationIds.includes(annId);
                          const isTarget = targetAnnotationIds.includes(annId);
                          const role = isSource
                            ? "source"
                            : isTarget
                            ? "target"
                            : "unassigned";
                          return (
                            <AnnotationPill
                              key={annId}
                              $role={role}
                              onClick={() => {
                                if (isSource) {
                                  setSourceAnnotationIds((prev) =>
                                    prev.filter((id) => id !== annId)
                                  );
                                } else {
                                  setSourceAnnotationIds((prev) => [
                                    ...prev,
                                    annId,
                                  ]);
                                  setTargetAnnotationIds((prev) =>
                                    prev.filter((id) => id !== annId)
                                  );
                                }
                              }}
                            >
                              {role === "source" && <Icon name="check" />}
                              {getAnnotationPreview(annId)}
                            </AnnotationPill>
                          );
                        })}
                      </div>
                    </AssignmentSection>

                    <AssignmentSection>
                      <div className="section-title">
                        <Icon name="bullseye" color="green" />
                        Target Annotations
                      </div>
                      <div className="pills-container">
                        {selectedAnnotationIds.map((annId) => {
                          const isSource = sourceAnnotationIds.includes(annId);
                          const isTarget = targetAnnotationIds.includes(annId);
                          const role = isSource
                            ? "source"
                            : isTarget
                            ? "target"
                            : "unassigned";
                          return (
                            <AnnotationPill
                              key={annId}
                              $role={role}
                              onClick={() => {
                                if (isTarget) {
                                  setTargetAnnotationIds((prev) =>
                                    prev.filter((id) => id !== annId)
                                  );
                                } else {
                                  setTargetAnnotationIds((prev) => [
                                    ...prev,
                                    annId,
                                  ]);
                                  setSourceAnnotationIds((prev) =>
                                    prev.filter((id) => id !== annId)
                                  );
                                }
                              }}
                            >
                              {role === "target" && <Icon name="check" />}
                              {getAnnotationPreview(annId)}
                            </AnnotationPill>
                          );
                        })}
                      </div>
                    </AssignmentSection>

                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        marginTop: "1rem",
                        fontStyle: "italic",
                      }}
                    >
                      Click an annotation to assign it as source or target. You
                      can leave some unassigned and add them later.
                    </p>
                  </>
                )}
              </>
            )}
          </ModeSection>
        </Form>

        <InfoBox>
          <strong>
            <Icon name="info circle" />
            Selected: {selectedAnnotationIds.length} annotation
            {selectedAnnotationIds.length !== 1 ? "s" : ""}
          </strong>
        </InfoBox>
      </ModalContent>

      <Modal.Actions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          primary
          onClick={handleSubmit}
          disabled={!hasCorpus || !canSubmit() || isSubmitting}
          loading={isSubmitting}
        >
          {mode === "add" ? "Add to Relationship" : "Create Relationship"}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};
