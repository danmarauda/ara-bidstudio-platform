import React from "react";
import { useReactiveVar } from "@apollo/client";
import { Checkbox, Menu, Label } from "semantic-ui-react";
import { showCorpusActionOutputs } from "../../../graphql/cache";
import useWindowDimensions from "../../hooks/WindowDimensionHook";
import { MOBILE_VIEW_BREAKPOINT } from "../../../assets/configurations/constants";

export const FilterToCorpusActionOutputs: React.FC = () => {
  const { width } = useWindowDimensions();
  const use_mobile_layout = width <= MOBILE_VIEW_BREAKPOINT;

  const show_corpus_action_analyses = useReactiveVar(showCorpusActionOutputs);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem",
        background:
          "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
        borderRadius: "10px",
        border: "1px solid rgba(102, 126, 234, 0.15)",
        width: "100%",
      }}
    >
      <Label
        style={{
          margin: "0",
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          fontWeight: "600",
          fontSize: "0.75rem",
          padding: "0.375rem 0.625rem",
          borderRadius: "8px",
          border: "none",
          letterSpacing: "0.025em",
          textTransform: "uppercase",
          boxShadow: "0 2px 4px rgba(79, 172, 254, 0.2)",
          flexShrink: 0,
        }}
      >
        Corpus Actions
      </Label>
      <Checkbox
        toggle
        checked={show_corpus_action_analyses}
        onChange={() => showCorpusActionOutputs(!show_corpus_action_analyses)}
        style={{
          marginLeft: "auto",
        }}
      />
    </div>
  );
};
