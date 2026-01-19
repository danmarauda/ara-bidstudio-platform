import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Icon,
  Loader,
  Popup,
  Header as SemanticHeader,
} from "semantic-ui-react";
import { useQuery, useLazyQuery } from "@apollo/client";
import {
  FileText,
  MessageSquare,
  Factory,
  Table,
  Users,
  Brain,
  Edit,
  Search,
  Home,
  ArrowLeft,
  BarChart3,
  Clock,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Zap,
  Activity,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Hash,
  Plus,
  Shield,
  Globe,
  Calendar,
  PenTool,
  X,
  MessageCircle,
  Menu,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  GET_CORPUS_WITH_HISTORY,
  GetCorpusWithHistoryQuery,
  GetCorpusWithHistoryQueryVariables,
} from "../../graphql/queries";
import { SafeMarkdown } from "../knowledge_base/markdown/SafeMarkdown";
import { CorpusType } from "../../types/graphql-api";
import { PermissionTypes } from "../types";
import { getPermissions } from "../../utils/transform";

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  height: 100%;
  max-height: 100%; /* Never exceed parent's height */
  min-height: 0;
`;

const TopBar = styled.div`
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.75rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: clamp(0.75rem, 2vh, 1rem) clamp(0.75rem, 3vw, 1rem);
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const BackButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;

  &:hover {
    background: white;
    border-color: #4a90e2;
    color: #4a90e2;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const CorpusInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CorpusTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const AccessBadge = styled.div<{ $isPublic?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(props) => (props.$isPublic ? "#dcfce7" : "#fef3c7")};
  color: ${(props) => (props.$isPublic ? "#15803d" : "#92400e")};
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const MetadataRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: #64748b;
  font-size: 0.8125rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.75rem;
    font-size: 0.75rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;

    svg {
      width: 14px;
      height: 14px;
      stroke-width: 2;
    }

    @media (max-width: 768px) {
      gap: 0.25rem;

      svg {
        width: 12px;
        height: 12px;
      }
    }
  }

  .separator {
    width: 1px;
    height: 16px;
    background: #e2e8f0;

    @media (max-width: 768px) {
      height: 12px;
    }
  }
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;

  .stats-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    > *:not(:last-child)::after {
      content: "";
      position: absolute;
      right: -0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 20px;
      background: #e2e8f0;
    }

    > * {
      position: relative;
    }

    @media (max-width: 1024px) {
      gap: 1.25rem;
    }

    @media (max-width: 768px) {
      flex: 1;
      justify-content: space-around;
      gap: 0.25rem;

      > *:not(:last-child)::after {
        display: none;
      }
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0;
    background: #f8fafc;
    margin: -0.25rem -0.75rem 0;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
`;

const StatItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(74, 144, 226, 0.08);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    flex: 1;
    min-width: 0;
    padding: 0.375rem;
  }
`;

const StatValue = styled.div`
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    font-size: 0.625rem;
    letter-spacing: 0.02em;
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0.25rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%; /* Never exceed parent's height */

  @media (max-width: 768px) {
    padding: clamp(0.5rem, 1.5vh, 0.75rem) clamp(0.5rem, 2vw, 0.75rem);
  }
`;

const StretchWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  min-height: 0;
  max-height: 100%; /* Never exceed parent's height */
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%; /* Never exceed parent's height */
  overflow: hidden;
`;

const DescriptionCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%; /* Never exceed parent's height */
`;

const DescriptionHeader = styled.div`
  padding: 1.75rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: clamp(0.75rem, 2vh, 1rem) clamp(0.75rem, 3vw, 1rem);
  }
`;

const DescriptionTitle = styled.h2`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  letter-spacing: -0.015em;

  svg {
    color: #4a90e2;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    gap: 0.375rem;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const HeaderHistoryButton = styled.button`
  background: transparent;
  color: #64748b;
  border: none;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    color: #4a90e2;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const HeaderEditButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #357abd;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DescriptionContent = styled.div`
  padding: 2rem;
  padding-bottom: 12vh;
  color: #334155;
  line-height: 1.75;
  font-size: 0.9375rem;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  min-height: 0;
  max-height: 100%;

  @media (max-width: 768px) {
    padding: clamp(0.75rem, 2.5vw, 1rem);
    padding-bottom: 15vh;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 4px;

    &:hover {
      background: #cbd5e1;
    }
  }

  &.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 2rem;
    color: #94a3b8;
    min-height: 200px;
    overflow-y: visible;

    @media (max-width: 768px) {
      padding: 2rem 1rem;
      min-height: 150px;
    }
  }

  /* Enhanced Markdown styling */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.75rem;
    margin-bottom: 0.875rem;
    color: #0f172a;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.4;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: 1.75rem;
  }
  h2 {
    font-size: 1.375rem;
  }
  h3 {
    font-size: 1.125rem;
  }

  p {
    margin-bottom: 1.125rem;
    color: #475569;
  }

  ul,
  ol {
    margin-bottom: 1.125rem;
    padding-left: 1.5rem;
    color: #475569;
  }

  li {
    margin-bottom: 0.375rem;
  }

  code {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.875em;
    font-family: "SF Mono", Monaco, monospace;
    color: #0f172a;
  }

  pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 1.125rem;
  }

  blockquote {
    border-left: 3px solid #4a90e2;
    padding-left: 1rem;
    margin: 1.25rem 0;
    color: #475569;
    font-style: italic;
  }

  a {
    color: #4a90e2;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #357abd;
      text-decoration: underline;
    }
  }

  hr {
    border: none;
    height: 1px;
    background: #e2e8f0;
    margin: 1.75rem 0;
  }
