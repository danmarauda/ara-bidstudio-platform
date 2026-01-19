import { SemanticWIDTHSNUMBER } from "semantic-ui-react";

export const determineCardColCount = (
  viewport_width: number
): SemanticWIDTHSNUMBER => {
  // More responsive breakpoints for better card sizing
  if (viewport_width < 480) return 1; // Mobile
  if (viewport_width < 768) return 2; // Tablet portrait
  if (viewport_width < 1024) return 3; // Tablet landscape
  if (viewport_width < 1280) return 4; // Small desktop
  if (viewport_width < 1600) return 5; // Medium desktop
  if (viewport_width < 1920) return 6; // Large desktop
  if (viewport_width < 2560) return 7; // Ultra-wide
  return 8; // 4K and beyond
};
