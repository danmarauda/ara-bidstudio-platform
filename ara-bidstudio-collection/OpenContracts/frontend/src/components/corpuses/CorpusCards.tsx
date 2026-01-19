import { useState } from "react";
import { CorpusItem } from "./CorpusItem";
import styled from "styled-components";

import { useMutation, useReactiveVar } from "@apollo/client";
import {
  viewingCorpus,
  editingCorpus,
  openedCorpus,
  selectedCorpusIds,
  deletingCorpus,
  showAnalyzerSelectionForCorpus,
  exportingCorpus,
} from "../../graphql/cache";

import { useNavigate } from "react-router-dom";
import { navigateToCorpus } from "../../utils/navigationUtils";
import { LoadingOverlay } from "../common/LoadingOverlay";

import { PlaceholderCard } from "../placeholders/PlaceholderCard";
import { CorpusType, PageInfo } from "../../types/graphql-api";
import {
  StartForkCorpusInput,
  StartForkCorpusOutput,
  START_FORK_CORPUS,
} from "../../graphql/mutations";
import { toast } from "react-toastify";
import { FetchMoreOnVisible } from "../widgets/infinite_scroll/FetchMoreOnVisible";

const ResponsiveCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  width: 100%;
  min-height: 100%;
  padding: 24px;
  align-content: start;
  background: transparent;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  @media (min-width: 641px) and (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    padding: 20px;
    gap: 20px;
  }

  @media (min-width: 901px) and (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 22px;
  }

  @media (min-width: 1201px) and (max-width: 1600px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  @media (min-width: 1601px) {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 28px;
    max-width: 2200px;
    margin: 0 auto;
    padding: 32px;
  }
`;

interface CorpusCardsProps {
  fetchMore: (args?: any) => void | any;
  items: CorpusType[] | null;
  pageInfo: PageInfo | undefined;
  loading: boolean;
  loading_message: string;
  style?: Record<string, any>;
}

export const CorpusCards = ({
  fetchMore,
  loading,
  items,
  loading_message,
  pageInfo,
  style,
}: CorpusCardsProps) => {
  const navigate = useNavigate();

  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const selected_corpus_ids = useReactiveVar(selectedCorpusIds);

  const handleUpdate = () => {
    // console.log("Handle update");
    if (!loading && pageInfo?.hasNextPage) {
      console.log("Cursor should be: ", pageInfo.endCursor);
      fetchMore({
        variables: {
          limit: 20,
          cursor: pageInfo.endCursor,
        },
      });
    }
  };

  const [startForkCorpus, {}] = useMutation<
    StartForkCorpusOutput,
    StartForkCorpusInput
  >(START_FORK_CORPUS, {
    onCompleted: (data) => {
      toast.success(
        "SUCCESS! Fork started. Refresh the corpus page to view fork progress."
      );
    },
    onError: (err) => {
      toast.error("ERROR! Could not start corpus fork.");
    },
  });

  // Show the choose analyzer modal and allow user to start an analysis
  const chooseAnalyzerForCorpus = (corpusId: CorpusType) => {
    showAnalyzerSelectionForCorpus(corpusId);
  };

  const triggerCorpusFork = (corpusId: string) => {
    startForkCorpus({ variables: { corpusId } });
  };

  const toggleCorpusSelect = (id: string) => {
    if (selectedCorpusIds().includes(id)) {
      const values = [...selectedCorpusIds()];
      const index = values.indexOf(id);
      if (index > -1) {
        values.splice(index, 1);
      }
      selectedCorpusIds(values);
    } else {
      selectedCorpusIds([...selected_corpus_ids, id]);
    }
  };

  let cards: JSX.Element[] = [
    <PlaceholderCard
      key="PlaceholderCard"
      title="No Matching Corpuses"
      style={{
        minHeight: "240px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
      }}
    />,
  ];

  if (items && items.length > 0) {
    cards = items.map((item, index) => {
      return (
        <CorpusItem
          key={item.id}
          item={item}
          contextMenuOpen={contextMenuOpen}
          setContextMenuOpen={setContextMenuOpen}
          onOpen={() => {
            navigateToCorpus(item as any, navigate, window.location.pathname);
          }}
          onSelect={() => toggleCorpusSelect(item.id)}
          onDelete={() => deletingCorpus(item)}
          onFork={() => triggerCorpusFork(item.id)}
          onExport={() => exportingCorpus(item)}
          onEdit={() => editingCorpus(item)}
          onView={() => viewingCorpus(item)}
          onAnalyze={() => chooseAnalyzerForCorpus(item)}
        />
      );
    });
  }

  return (
    <div
      id="corpus-cards-container"
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)",
        width: "100%",
        minHeight: 0,
        ...style,
      }}
    >
      <LoadingOverlay
        active={loading}
        inverted
        size="large"
        content={loading_message}
      />
      <div
        className="CorpusCards"
        style={{
          width: "100%",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ResponsiveCardGrid>{cards}</ResponsiveCardGrid>
        <FetchMoreOnVisible fetchNextPage={handleUpdate} />
      </div>
    </div>
  );
};
