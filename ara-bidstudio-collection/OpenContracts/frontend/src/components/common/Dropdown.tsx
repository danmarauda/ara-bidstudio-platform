import React, { useState, useRef, useEffect, ReactNode } from "react";
import styled from "styled-components";

/* ============================================================================
 * Styled Components
 * ========================================================================== */

const DropdownContainer = styled.div<{ $isMenuItem?: boolean }>`
  position: relative;
  display: inline-block;
  ${(props) =>
    props.$isMenuItem &&
    `
    display: flex;
    align-items: center;
  `}
`;

const DropdownTrigger = styled.div<{ $simple?: boolean; $isDark?: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: ${(props) => (props.$simple ? "0" : "0.5rem 1rem")};
  user-select: none;
  white-space: nowrap;
  color: inherit;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${(props) => (props.$isDark ? "1" : "0.85")};
  }

  &:active {
    opacity: 0.7;
  }
`;

const DropdownMenuContainer = styled.div<{
  $isOpen: boolean;
  $isDark?: boolean;
  $align?: "left" | "right";
}>`
  position: absolute;
  top: 100%;
  ${(props) => (props.$align === "right" ? "right: 0;" : "left: 0;")}
  background: ${(props) => (props.$isDark ? "#1b1c1d" : "white")};
  border: none;
  border-radius: ${(props) => (props.$isDark ? "0 0 8px 8px" : "8px")};
  box-shadow: ${(props) =>
    props.$isDark
      ? "0 8px 16px rgba(0, 0, 0, 0.6)"
      : "0 4px 12px rgba(0, 0, 0, 0.15)"};
  margin-top: ${(props) => (props.$isDark ? "0" : "0.5rem")};
  min-width: ${(props) => (props.$isDark ? "160px" : "180px")};
  z-index: 1000;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
  overflow: hidden;
`;

const DropdownItemStyled = styled.div<{
  $disabled?: boolean;
  $isDark?: boolean;
}>`
  padding: ${(props) => (props.$isDark ? "0.875rem 1rem" : "0.75rem 1.25rem")};
  cursor: ${(props) => (props.$disabled ? "default" : "pointer")};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(props) =>
    props.$isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.87)"};
  transition: all 0.2s ease;
  white-space: nowrap;
  opacity: ${(props) => (props.$disabled ? 0.45 : 1)};
  background: transparent;
  font-size: ${(props) => (props.$isDark ? "0.9375rem" : "0.875rem")};
  font-weight: ${(props) => (props.$isDark ? "500" : "400")};
  letter-spacing: ${(props) => (props.$isDark ? "0.01em" : "normal")};

  span,
  a {
    color: ${(props) =>
      props.$isDark ? "rgba(255, 255, 255, 0.9)" : "inherit"};
    text-decoration: none;
    transition: color 0.2s ease;
  }

  &:hover {
    background: ${(props) => {
      if (props.$disabled) return "transparent";
      return props.$isDark
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.05)";
    }};
    color: ${(props) => (props.$isDark ? "rgba(255, 255, 255, 1)" : "inherit")};
    transform: ${(props) =>
      props.$isDark ? "translateX(4px)" : "translateX(0)"};

    span,
    a {
      color: ${(props) =>
        props.$isDark ? "rgba(255, 255, 255, 1)" : "inherit"};
    }
  }

  &:not(:last-child) {
    border-bottom: ${(props) =>
      props.$isDark
        ? "1px solid rgba(255, 255, 255, 0.06)"
        : "1px solid rgba(34, 36, 38, 0.1)"};
  }

  &:first-child {
    padding-top: ${(props) => (props.$isDark ? "1rem" : "0.75rem")};
  }

  &:last-child {
    padding-bottom: ${(props) => (props.$isDark ? "1rem" : "0.75rem")};
  }

  .icon {
    display: flex;
    align-items: center;
    font-size: 1rem;
  }

  /* Support for className-based dark theme (legacy) */
  &.uninvert_me {
    background: transparent !important;
    color: rgba(255, 255, 255, 0.9) !important;

    span {
      color: rgba(255, 255, 255, 0.9) !important;
    }

    a {
      color: rgba(255, 255, 255, 0.9) !important;
      text-decoration: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      color: rgba(255, 255, 255, 1) !important;
      transform: translateX(4px);

      span {
        color: rgba(255, 255, 255, 1) !important;
      }

      a {
        color: rgba(255, 255, 255, 1) !important;
      }
    }

    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    }
  }
