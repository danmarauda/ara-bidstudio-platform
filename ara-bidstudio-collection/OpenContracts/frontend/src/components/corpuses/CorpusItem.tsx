import React from "react";
import {
  Card,
  Dimmer,
  Loader,
  Statistic,
  Menu,
  Header,
  Label,
} from "semantic-ui-react";
import { Tags, FileText, HandshakeIcon, GitForkIcon } from "lucide-react";
import _ from "lodash";
import styled from "styled-components";

import default_corpus_icon from "../../assets/images/defaults/default_corpus.png";
import { getPermissions } from "../../utils/transform";
import { PermissionTypes } from "../types";
import { MyPermissionsIndicator } from "../widgets/permissions/MyPermissionsIndicator";
import { CorpusType, LabelType } from "../../types/graphql-api";

const StyledCard = styled(Card)<{ $isSelected?: boolean }>`
  &.ui.card {
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden;
    border-radius: 16px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid
      ${(props) => (props.$isSelected ? "#3b82f6" : "rgba(226, 232, 240, 0.8)")};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.04),
      ${(props) =>
        props.$isSelected
          ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
          : "0 0 0 0 transparent"};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    height: 100%;
    width: 100%;
    margin: 0 !important;
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 12px 24px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(99, 102, 241, 0.1);
      transform: translateY(-4px) scale(1.01);
      border-color: rgba(99, 102, 241, 0.3);
    }

    &:active {
      transform: translateY(-2px) scale(1.005);
    }

    .content {
      padding: 1.5em;
      background: transparent;
    }

    .header {
      font-size: 1.25em;
      font-weight: 700;
      margin-bottom: 0.4em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .meta {
      font-size: 0.875em;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    .description {
      margin-top: 0.875em;
      font-size: 0.9375em;
      line-height: 1.6;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
      color: #475569;
      min-height: 2.8em;
      max-height: 2.8em;
    }

    .extra {
      border-top: 1px solid rgba(226, 232, 240, 0.6);
      background: linear-gradient(
        to bottom,
        rgba(248, 250, 252, 0.5),
        rgba(241, 245, 249, 0.8)
      );
      backdrop-filter: blur(8px);
      padding: 1em 1.5em;
      margin-top: auto !important;
      min-height: 85px !important;
    }
  }
`;

const StyledLabel = styled(Label)`
  &.ui.label {
    margin: 0 !important;
    padding: 0.5em 0.8em;
    border-radius: 20px;
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    z-index: 1;
  }
`;

const StyledImageContainer = styled.div`
  flex: 0 0 auto;
  height: 180px;
  width: 100%;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(99, 102, 241, 0.08) 0%,
      transparent 60%
    );
    pointer-events: none;
  }
`;

const StyledImage = styled.img`
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06));
  transition: transform 0.3s ease;

  ${StyledCard}:hover & {
    transform: scale(1.05);
  }
`;

const StyledCardContent = styled(Card.Content)`
  &.content {
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    position: relative;
    min-height: 120px !important;
  }
`;

const StyledCardExtra = styled(Card.Content)`
  &.extra {
    flex: 0 0 auto !important;
    min-height: 80px !important;
    padding: 0.8em 1.2em;
    margin-top: auto !important;
  }
`;

const LabelsetBadge = styled.div<{ $hasLabelset: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${(props) =>
    props.$hasLabelset
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"};
  border-radius: 20px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  svg {
    width: 14px;
    height: 14px;
    animation: ${(props) =>
      props.$hasLabelset ? "none" : "pulse 2s ease-in-out infinite"};
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const LabelsetTooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 1.5rem;
  min-width: 280px;
  width: max-content;
  max-width: 360px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 12px 32px rgba(0, 0, 0, 0.12);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? "visible" : "hidden")};
  transform: ${(props) =>
    props.$visible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  pointer-events: ${(props) => (props.$visible ? "auto" : "none")};

  @media (max-width: 768px) {
    right: 12px;
    max-width: 280px;
    min-width: 240px;
  }

  &:before {
    content: "";
    position: absolute;
    top: -6px;
    right: 20px;
    width: 12px;
    height: 12px;
    background: inherit;
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    border-left: 1px solid rgba(226, 232, 240, 0.8);
    transform: rotate(45deg);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.05) 0%,
    rgba(139, 92, 246, 0.05) 100%
  );
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.08) 0%,
      rgba(139, 92, 246, 0.08) 100%
    );
    border-color: rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
    flex-shrink: 0;
    color: #6366f1;
  }

  span {
    white-space: nowrap;
    font-size: 0.8125rem;
    color: #475569;
    font-weight: 500;

    .count {
      font-weight: 700;
      color: #0f172a;
      margin-left: 0.25rem;
      font-size: 0.875rem;
    }
  }
