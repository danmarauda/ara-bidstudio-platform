# Virtualized PDF Rendering System

## Overview

The PDF annotation system implements a sophisticated virtualization approach to handle large documents efficiently. Instead of rendering all pages at once, only visible pages (plus a small buffer) are rendered, dramatically improving performance and memory usage.

## Architecture

### Core Concept

The virtualization system works by:
1. Calculating heights of all pages at the current zoom level
2. Determining which pages are visible in the viewport
3. Only rendering those pages (plus overscan)
4. Ensuring selected items' pages are always rendered

### Component Structure

```
PDF.tsx (Virtualization Engine)
├── Manages visible page range
├── Handles scroll events
├── Calculates page positions
└── Renders PDFPage components conditionally
    └── PDFPage.tsx (Individual Page)
        ├── Renders PDF canvas when visible
        ├── Displays annotations for the page
        └── Manages its own lifecycle
```

## Implementation Details

### Page Height Calculation

When the PDF loads or zoom changes:

```typescript
// In PDF.tsx
useEffect(() => {
  if (!pdfDoc) return;
  (async () => {
    const h: number[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      h.push(page.getViewport({ scale: zoomLevel }).height + 32);
    }
    setPageHeights(h); // Cache heights at this zoom level
  })();
}, [pdfDoc, zoomLevel]);
```

### Cumulative Heights

For efficient position calculations:

```typescript
const cumulative = useMemo(() => {
  const out: number[] = [0];
  for (let i = 0; i < pageHeights.length; i++) {
    out.push(out[i] + pageHeights[i]);
  }
  return out; // cumulative[i] = top position of page i
}, [pageHeights]);
```

### Visible Range Detection

The system uses binary search for efficiency:

```typescript
const calcRange = useCallback(() => {
  const el = getScrollElement();
  const scroll = /* current scroll position */;
  const viewH = /* viewport height */;

  // Binary search for first visible page
  let lo = 0, hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cumulative[mid + 1] < scroll) lo = mid + 1;
    else hi = mid;
  }
  const first = lo;

  // Find last visible page
  const limit = scroll + viewH;
  // ... binary search for last visible

  // Add overscan for smooth scrolling
  const overscan = 2;
  let start = Math.max(0, first - overscan);
  let end = Math.min(pageCount - 1, last + overscan);

  setRange([start, end]);
}, [/* dependencies */]);
```

### Smart Range Expansion

The system ensures important content is always rendered:

```typescript
// Force selected annotation's page to be visible
if (selectedPageIdx !== undefined) {
  start = Math.min(start, selectedPageIdx);
  end = Math.max(end, selectedPageIdx);
}

// Same for search results
if (selectedSearchPageIdx !== undefined) {
  start = Math.min(start, selectedSearchPageIdx);
  end = Math.max(end, selectedSearchPageIdx);
}

// And chat source highlights
if (selectedChatSourcePageIdx !== undefined) {
  start = Math.min(start, selectedChatSourcePageIdx);
  end = Math.max(end, selectedChatSourcePageIdx);
}
```

### Rendering Loop

Only pages in range are rendered:

```typescript
return (
  <div style={{ position: "relative" }}>
    {pageInfos.map((pInfo, idx) => {
      const top = cumulative[idx];
      const height = pageHeights[idx];
      const visible = idx >= range[0] && idx <= range[1];

      return (
        <div
          key={pInfo.page.pageNumber}
          style={{
            position: "absolute",
            top,
            height,
            width: "100%",
          }}
        >
          {visible && (
            <PDFPage
              pageInfo={pInfo}
              /* other props */
            />
          )}
        </div>
      );
    })}
    {/* Spacer maintains correct scroll height */}
    <div style={{ height: cumulative[cumulative.length - 1] }} />
  </div>
);
```

## Scroll-to-Annotation System

The system implements a two-phase approach for scrolling to specific items:

### Phase 1: Page-Level Scroll (PDF.tsx)

When an annotation is selected:
1. Calculate which page contains the annotation
2. Scroll the container so the page is visible
3. Set a pending scroll ID for phase 2

