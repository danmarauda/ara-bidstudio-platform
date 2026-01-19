import { Card } from "semantic-ui-react";
import styled from "styled-components";
import { AnalysisType } from "../../../types/graphql-api";

const MiniImage = styled.img`
  width: 35px;
  height: 35px;
  float: right;
  object-fit: contain;
`;

export const SelectedAnalysisCard = () => {
  return (
    <Card
      style={{
        margin: "auto",
        width: "75%",
        height: "6vh",
      }}
    >
      <Card.Content>
        <MiniImage
          src="https://react.semantic-ui.com/images/avatar/large/steve.jpg"
          alt="Profile"
        />
        <Card.Header>Steve Sanders</Card.Header>
        <Card.Meta>Friends of Elliot</Card.Meta>
      </Card.Content>
    </Card>
  );
};
