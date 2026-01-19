# Frontend Layout Architecture

## Overview
The OpenContracts frontend employs a hierarchical flex-based layout system that provides consistent structure across all views while supporting responsive design and complex UI states.

## Component Hierarchy

```
index.tsx
  └── App.tsx (Root container with auth & routing)
      └── CardLayout.tsx (Reusable page wrapper)
          └── View Components (Corpuses, Documents, etc.)
```

## Core Layout Principles

### 1. Flex-Based Sizing
- All containers use flexbox for layout distribution
- Primary content areas use `flex: 1` to fill available space
- Explicit `min-height: 0` on flex children to prevent overflow issues

### 2. Single Scroll Context
- Each view maintains one primary scrollable area
- Scroll is handled by `ScrollableSegment` in CardLayout
- Parent containers use `overflow: hidden` to prevent double scrollbars

### 3. Consistent Container Structure
Every view follows this pattern:
- **SearchBar**: Fixed top position with filters and actions
- **BreadCrumbs**: Optional navigation context (hidden on mobile <768px)
- **ScrollableSegment**: Main content area with controlled overflow

### 4. Responsive Breakpoints
- Mobile: ≤400px (minimal padding, simplified UI)
- Tablet: 401-1000px (moderate padding, responsive features)
- Desktop: >1000px (full features, maximum padding)

## Layout Implementation

### App.tsx Container
```tsx
// Outer wrapper - full viewport
<div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
  // Inner content - fills available space
  <Container style={{ flex: 1, overflow: "hidden" }}>
    <Routes>...</Routes>
  </Container>
  <Footer />
</div>
```

### CardLayout Structure
```tsx
<CardContainer> // flex: 1, overflow: hidden
  <SearchBarWrapper />
  <BreadCrumbs /> // Optional
  <ScrollableSegment> // overflow-y: auto, flex: 1
    {children}
  </ScrollableSegment>
</CardContainer>
```

### Complex View Example (Corpuses)
The Corpuses view demonstrates advanced layout patterns:
- **List Mode**: Simple card grid with pagination
- **Detail Mode**: Sidebar navigation + content panels
- **Mobile Mode**: Collapsible sidebar overlay

## Common Patterns

### Filling Available Height
```tsx
style={{
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0, // Critical for nested flex containers
  overflow: "hidden"
}}
```

### Scrollable Content Area
```tsx
style={{
  flex: 1,
  overflowY: "auto",
  minHeight: 0
}}
```

### Responsive Padding
```tsx
padding: width <= 400 ? "8px" : width <= 1000 ? "12px" : "20px"
```
