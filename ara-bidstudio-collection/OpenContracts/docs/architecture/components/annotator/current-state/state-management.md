# Annotator System: Data Flow and State Management

## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [State Management with Jotai](#state-management-with-jotai)
4. [Data Flow](#data-flow)
5. [Key Components](#key-components)
6. [Annotation Filtering System](#annotation-filtering-system)
7. [Performance Optimizations](#performance-optimizations)

## Overview

The Annotator system uses a modern architecture combining Jotai for state management with virtualized rendering for performance. It efficiently manages and displays annotations on PDF documents while maintaining responsive user experience even with large documents and numerous annotations.

## Component Hierarchy

```
DocumentKnowledgeBase (Data fetching & top-level state)
├── PDF (Virtualization engine)
│   └── PDFPage (Individual page renderer)
│       ├── Canvas (PDF content)
│       ├── SelectionLayer (User interactions)
│       ├── Selection (Annotation display)
│       ├── SearchResult (Search highlights)
│       └── ChatSourceResult (Chat source highlights)
├── Sidebars/Panels (UI for managing annotations)
├── ViewSettingsPopup (Annotation visibility controls)
└── LabelSelector (Active annotation label selection)
```

## State Management with Jotai

The system uses Jotai atoms for reactive state management, providing efficient updates and computed derivations:

### Core Atoms (AnnotationAtoms.tsx)

```typescript
// Primary annotation state
export const pdfAnnotationsAtom = atom<PdfAnnotations>(
  new PdfAnnotations([], [], [])
);

// Structural annotations (separate for filtering)
export const structuralAnnotationsAtom = atom<ServerTokenAnnotation[]>([]);

// Computed atom: All annotations deduplicated
export const allAnnotationsAtom = atom<(ServerTokenAnnotation | ServerSpanAnnotation)[]>((get) => {
  const { annotations } = get(pdfAnnotationsAtom);
  const structural = get(structuralAnnotationsAtom);

  // Deduplicate and combine
  const seen = new Set<string>();
  const out = [];

  for (const a of [...annotations, ...structural]) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out;
});

// Computed atom: Annotations indexed by page
export const perPageAnnotationsAtom = atom((get) => {
  const all = get(allAnnotationsAtom);
  const map = new Map<number, (ServerTokenAnnotation | ServerSpanAnnotation)[]>();

  for (const a of all) {
    const pageIdx = a.page ?? 0;
    if (!map.has(pageIdx)) map.set(pageIdx, []);
    map.get(pageIdx)!.push(a);
  }
  return map;
});
```

### UI State Atoms (UISettingsAtom.tsx)

#### View Control Atoms
- `zoomLevelAtom` - Current PDF zoom level
- `isSidebarVisibleAtom` - Left sidebar visibility (not the right panel)
- `showAnnotationBoundingBoxesAtom` - Whether to show bounding boxes
- `showAnnotationLabelsAtom` - Label display behavior (ALWAYS, ON_HOVER, HIDE)
- `showStructuralAnnotationsAtom` - Whether to show structural annotations (default: false)
- `showStructuralRelationshipsAtom` - Whether to show structural relationships
- `showSelectedAnnotationOnlyAtom` - Show only selected annotations
- `hideLabelsAtom` - Hide all labels

#### Selection Atoms
- `selectedAnnotationsAtom` - Currently selected annotation IDs
- `selectedRelationsAtom` - Currently selected relationships
- `hoveredAnnotationIdAtom` - Currently hovered annotation

#### Control Atoms
- `activeSpanLabelAtom` - Currently active label for new annotations
- `spanLabelsToViewAtom` - Which labels to filter/display
- `activeRelationLabelAtom` - Active relationship label

#### Chat Panel Management
- `chatPanelWidthModeAtom` - Width mode ("quarter", "half", "full", "custom")
- `chatPanelCustomWidthAtom` - Custom width percentage when in custom mode

### Document State Atoms (DocumentAtom.tsx)

- `scrollContainerRefAtom` - Reference to scrolling container
- `pendingScrollAnnotationIdAtom` - Annotation to scroll to
- `textSearchStateAtom` - Current search results and selection

## Data Flow

### 1. Initial Data Loading

```mermaid
graph TD
    A[DocumentKnowledgeBase] -->|GraphQL Query| B[GET_DOCUMENT_KNOWLEDGE_AND_ANNOTATIONS]
    B --> C[Backend returns separate arrays]
    C --> D[allAnnotations]
    C --> E[allStructuralAnnotations]
    D --> F[processAnnotationsData]
    E --> F
    F --> G[convertToServerAnnotation]
    G --> H[Filter by type]
    H --> I[Regular annotations → pdfAnnotationsAtom]
    H --> J[Structural annotations → structuralAnnotationsAtom]
    I --> K[allAnnotationsAtom<br/>(computed, deduplicated)]
    J --> K
    K --> L[perPageAnnotationsAtom<br/>(computed, indexed by page)]
    K --> M[useVisibleAnnotations<br/>(filtered by UI settings)]
    M --> N[PDFPage Components]
```

### Key Points:
- **Separation at Source**: Backend sends `allAnnotations` and `allStructuralAnnotations` as separate arrays
- **Maintained Separation**: Frontend keeps them in separate atoms to prevent duplication
- **Each annotation has `structural` boolean property**: Used for filtering logic
- **Deduplication**: `allAnnotationsAtom` combines both arrays and removes duplicates by ID

### 2. User Interactions

When a user selects an annotation:
1. `selectedAnnotationIdsAtom` is updated
2. `useVisibleAnnotations` ensures selected annotations are visible
3. PDF component expands visible range to include annotation's page
4. PDFPage scrolls the specific annotation into view

### 3. Filtering Updates

When filter settings change:
1. UI atoms are updated (e.g., `showStructuralAnnotationsAtom`, `spanLabelsToViewAtom`)
2. `useVisibleAnnotations` hook recomputes based on new filters
3. Only affected PDFPage components re-render
4. No network requests needed - all filtering is local

#### Special Behavior: Show Structural Toggle
When enabling "Show Structural":
- Automatically enables "Show Selected Only" mode
- This prevents overwhelming the UI with all structural annotations
- Users see only selected items when structural mode is active

```typescript
// In AnnotationControls.tsx
const handleShowStructuralChange = useCallback(() => {
  const newStructuralValue = !showStructural;
  setShowStructural(newStructuralValue);

  // Force "show selected only" when enabling structural view
  if (newStructuralValue) {
    setShowSelectedOnly(true);
  }
}, [showStructural, setShowStructural, setShowSelectedOnly]);
```

## Key Components

### DocumentKnowledgeBase

- **Purpose**: Top-level container managing document viewing and knowledge extraction
- **Responsibilities**:
  - Fetches document and annotation data via GraphQL
  - Initializes Jotai atoms with fetched data
  - Manages layout and panel switching
  - Coordinates between different viewing modes

### PDF Component

- **Purpose**: Implements virtualized rendering for performance
- **Key Features**:
  - Calculates visible page range using binary search
  - Manages page height caching per zoom level
  - Ensures selected items' pages are always rendered
  - Handles scroll-to-annotation coordination

### PDFPage Component

- **Purpose**: Renders individual PDF pages with annotations
- **Optimizations**:
  - Only renders when in viewport
  - Manages its own PDF rendering lifecycle
  - Filters annotations to show only those on current page
  - Handles annotation selection and creation

### useVisibleAnnotations Hook

This is the **single source of truth** for annotation visibility:

```typescript
export function useVisibleAnnotations() {
  const allAnnotations = useAllAnnotations();
  const { showStructural, showStructuralRelationships } = useAnnotationDisplay();
  const { spanLabelsToView } = useAnnotationControls();
  const { selectedAnnotations, selectedRelations } = useAnnotationSelection();
  const { pdfAnnotations } = usePdfAnnotations();

  return useMemo(() => {
    // Step 1: Determine forced visibility
    const forcedBySelectedRelationIds = new Set<string>(
      selectedRelations.flatMap((rel) => [...rel.sourceIds, ...rel.targetIds])
    );

    const forcedBySelection = new Set<string>(selectedAnnotations);

    const forcedByRelationships = new Set<string>();
    if (showStructuralRelationships) {
      (pdfAnnotations?.relations ?? []).forEach((rel) => {
        rel.sourceIds.forEach((id) => forcedByRelationships.add(id));
        rel.targetIds.forEach((id) => forcedByRelationships.add(id));
      });
    }

    // Combine forced IDs based on structural setting
    const forcedIds = new Set(forcedBySelection);
    if (showStructural) {
      forcedBySelectedRelationIds.forEach((id) => forcedIds.add(id));
      forcedByRelationships.forEach((id) => forcedIds.add(id));
    }

    // Step 2: Label filter setup
    const labelFilterActive = spanLabelsToView && spanLabelsToView.length > 0
      ? new Set(spanLabelsToView.map((l) => l.id))
      : null;

    // Step 3: Apply filtering logic
    return allAnnotations.filter((annot) => {
      // Always show forced annotations
      if (forcedIds.has(annot.id)) return true;

      // Structural filter - key logic!
      if (annot.structural) {
        return showStructural; // Only show if toggle is ON
      }

      // Label filter (only for non-forced, non-structural)
      if (labelFilterActive && !labelFilterActive.has(annot.annotationLabel.id)) {
        return false;
      }

      return true; // Show all other annotations
    });
  }, [/* all dependencies */]);
}
```

## Annotation Filtering System

The system provides centralized, consistent filtering through `useVisibleAnnotations`:

### 1. Forced Visibility
- Selected annotations always visible
- Annotations in selected relationships always visible (when structural view is ON)
- Overrides all other filters
- Ensures important context is never hidden

### 2. Structural Annotation Handling

#### Data Structure
- **Regular annotations**: Stored in `pdfAnnotationsAtom`
- **Structural annotations**: Stored in `structuralAnnotationsAtom`
- **Combined view**: `allAnnotationsAtom` merges and deduplicates

#### Visibility Logic
- Each annotation has a `structural: boolean` property
- When `showStructuralAnnotationsAtom` is `false` (default):
  - Structural annotations are hidden
  - Regular annotations are shown
- When `showStructuralAnnotationsAtom` is `true`:
  - Structural annotations become visible
  - "Show Selected Only" is auto-enabled to prevent UI overload
  - Relationships involving structural annotations become visible

#### Why Separate Storage?
- **Performance**: Structural annotations can be numerous (e.g., every paragraph marker)
- **Clean data management**: Prevents accidental mixing of annotation types
- **Flexible filtering**: Easy to toggle entire category on/off
- **Backend consistency**: Mirrors backend's separation of annotation types

### 3. Label Filter
- Filter by specific annotation labels
- Multi-select capability via `ViewLabelSelector` component
- Only applies to non-forced, non-structural annotations
- Stored in `spanLabelsToViewAtom`

### 4. Page-Level Filtering
- PDFPage components further filter to show only annotations on their page
- Efficient - no unnecessary rendering of off-page annotations
- Uses `perPageAnnotationsAtom` for O(1) page lookups

### 5. Show Selected Only Mode
- When enabled, only selected annotations are visible
- Auto-enabled when showing structural annotations
- Useful for focusing on specific annotations

## Performance Optimizations

### 1. Virtualized Rendering
- Only visible PDF pages (+overscan) are rendered
- Dramatic performance improvement for large documents
- Smart range expansion for selected items

### 2. Computed Atoms
- Derivations only recalculate when dependencies change
- No manual state synchronization needed
- Automatic memoization built-in

### 3. Granular Updates
- Component-level filtering prevents unnecessary re-renders
- Page components operate independently
- Zoom changes only affect visible pages

### 4. Efficient Data Structures
- Page-indexed annotation map for O(1) lookups
- Set-based deduplication
- Binary search for visible page detection

### 5. Scroll Optimization
- RequestAnimationFrame for smooth scrolling
- Throttled scroll event handling
- Smart scroll-to-annotation with precedence system

## Control Components Architecture

### AnnotationControls Component

The `AnnotationControls` component provides unified controls for annotation visibility settings. It has two key features:

1. **Variant Support**:
   - `variant="sidebar"` - Used in the right panel's `SidebarControlBar`
   - `variant="floating"` - Used in `FloatingDocumentControls` when right panel is closed
   - Both variants now show identical features (label display and filters)

2. **Coordinated Visibility**:
   - Controls appear in `FloatingDocumentControls` when right panel is closed
   - Controls appear in `SidebarControlBar` when right panel is open and in feed mode
   - Controlled by `showRightPanel` state passed from `DocumentKnowledgeBase`

### Control State Synchronization

```typescript
// In DocumentKnowledgeBase.tsx
const [showRightPanel, setShowRightPanel] = useState(false);

// Passed to FloatingDocumentControls
<FloatingDocumentControls
  showRightPanel={showRightPanel}  // Controls visibility of settings button
  // ... other props
/>

// In FloatingDocumentControls.tsx
{!showRightPanel && (
  <ActionButton>  // Settings button only shows when panel is closed
    <Settings />
  </ActionButton>
)}
```

This ensures annotation controls are always accessible but never duplicated on screen.

## Best Practices

1. **Always use hooks** for accessing annotation state
   - `useAllAnnotations()` for all annotations
   - `useVisibleAnnotations()` for filtered annotations
   - `usePdfAnnotations()` for raw PdfAnnotations object

2. **Leverage computed atoms** instead of manual calculations
   - They automatically update when dependencies change
   - Provide built-in memoization

3. **Keep filtering logic centralized** in `useVisibleAnnotations`
   - Ensures consistency across all components
   - Single source of truth for visibility

4. **Use proper atom updates** to maintain immutability
   - Always create new objects/arrays when updating
   - Jotai relies on referential equality for updates

5. **Separate structural from regular annotations**
   - Keep them in separate atoms as provided by backend
   - Let `allAnnotationsAtom` handle the merging
   - Use the `structural` property for filtering decisions