`;

const HeaderImage = styled.img`
  width: 28px;
  height: 28px;
  margin-right: 10px;
  border-radius: 8px;
  object-fit: contain;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 4px;
  border: 1px solid rgba(226, 232, 240, 0.8);
`;

const TooltipHeader = styled.div`
  margin-bottom: 0.75rem;

  h3 {
    color: #0f172a !important;
    font-size: 1rem !important;
    font-weight: 700 !important;
    letter-spacing: -0.01em;
    margin-bottom: 0.25rem !important;
  }

  .header.content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sub.header {
    color: #64748b !important;
    font-size: 0.8125rem !important;
    font-weight: 500 !important;
    margin-top: 0.25rem !important;
    line-height: 1.4 !important;
  }
`;

interface CorpusItemProps {
  item: CorpusType;
  contextMenuOpen: string | null;
  onOpen: (args?: any) => any | void;
  onSelect: (args?: any) => any | void;
  onDelete: (args?: any) => any | void;
  onEdit: (args?: any) => any | void;
  onView: (args?: any) => any | void;
  onExport: (args?: any) => any | void;
  onFork: (args?: any) => any | void;
  onAnalyze: (args?: any) => any | void;
  setContextMenuOpen: (args?: any) => any | void;
}

export const CorpusItem: React.FC<CorpusItemProps> = ({
  item,
  contextMenuOpen,
  onOpen,
  onSelect,
  onDelete,
  onEdit,
  onView,
  onExport,
  onFork,
  onAnalyze,
  setContextMenuOpen,
}) => {
  const [contextPosition, setContextPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const cornerRef = React.useRef<HTMLDivElement>(null);

  const {
    id,
    title,
    is_selected,
    is_opened,
    description,
    icon,
    labelSet,
    documents,
    backendLock,
    isPublic,
    myPermissions,
  } = item;

  const createContextFromEvent = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setContextPosition({ x: e.clientX, y: e.clientY });
  };

  const cardClickHandler = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    value: any
  ) => {
    event.stopPropagation();
    if (event.shiftKey) {
      if (onSelect && _.isFunction(onSelect)) {
        onSelect(id);
      }
    } else {
      if (onOpen && _.isFunction(onOpen)) {
        onOpen(id);
      }
    }
  };

  const my_permissions = getPermissions(
    item.myPermissions ? item.myPermissions : []
  );

  let context_menus = [];

  if (my_permissions.includes(PermissionTypes.CAN_UPDATE)) {
    context_menus.push({
      key: "code",
      content: "Edit Details",
      icon: "edit outline",
      onClick: () => onEdit(),
    });
  }

  context_menus = [
    ...context_menus,
    {
      key: "view",
      content: "View Details",
      icon: "eye",
      onClick: () => onView(),
    },
    {
      key: "export",
      content: "Export Corpus",
      icon: "cloud download",
      onClick: () => onExport(),
    },
    {
      key: "fork",
      content: "Fork Corpus",
      icon: "fork",
      onClick: () => onFork(),
    },
  ];

  return (
    <>
      <StyledCard
        id={id}
        key={id}
        $isSelected={is_selected}
        onClick={backendLock ? () => {} : cardClickHandler}
        onContextMenu={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          createContextFromEvent(e);
          if (contextMenuOpen === id) {
            setContextMenuOpen(-1);
          } else {
            setContextMenuOpen(id);
          }
        }}
        onMouseEnter={() => {
          if (contextMenuOpen !== id) {
            setContextMenuOpen(-1);
          }
        }}
      >
        {backendLock ? (
          <Dimmer active>
            <Loader>Preparing...</Loader>
          </Dimmer>
        ) : null}
        <LabelsetBadge
          ref={cornerRef}
          $hasLabelset={Boolean(labelSet)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Tags size={14} />
          <span>{labelSet ? "Labeled" : "No Labels"}</span>
          <LabelsetTooltip $visible={showTooltip}>
            {labelSet ? (
              <>
                <TooltipHeader>
                  <Header as="h3" size="small">
                    {labelSet.icon ? (
                      <HeaderImage src={labelSet.icon} alt={labelSet.title} />
                    ) : (
                      <Tags
                        size={24}
                        style={{ marginRight: 8, color: "#6366f1" }}
                      />
                    )}
                    <Header.Content>
                      {labelSet.title}
                      <Header.Subheader>
                        {labelSet.description}
                      </Header.Subheader>
                    </Header.Content>
                  </Header>
                </TooltipHeader>
                <StatsGrid>
                  <StatItem>
                    <FileText />
                    <span>
                      Text Labels:{" "}
                      <span className="count">
                        {labelSet.tokenLabelCount || 0}
                      </span>
                    </span>
                  </StatItem>
                  <StatItem>
                    <FileText />
                    <span>
                      Doc Types:{" "}
                      <span className="count">
                        {labelSet.docLabelCount || 0}
                      </span>
                    </span>
                  </StatItem>
                  <StatItem>
                    <HandshakeIcon />
                    <span>
                      Relations:{" "}
                      <span className="count">
                        {labelSet.spanLabelCount || 0}
                      </span>
                    </span>
                  </StatItem>
                </StatsGrid>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  padding: "0.5rem",
                }}
              >
                <Tags
                  size={32}
                  style={{
                    color: "#ef4444",
                    margin: "0 auto 0.75rem",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    fontWeight: 700,
                    color: "#ef4444",
                    marginBottom: 8,
                    fontSize: "0.9375rem",
                  }}
                >
                  No Labelset Selected
                </p>
                <small
                  style={{
                    color: "#64748b",
                    fontSize: "0.8125rem",
                    lineHeight: 1.4,
                  }}
                >
                  Right click to edit and select a labelset
                </small>
              </div>
            )}
          </LabelsetTooltip>
        </LabelsetBadge>
        <StyledImageContainer>
          <StyledImage
            src={icon ? icon : default_corpus_icon}
            alt={title || "Corpus"}
          />
        </StyledImageContainer>
        <StyledCardContent>
          <Card.Header>{title}</Card.Header>
          <Card.Meta>{item.creator?.email || "Unknown"}</Card.Meta>
          <Card.Description>
            {description || "No description provided"}
          </Card.Description>
        </StyledCardContent>
        <StyledCardExtra>
          <Statistic.Group size="mini" widths={3}>
            <Statistic>
              <Statistic.Value>
                {documents?.edges?.length ? documents.edges.length : 0}
              </Statistic.Value>
              <Statistic.Label>Docs</Statistic.Label>
            </Statistic>
            <MyPermissionsIndicator
              myPermissions={myPermissions}
              isPublic={isPublic}
            />
            {item.parent ? (
              <Statistic color="green">
                <Statistic.Value>
                  <GitForkIcon size={16} />
                </Statistic.Value>
                <Statistic.Label>FORK</Statistic.Label>
                <div
                  style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}
                >
                  from {item.parent.title}
                </div>
              </Statistic>
            ) : null}
          </Statistic.Group>
        </StyledCardExtra>
      </StyledCard>

      {contextMenuOpen === id && contextPosition && (
        <Menu
          vertical
          style={{
            position: "fixed",
            left: contextPosition.x,
            top: contextPosition.y,
            zIndex: 9999,
          }}
        >
          {context_menus.map((menuItem) => (
            <Menu.Item
              key={menuItem.key}
              icon={menuItem.icon}
              content={menuItem.content}
              onClick={(e) => {
                e.stopPropagation();
                menuItem.onClick();
                setContextMenuOpen(-1);
              }}
            />
          ))}
        </Menu>
      )}
    </>
  );
};
