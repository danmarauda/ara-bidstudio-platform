import { Card, Button, List, Header } from "semantic-ui-react";
import styled from "styled-components";
import analyzer_icon from "../../assets/icons/noun-epicyclic-gearing-800132.png";
import { AnalyzerType, CorpusType } from "../../types/graphql-api";
import { LoadingOverlay } from "../common/LoadingOverlay";

const MiniImage = styled.img`
  width: 35px;
  height: 35px;
  float: right;
  object-fit: contain;
`;

export interface AnalyzerSummaryCardInputs {
  analyzer: AnalyzerType;
  corpus?: CorpusType;
  selected?: boolean;
  onSelect?: () => any | never;
}

export const AnalyzerSummaryCard = ({
  analyzer,
  corpus,
  selected,
  onSelect,
}: AnalyzerSummaryCardInputs) => {
  const dependency_list = analyzer?.manifest?.metadata?.dependencies
    ? analyzer.manifest.metadata.dependencies
    : [];

  const already_used = corpus?.appliedAnalyzerIds
    ? corpus.appliedAnalyzerIds.includes(
        analyzer?.analyzerId ? analyzer.analyzerId : ""
      )
    : false;

  return (
    <Card
      onClick={() => (onSelect && !already_used ? onSelect() : {})}
      style={
        selected
          ? { backgroundColor: "#e2ffdb", position: "relative" }
          : { position: "relative" }
      }
    >
      {already_used && (
        <LoadingOverlay
          active={true}
          content={
            <div style={{ textAlign: "center" }}>
              <h4>Analyzer Already Used...</h4>
              <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Delete Analysis at the Corpus Level and Re-Rerun If Desired...
              </div>
            </div>
          }
        />
      )}
      <Card.Content>
        <MiniImage src={analyzer_icon} alt="Analyzer Icon" />
        <Card.Header>
          {analyzer.manifest?.metadata?.title
            ? analyzer.manifest.metadata.title
            : ""}
        </Card.Header>
        <Card.Meta>{analyzer.analyzerId}</Card.Meta>
        <Card.Description>{analyzer.description}</Card.Description>
      </Card.Content>
      <Card.Content>
        <List>
          <List.Item>
            <List.Icon name="users" />
            <List.Content>
              Creator: {analyzer?.manifest?.metadata?.author_name ?? "Unknown"}
            </List.Content>
          </List.Item>
          {analyzer?.manifest?.metadata?.author_email && (
            <List.Item>
              <List.Icon name="mail" />
              <List.Content>
                Email: {analyzer.manifest.metadata.author_email}
              </List.Content>
            </List.Item>
          )}
        </List>
      </Card.Content>
      {dependency_list ? (
        <Card.Content extra>
          <strong>Python Dependencies</strong>
          <List ordered>
            {dependency_list.map((dependency) => (
              <List.Item>{dependency}</List.Item>
            ))}
          </List>
        </Card.Content>
      ) : (
        <></>
      )}
    </Card>
  );
};