`;

const AddDescriptionButton = styled.button`
  background: white;
  color: #4a90e2;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #4a90e2;
    background: #f0f7ff;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
  }

  .title-skeleton {
    width: 200px;
    height: 24px;
    background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
  }

  .line-skeleton {
    height: 16px;
    background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;

    &.short {
      width: 60%;
    }
    &.medium {
      width: 80%;
    }
    &.long {
      width: 100%;
    }
  }

  .paragraph-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

interface CorpusHomeProps {
  corpus: CorpusType;
  onEditDescription: () => void;
  onNavigate?: (tabIndex: number) => void;
  onBack?: () => void;
  canUpdate?: boolean;
  stats: {
    totalDocs: number;
    totalAnnotations: number;
    totalAnalyses: number;
    totalExtracts: number;
  };
  statsLoading: boolean;
}

export const CorpusHome: React.FC<CorpusHomeProps> = ({
  corpus,
  onEditDescription,
  onNavigate,
  onBack,
  canUpdate,
  stats,
  statsLoading,
}) => {
  const [mdContent, setMdContent] = useState<string | null>(null);

  // CRITICAL: Memoize corpus ID to prevent infinite query loops
  // Parent passes new corpus object reference on every render (reactive var issue)
  // Apollo refetches queries when variables object changes, so we must stabilize it
  const corpusId = useMemo(() => corpus.id, [corpus.id]);

  // Stats are now passed as props from parent (Corpuses.tsx) to avoid duplicate queries
  // causing infinite Apollo cache ping-pong

  // CRITICAL: Memoize variables object to prevent Apollo refetch on every render
  // Even though corpusId is memoized, { id: corpusId } creates a NEW object every time
  const historyVariables = useMemo(() => ({ id: corpusId }), [corpusId]);

  // Fetch corpus with description history
  const { data: corpusData, loading: corpusLoading } = useQuery<
    GetCorpusWithHistoryQuery,
    GetCorpusWithHistoryQueryVariables
  >(GET_CORPUS_WITH_HISTORY, {
    variables: historyVariables,
  });

  // Fetch markdown content from URL
  useEffect(() => {
    if (corpusData?.corpus?.mdDescription) {
      fetch(corpusData.corpus.mdDescription)
        .then((res) => res.text())
        .then((text) => setMdContent(text))
        .catch((err) => {
          console.error("Error fetching corpus description:", err);
          setMdContent(null);
        });
    }
  }, [corpusData]);

  // Use the fetched corpus data instead of the prop
  const fullCorpus = corpusData?.corpus || corpus;

  const canEdit = getPermissions(fullCorpus.myPermissions || []).includes(
    PermissionTypes.CAN_UPDATE
  );

  const statItems = [
    { label: "Docs", value: stats.totalDocs, navIndex: 1 }, // documents tab
    { label: "Notes", value: stats.totalAnnotations, navIndex: 2 }, // annotations tab
    { label: "Analyses", value: stats.totalAnalyses, navIndex: 3 }, // analyses tab
    { label: "Extracts", value: stats.totalExtracts, navIndex: 4 }, // extracts tab
    ...(canUpdate
      ? [
          {
            label: "Settings",
            value: null,
            navIndex: 5,
            icon: <Settings size={20} />,
          },
        ]
      : []),
  ];

  // Show loading state while corpus data is being fetched
  if (corpusLoading && !corpusData) {
    return (
      <Container id="corpus-home-container">
        <TopBar id="corpus-home-top-bar">
          <CorpusInfo id="corpus-home-corpus-info">
            <LoadingPlaceholder>
              <div
                className="title-skeleton"
                style={{ width: "300px", height: "32px" }}
              ></div>
              <div
                className="line-skeleton medium"
                style={{ marginTop: "0.5rem" }}
              ></div>
            </LoadingPlaceholder>
          </CorpusInfo>
        </TopBar>
        <MainContent id="corpus-home-main-content">
          <StretchWrapper>
            <ContentWrapper id="corpus-home-content">
              <DescriptionCard>
                <DescriptionHeader>
                  <DescriptionTitle>
                    <BookOpen size={20} />
                    About this Corpus
                  </DescriptionTitle>
                </DescriptionHeader>
                <DescriptionContent>
                  <LoadingPlaceholder>
                    <div className="paragraph-skeleton">
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton medium"></div>
                    </div>
                  </LoadingPlaceholder>
                </DescriptionContent>
              </DescriptionCard>
            </ContentWrapper>
          </StretchWrapper>
        </MainContent>
      </Container>
    );
  }

  return (
    <Container id="corpus-home-container">
      <TopBar id="corpus-home-top-bar">
        <CorpusInfo id="corpus-home-corpus-info">
          <TitleRow>
            {onBack && (
              <BackButton onClick={onBack} title="Back to Corpuses">
                <ArrowLeft />
              </BackButton>
            )}
            <CorpusTitle>{fullCorpus.title || "Loading..."}</CorpusTitle>
            <AccessBadge $isPublic={fullCorpus.isPublic}>
              {fullCorpus.isPublic ? (
                <>
                  <Globe size={12} />
                  Public
                </>
              ) : (
                <>
                  <Shield size={12} />
                  Private
                </>
              )}
            </AccessBadge>
          </TitleRow>

          <MetadataRow>
            <div className="meta-item">
              <Users size={14} />
              <span>
                {fullCorpus.creator?.email?.split("@")[0] || "Unknown"}
              </span>
            </div>
            <div className="separator" />
            <div className="meta-item">
              <Calendar size={14} />
              <span>
                {fullCorpus.created
                  ? formatDistanceToNow(new Date(fullCorpus.created), {
                      addSuffix: true,
                    })
                  : "recently"}
              </span>
            </div>
            {fullCorpus.labelSet && (
              <>
                <div className="separator" />
                <div className="meta-item">
                  <Hash size={14} />
                  <span>{fullCorpus.labelSet.title}</span>
                </div>
              </>
            )}
          </MetadataRow>
        </CorpusInfo>

        <StatsRow>
          <div className="stats-group">
            {statItems.map((stat) => (
              <StatItem
                key={stat.label}
                onClick={() => onNavigate?.(stat.navIndex)}
                title={`View ${stat.label}`}
              >
                {stat.icon ? (
                  stat.icon
                ) : (
                  <StatValue>
                    {statsLoading ? "-" : (stat.value ?? 0).toLocaleString()}
                  </StatValue>
                )}
                <StatLabel>{stat.label}</StatLabel>
              </StatItem>
            ))}
          </div>
        </StatsRow>
      </TopBar>

      <MainContent id="corpus-home-main-content">
        <StretchWrapper>
          <ContentWrapper id="corpus-home-content">
            <DescriptionCard
              key="description-card"
              id="corpus-home-description-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ minHeight: 0 }}
            >
              <DescriptionHeader>
                <DescriptionTitle>
                  <BookOpen size={20} />
                  About this Corpus
                </DescriptionTitle>
                <ActionButtons>
                  {(mdContent || fullCorpus.description) && (
                    <HeaderHistoryButton onClick={onEditDescription}>
                      <Activity size={14} />
                      Version History
                    </HeaderHistoryButton>
                  )}
                  {canEdit && (
                    <HeaderEditButton onClick={onEditDescription}>
                      {mdContent || fullCorpus.description ? (
                        <>
                          <Edit size={14} />
                          Edit Description
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Add Description
                        </>
                      )}
                    </HeaderEditButton>
                  )}
                </ActionButtons>
              </DescriptionHeader>

              <DescriptionContent
                className={!mdContent && !fullCorpus.description ? "empty" : ""}
              >
                {corpusLoading ? (
                  <LoadingPlaceholder>
                    <div className="title-skeleton"></div>
                    <div className="paragraph-skeleton">
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton medium"></div>
                    </div>
                    <div className="paragraph-skeleton">
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton short"></div>
                    </div>
                    <div className="paragraph-skeleton">
                      <div className="line-skeleton medium"></div>
                      <div className="line-skeleton long"></div>
                      <div className="line-skeleton medium"></div>
                      <div className="line-skeleton short"></div>
                    </div>
                  </LoadingPlaceholder>
                ) : mdContent ? (
                  <SafeMarkdown>{mdContent}</SafeMarkdown>
                ) : fullCorpus.description ? (
                  <p>{fullCorpus.description}</p>
                ) : (
                  <>
                    <Sparkles
                      size={48}
                      style={{ marginBottom: "1rem", color: "#cbd5e1" }}
                    />
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: "#64748b",
                        marginBottom: "1.5rem",
                      }}
                    >
                      No description yet. Help others understand what this
                      corpus contains.
                    </p>
                    {canEdit && (
                      <AddDescriptionButton onClick={onEditDescription}>
                        <Plus size={18} />
                        Add Description
                      </AddDescriptionButton>
                    )}
                  </>
                )}
              </DescriptionContent>
            </DescriptionCard>
          </ContentWrapper>
        </StretchWrapper>
      </MainContent>
    </Container>
  );
};
