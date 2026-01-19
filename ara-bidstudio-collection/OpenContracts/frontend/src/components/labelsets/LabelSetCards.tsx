import { useState } from "react";
import { Card } from "semantic-ui-react";
import { useReactiveVar } from "@apollo/client";
import _ from "lodash";

import AnnotationLabelItem from "./AnnotationLabelItem";
import { LoadingOverlay } from "../common/LoadingOverlay";
import { PlaceholderCard } from "../placeholders/PlaceholderCard";
import {
  deletingLabelset,
  openedLabelset,
  selectedLabelsetIds,
} from "../../graphql/cache";
import { LabelSetType, PageInfo } from "../../types/graphql-api";
import { FetchMoreOnVisible } from "../widgets/infinite_scroll/FetchMoreOnVisible";
import useWindowDimensions from "../hooks/WindowDimensionHook";
import { determineCardColCount } from "../../utils/layout";

interface LabelsetCardProps {
  style?: Record<string, any>;
  pageInfo: PageInfo | undefined | null;
  items: LabelSetType[];
  loading: boolean;
  loading_message: string;
  fetchMore: (args?: any) => void | any;
}

export const LabelsetCards = ({
  style,
  items,
  pageInfo,
  loading,
  loading_message,
  fetchMore,
}: LabelsetCardProps) => {
  // Let's figure out the viewport so we can size the cards appropriately.
  const { width } = useWindowDimensions();
  const card_cols = determineCardColCount(width);

  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);

  const selected_labelset_ids = useReactiveVar(selectedLabelsetIds);
  const opened_labelset = useReactiveVar(openedLabelset);

  const toggleLabelsetSelect = (id: string) => {
    if (selected_labelset_ids.includes(id)) {
      const values = [...selected_labelset_ids];
      const index = values.indexOf(id);
      if (index > -1) {
        values.splice(index, 1);
      }
      selectedLabelsetIds(values);
    } else {
      selectedLabelsetIds([...selected_labelset_ids, id]);
    }
  };

  const handleUpdate = () => {
    if (!loading && pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          limit: 20,
          cursor: pageInfo.endCursor,
        },
      });
    }
  };

  let cards: JSX.Element[] = [
    <PlaceholderCard
      key={0}
      title="No Matching Labelsets..."
      style={{
        height: "40vh",
      }}
    />,
  ];

  if (items && items.length > 0) {
    cards = items.map((item) => (
      <AnnotationLabelItem
        key={item.id}
        item={item}
        selected={_.includes(selected_labelset_ids, item.id)}
        opened={opened_labelset?.id === item.id}
        onOpen={() => openedLabelset(item)}
        onSelect={() => toggleLabelsetSelect(item.id)}
        onDelete={() => deletingLabelset(item)}
        contextMenuOpen={contextMenuOpen}
        setContextMenuOpen={setContextMenuOpen}
      />
    ));
  }

  let comp_style = {
    width: "100%",
    minHeight: "50vh",
    padding: "1rem",
  };
  if (style) {
    comp_style = { ...comp_style, ...style };
  }

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <LoadingOverlay active={loading} content={loading_message} />
      <Card.Group stackable itemsPerRow={card_cols} style={comp_style}>
        {cards}
      </Card.Group>
      <FetchMoreOnVisible fetchNextPage={handleUpdate} />
    </div>
  );
};