```typescript
useEffect(() => {
  if (selectedAnnotations.length === 0 || pageHeights.length === 0) return;
  if (selectedPageIdx === undefined) return;

  const targetId = selectedAnnotations[0];

  // Scroll to page
  const topOffset = Math.max(0, cumulative[selectedPageIdx] - 32);
  getScrollElement().scrollTo({ top: topOffset, behavior: "smooth" });

  // Tell PDFPage to center the annotation
  setPendingScrollId(targetId);
}, [selectedAnnotations, selectedPageIdx, /* ... */]);
```

### Phase 2: Element-Level Scroll (PDFPage.tsx)

Once the page is rendered:
1. PDFPage checks for pending scroll requests
2. Finds the specific annotation element
3. Scrolls it into view with centering

```typescript
useEffect(() => {
  if (!hasPdfPageRendered) return;

  if (pendingScrollId) {
    const pageOwnsAnnotation = /* check if annotation is on this page */;
    if (!pageOwnsAnnotation) return;

    let cancelled = false;
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.querySelector(`.selection_${pendingScrollId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setPendingScrollId(null); // Clear pending
      } else {
        requestAnimationFrame(tryScroll); // Retry
      }
    };
    tryScroll();
  }
}, [hasPdfPageRendered, pendingScrollId, /* ... */]);
```

## Performance Benefits

### Memory Usage
- Only visible pages hold rendered canvases
- Annotations for non-visible pages aren't mounted
- Dramatic reduction for documents with 100+ pages

### Rendering Performance
- Initial load only renders visible pages
- Scrolling only renders newly visible pages
- Zoom changes only affect rendered pages

### Smooth Scrolling
- Overscan ensures pages are ready before visible
- Height caching prevents layout recalculations
- RequestAnimationFrame for optimal timing

## Configuration

### Overscan Amount
```typescript
const overscan = 2; // Pages to render above/below viewport
```

### Scroll Container
The system supports both window scrolling and container scrolling:

```typescript
const getScrollElement = useCallback((): HTMLElement | Window => {
  const el = scrollContainerRef?.current;
  if (el && el.scrollHeight > el.clientHeight) return el;
  return window; // Fallback to window scrolling
}, [scrollContainerRef]);
```

## Best Practices

1. **Keep overscan reasonable** - Too much defeats virtualization benefits
2. **Cache computations** - Page heights are expensive to calculate
3. **Use binary search** - Linear search is too slow for large documents
4. **Handle edge cases** - Selected items must always be visible
5. **Debounce scroll events** - Use requestAnimationFrame for smoothness

## Unified Content Feed Virtualization

### Overview

The Unified Content Feed (`UnifiedContentFeed.tsx`) aggregates annotations, relationships, notes, and search results into a single virtualized feed. Unlike the PDF viewer which has fixed page heights, this feed handles **variable-height items** with dynamic content.

### Implementation Approach

We use **react-window v2** with dynamic height measurement for optimal performance with mixed content types.

#### Key Component Structure

```typescript
<AutoSizer>
  {({ height, width }) => (
    <div style={{ position: "relative", width, height }}>
      <List
        listRef={setListRef}
        defaultHeight={height}
        rowCount={virtualItems.length}
        rowHeight={dynamicRowHeight}
        rowComponent={RowComponent}
        overscanCount={5}
      />
    </div>
  )}
</AutoSizer>
```

### Critical Implementation Details

#### 1. Positioned Parent Container (The Tricky Part)

**Problem**: react-window v2 uses `position: absolute` for rows with `transform: translateY()` for positioning. Without a proper positioning context, rows render but remain invisible.

**Solution**: Wrap the List in a div with `position: relative` and explicit dimensions:

```typescript
// CRITICAL: This wrapper provides positioning context for absolute rows
<div style={{ position: "relative", width: `${width}px`, height: `${height}px` }}>
  <List ... />
