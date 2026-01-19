import { Icon, List, Message } from "semantic-ui-react";
import { SemanticCOLORS } from "semantic-ui-react/dist/commonjs/generic";
import { LoadingOverlay } from "../common/LoadingOverlay";

import {
  NOT_STARTED,
  UPLOADING,
  SUCCESS,
  FAILED,
  FileDetailsProps,
} from "../widgets/modals/DocumentUploadModal";

interface ContractListItemProps {
  document: FileDetailsProps;
  status: string;
  selected: boolean;
  onRemove: () => void;
  onSelect: () => void;
}

export const ContractListItem = ({
  document,
  status,
  selected,
  onRemove,
  onSelect,
}: ContractListItemProps) => {
  let icon_color = "gray";
  if (status === SUCCESS) {
    icon_color = "green";
  } else if (status === FAILED) {
    icon_color = "red";
  }

  return (
    <List.Item
      style={
        selected
          ? { backgroundColor: "#e2ffdb", position: "relative" }
          : { position: "relative" }
      }
      onClick={onSelect}
    >
      <LoadingOverlay
        active={status === UPLOADING}
        inverted
        content="Loading"
      />
      {status === NOT_STARTED ? (
        <div style={{ float: "right", cursor: "pointer" }}>
          <Icon name="trash" color="red" onClick={onRemove} />
        </div>
      ) : (
        <></>
      )}
      <List.Icon
        name="file alternate"
        size="large"
        color={icon_color as SemanticCOLORS}
        verticalAlign="middle"
      />
      <List.Content>
        <List.Header>
          {status === FAILED ? (
            <Message negative>
              <Message.Header>
                ERROR UPLOADING:{" "}
                {document?.title ? document.title : "No contracts"}{" "}
              </Message.Header>
            </Message>
          ) : (
            <p>{document?.title ? document.title : "No contracts"}</p>
          )}
        </List.Header>
      </List.Content>
    </List.Item>
  );
};
