import styled from "styled-components";

import { Menu } from "semantic-ui-react";

export const PDFViewContainer = styled.div`
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start",
`;

export const PDFViewContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const StyledMenu = styled(Menu)`
  &.ui.menu {
    margin: 0;
    border-radius: 0;
  }
`;

export const PDFContainer = styled.div<{ width?: number }>(
  ({ width }) => `
    overflow-y: scroll;
    overflow-x: scroll;
    height: calc(100vh - 120px);
    background: #f7f9f9;
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    -webkit-overflow-scrolling: touch; /* Enable smooth scrolling on iOS */
    
    @media (max-width: 768px) {
      padding: 0.5rem;
      width: 100%;
      min-width: 100%;
      height: 100%; /* Use full height of parent container on mobile */
      overflow-x: auto;
      overflow-y: auto;
      /* Ensure content can be scrolled fully into view */
      scroll-padding: 1rem;
      /* Prevent any horizontal bounce/rubber-band effect */
      overscroll-behavior-x: none;
    }
  `
);
