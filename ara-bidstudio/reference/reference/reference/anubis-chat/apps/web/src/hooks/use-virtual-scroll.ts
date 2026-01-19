'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  smoothScroll?: boolean;
}

interface VirtualScrollResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  scrollToIndex: (index: number, smooth?: boolean) => void;
  scrollToBottom: (smooth?: boolean) => void;
  handleScroll: (event: React.UIEvent<HTMLElement>) => void;
  offsetY: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    smoothScroll = true,
  } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Calculate total height for scrollbar
  const totalHeight = items.length * itemHeight;

  // Calculate offset for positioning visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const element = event.currentTarget;
    setScrollTop(element.scrollTop);
    scrollElementRef.current = element;
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, smooth = smoothScroll) => {
      if (!scrollElementRef.current) {
        return;
      }

      const targetScrollTop = Math.min(
        index * itemHeight,
        totalHeight - containerHeight
      );

      if (smooth) {
        scrollElementRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      } else {
        scrollElementRef.current.scrollTop = targetScrollTop;
      }

      setScrollTop(targetScrollTop);
    },
    [itemHeight, totalHeight, containerHeight, smoothScroll]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(
    (smooth = smoothScroll) => {
      if (items.length > 0) {
        scrollToIndex(items.length - 1, smooth);
      }
    },
    [items.length, scrollToIndex, smoothScroll]
  );

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    const isNearBottom =
      scrollTop + containerHeight >= totalHeight - itemHeight * 2;

    if (isNearBottom && items.length > 0) {
      scrollToBottom(true);
    }
  }, [
    items.length,
    scrollTop,
    containerHeight,
    totalHeight,
    itemHeight,
    scrollToBottom,
  ]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    scrollToIndex,
    scrollToBottom,
    handleScroll,
    offsetY,
  };
}
