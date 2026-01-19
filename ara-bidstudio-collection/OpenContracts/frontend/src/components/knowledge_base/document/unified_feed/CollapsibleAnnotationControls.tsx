import React, { useState, useRef, useEffect, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import { AnnotationControls } from "../../../annotator/controls/AnnotationControls";
import {
  useAnnotationDisplay,
  useAnnotationControls,
} from "../../../annotator/context/UISettingsAtom";

interface CollapsibleAnnotationControlsProps {
  /** Whether to show label filters in the controls */
  showLabelFilters?: boolean;
  /** Trigger mode - click or hover */
  triggerMode?: "click" | "hover";
}

const ControlsToggleButton = styled(motion.button)<{
  $hasActiveFilters?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: ${(props) => (props.$hasActiveFilters ? "#eff6ff" : "white")};
  border: 1px solid
    ${(props) => (props.$hasActiveFilters ? "#3b82f6" : "#e2e8f0")};
  border-radius: 8px;
  color: ${(props) => (props.$hasActiveFilters ? "#3b82f6" : "#64748b")};
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$hasActiveFilters ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
    color: ${(props) => (props.$hasActiveFilters ? "#3b82f6" : "inherit")};
  }

  &:hover {
    background: ${(props) => (props.$hasActiveFilters ? "#dbeafe" : "#f8fafc")};
    border-color: ${(props) =>
      props.$hasActiveFilters ? "#2563eb" : "#cbd5e1"};
    color: ${(props) => (props.$hasActiveFilters ? "#2563eb" : "#3b82f6")};

    svg {
      color: ${(props) => (props.$hasActiveFilters ? "#2563eb" : "#3b82f6")};
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

const PopupContainer = styled(motion.div)`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  z-index: 100;
  overflow: hidden;
`;

const PopupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const PopupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;

  svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
  }
`;

const CloseButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const PopupContent = styled.div`
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;

const Wrapper = styled.div`
  position: relative;
`;

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const ActiveIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const CollapsibleAnnotationControls: React.FC<
  CollapsibleAnnotationControlsProps
> = ({ showLabelFilters = false, triggerMode = "click" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current filter states
  const { showStructural, showSelectedOnly, showBoundingBoxes } =
    useAnnotationDisplay();
  const { spanLabelsToView } = useAnnotationControls();

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Count active display filters
    if (showStructural) count++;
    if (showSelectedOnly) count++;
    if (!showBoundingBoxes) count++; // Count as active when turned OFF (not default)

    // Count label filters
    if (spanLabelsToView && spanLabelsToView.length > 0) {
      count += spanLabelsToView.length;
    }

    return count;
  }, [showStructural, showSelectedOnly, showBoundingBoxes, spanLabelsToView]);

  const hasActiveFilters = activeFilterCount > 0;

  // Handle hover mode
  const handleMouseEnter = () => {
    if (triggerMode === "hover") {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Small delay to prevent accidental triggers
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    if (triggerMode === "hover") {
      // Clear any pending open
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Delay closing to allow moving to popup
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Close popup when clicking outside (only in click mode)
  useEffect(() => {
    if (triggerMode !== "click") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, triggerMode]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <Wrapper
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ControlsToggleButton
        $hasActiveFilters={hasActiveFilters}
        onClick={() => {
          if (triggerMode === "click") {
            setIsOpen(!isOpen);
          }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: triggerMode === "click" ? 0.98 : 1 }}
        data-testid="annotation-controls-toggle"
        style={{
          cursor: triggerMode === "click" ? "pointer" : "default",
          position: "relative",
        }}
      >
        <Filter />
        Annotation Filters
        {hasActiveFilters && <FilterBadge>{activeFilterCount}</FilterBadge>}
        {hasActiveFilters && <ActiveIndicator />}
      </ControlsToggleButton>

      <AnimatePresence>
        {isOpen && (
          <PopupContainer
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={() => {
              if (triggerMode === "hover" && hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
            onMouseLeave={() => {
              if (triggerMode === "hover") {
                handleMouseLeave();
              }
            }}
          >
            <PopupHeader>
              <PopupTitle>
                <Filter />
                Annotation Filters
                {hasActiveFilters && (
                  <FilterBadge>{activeFilterCount}</FilterBadge>
                )}
              </PopupTitle>
              {triggerMode === "click" && (
                <CloseButton
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X />
                </CloseButton>
              )}
            </PopupHeader>
            <PopupContent>
              <AnnotationControls
                variant="sidebar"
                showLabelFilters={showLabelFilters}
              />
            </PopupContent>
          </PopupContainer>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};