</div>
```

**Why this matters**: We spent significant debugging time discovering rows were rendering (console logs confirmed) but weren't visible. The issue was the absolutely-positioned rows had no positioned ancestor, causing them to position incorrectly outside the visible area.

#### 2. Dynamic Height Measurement

For variable-height content, we use `useDynamicRowHeight`:

```typescript
const rowHeightManager = useDynamicRowHeight({
  defaultRowHeight: ESTIMATED_HEIGHTS.annotation,
});

const rowHeight = useMemo(() => {
  return {
    ...rowHeightManager,
    getRowHeight: (index: number) => {
      // First check measured height
      const measured = rowHeightManager.getRowHeight(index);
      if (measured !== undefined) return measured;

      // Fallback to smart estimation
      const item = virtualItems[index];
      switch (item.type) {
        case "annotation": {
          const textLength = item.data.rawText?.length || 0;
          // Account for text wrapping at ~50 chars/line
          return ESTIMATED_HEIGHTS.annotation + Math.floor(textLength / 50) * 20;
        }
        case "relationship": {
          // More connections = taller
          const connections = item.data.sourceIds.length + item.data.targetIds.length;
          return ESTIMATED_HEIGHTS.relationship + connections * 10;
        }
        // ... other types
      }
    },
  };
}, [virtualItems, rowHeightManager]);
```

#### 3. Height Estimation Strategy

**Initial estimates** prevent layout shifts during measurement:

```typescript
const ESTIMATED_HEIGHTS = {
  pageHeader: 90,
  note: 200,
  annotation: 160,  // Includes padding (0.875rem) + margin (0.5rem) + content
  relationship: 220,
  search: 140,
};
```

**Content-based adjustments** improve accuracy:
- Text length → extra line height
- Number of relationships → additional row space
- Note content length → proportional height increase

### Debugging Lessons Learned

#### Issue 1: Invisible Rows
- **Symptom**: Console logs showed rows rendering, but nothing visible
- **Diagnosis**: Inspected DOM showed `height: 0px, width: 0px` on row divs
- **Root Cause**: Missing positioned parent for absolute positioning
- **Fix**: Added `position: relative` wrapper with explicit dimensions

#### Issue 2: Overlapping Content
- **Symptom**: Items rendering on top of each other
- **Diagnosis**: Fixed heights (100px) didn't match actual content
- **Root Cause**: Variable content needs dynamic measurement
- **Fix**: Implemented `useDynamicRowHeight` with smart estimation

#### Issue 3: Excessive Spacing
- **Symptom**: Large gaps between items after initial fix
- **Diagnosis**: Over-generous height estimates
- **Root Cause**: Estimates didn't account for actual rendered size
- **Fix**: Dynamic measurement with content-aware fallback estimates

### Performance Characteristics

**Advantages over custom virtualization:**
- No manual scroll event handling
- Automatic visible range calculation
- Built-in overscan management
- Smooth height transitions as content measures

**Trade-offs:**
- Initial render shows estimated heights briefly
- Height measurement happens on first display
- Slight layout shift as measurements complete (minimal with good estimates)

### Best Practices

1. **Always wrap List in positioned container** - Critical for visibility
2. **Provide good height estimates** - Reduces measurement-induced layout shifts
3. **Use content-aware estimation** - Text length, connection count, etc.
4. **Set appropriate overscan** - Balance smoothness vs. performance (we use 5)
5. **Maintain listRef** - Enables programmatic scrolling to specific items

### Testing Approach

When debugging virtualization issues:

1. **Check console for render calls** - Are components being invoked?
2. **Inspect DOM for positioning** - Look for `position: absolute` and `transform`
3. **Verify container hierarchy** - Positioned parent present?
4. **Test with simple content** - Use colored divs to isolate rendering vs. content issues
5. **Monitor height estimates** - Log estimated vs. measured heights

## Future Enhancements

1. **Dynamic overscan** - Adjust based on scroll velocity
2. **Progressive rendering** - Low-res preview while scrolling
3. **Intersection Observer** - More efficient visibility detection
4. **Memory pressure handling** - Reduce overscan under memory constraints
5. **Predictive preloading** - Anticipate scroll direction