`;

/* ============================================================================
 * Component Types
 * ========================================================================== */

interface DropdownProps {
  text?: string;
  icon?: ReactNode;
  children: ReactNode;
  item?: boolean;
  simple?: boolean;
  style?: React.CSSProperties;
  header?: string;
  className?: string;
  id?: string;
  dark?: boolean;
  trigger?: ReactNode;
  align?: "left" | "right";
}

interface DropdownItemProps {
  text?: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  id?: string;
  className?: string;
  name?: string;
  active?: boolean;
  dark?: boolean;
}

interface DropdownMenuProps {
  children: ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  align?: "left" | "right";
}

/* ============================================================================
 * Dropdown Component
 * ========================================================================== */

export const Dropdown: React.FC<DropdownProps> & {
  Menu: React.FC<DropdownMenuProps>;
  Item: React.FC<DropdownItemProps>;
} = ({
  text,
  icon,
  children,
  item,
  simple,
  style,
  className,
  id,
  dark,
  trigger,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when any item is clicked
  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <DropdownContainer
      ref={dropdownRef}
      $isMenuItem={item}
      style={style}
      className={className}
      id={id}
    >
      {trigger ? (
        <div onClick={handleToggle} style={{ cursor: "pointer" }}>
          {trigger}
        </div>
      ) : (
        <DropdownTrigger onClick={handleToggle} $simple={simple} $isDark={dark}>
          {text}
          {icon}
        </DropdownTrigger>
      )}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownMenu) {
          return React.cloneElement(
            child as React.ReactElement<
              DropdownMenuProps & { isOpen?: boolean }
            >,
            {
              isOpen,
              onItemClick: handleItemClick,
              dark,
              align,
            } as any
          );
        }
        return child;
      })}
    </DropdownContainer>
  );
};

/* ============================================================================
 * Dropdown.Menu Component
 * ========================================================================== */

const DropdownMenu: React.FC<
  DropdownMenuProps & { isOpen?: boolean; onItemClick?: () => void }
> = ({
  children,
  isOpen = false,
  onItemClick,
  style,
  dark,
  align = "left",
}) => {
  return (
    <DropdownMenuContainer
      $isOpen={isOpen}
      $isDark={dark}
      $align={align}
      style={style}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownItem) {
          return React.cloneElement(
            child as React.ReactElement<
              DropdownItemProps & { onItemClick?: () => void }
            >,
            { onItemClick, dark } as any
          );
        }
        return child;
      })}
    </DropdownMenuContainer>
  );
};

/* ============================================================================
 * Dropdown.Item Component
 * ========================================================================== */

const DropdownItem: React.FC<
  DropdownItemProps & { onItemClick?: () => void }
> = ({
  text,
  onClick,
  icon,
  disabled,
  children,
  onItemClick,
  id,
  className,
  name,
  active,
  dark,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!disabled) {
      // If there's an onClick handler, call it
      if (onClick) {
        onClick();
      }
      // Always close the dropdown after clicking an item
      onItemClick?.();
    }
  };

  return (
    <DropdownItemStyled
      id={id}
      className={className}
      onClick={handleClick}
      $disabled={disabled}
      $isDark={dark}
      data-name={name}
      data-active={active}
    >
      {icon && <span className="icon">{icon}</span>}
      {children ? children : <span>{text}</span>}
    </DropdownItemStyled>
  );
};

// Attach sub-components
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;

export default Dropdown;
