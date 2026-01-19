# Corpus-Optional Features Implementation Guide

## Overview

OpenContracts serves dual purposes:
1. **Document Management System**: Users need to view, organize, and manage documents
2. **Research Platform**: Documents are organized into corpuses for collaborative analysis

The corpus-optional architecture enables users to:
- View documents that haven't been assigned to any corpus
- Preview documents before adding them to a corpus
- Access basic document features without corpus membership
- Progressively unlock advanced features by adding documents to corpuses

## Architecture Overview

### Feature Classification

Features are classified into three categories:

#### 1. Always Available (No Corpus Required)
- Document viewing (PDF/text rendering)
- Basic navigation (zoom, page controls)
- Document metadata viewing
- Export/download
- Basic search within document

#### 2. Corpus-Required Features
- Annotations (create, edit, view)
- Chat/conversation with document
- Notes and summaries
- Cross-document search
- Analyses
- Data extraction
- Collaboration features

#### 3. Progressive Enhancement
Features that have basic functionality without corpus but enhanced with corpus:
- Search (document-only vs corpus-wide)
- Export (single document vs corpus export)
- Metadata (basic vs enriched)

## Component Dependencies Inventory

### DocumentKnowledgeBase Component

#### Direct Corpus Dependencies
```typescript
// Props
corpusId: string  // Currently required prop

// GraphQL Query Variables
const { data, loading, refetch } = useQuery(GET_DOCUMENT_KNOWLEDGE_AND_ANNOTATIONS, {
  variables: { corpusId, documentId }
});

// Child Component Props
<ChatTray corpusId={corpusId} />
<UnifiedKnowledgeLayer corpusId={corpusId} />
<FloatingSummaryPreview corpusId={corpusId} />
<NewNoteModal corpusId={corpusId} />
```

#### State Store Dependencies
```typescript
// Jotai atoms that depend on corpus
selectedAnalysesAtom: Analysis[]  // Requires corpus context
activeAnalysisAtom: Analysis | null
selectedLanguageModelAtom: LanguageModel | null
showAnalysisViewAtom: boolean
```

#### GraphQL Queries with Corpus Dependencies
1. `GET_DOCUMENT_KNOWLEDGE_AND_ANNOTATIONS` - Requires corpusId
2. `GET_CORPUS_ANALYSES` - Corpus-specific analyses
3. `START_CORPUS_QUERY` - Corpus-wide queries
4. `GET_LANGUAGE_MODELS` - May have corpus-specific models

### Child Components Requiring Refactoring

| Component | Corpus Dependency | Refactor Needed |
|-----------|------------------|-----------------|
| ChatTray | Required prop | Make optional, disable if missing |
| UnifiedKnowledgeLayer | Required for annotations | Conditional rendering |
| FloatingSummaryPreview | Uses corpus notes | Fallback to document notes |
| NewNoteModal | Saves to corpus | Support document-only notes |
| AnalysisPanel | Corpus analyses only | Hide without corpus |
| ExtractionPanel | Corpus extracts only | Hide without corpus |

## Implementation Strategy

### Phase 1: Core Infrastructure (2-3 days)

#### 1.1 Feature Configuration System
```typescript
// /frontend/src/config/features.ts
export const FEATURE_FLAGS = {
  CHAT: {
    requiresCorpus: true,
    displayName: 'Chat with Document',
    description: 'Ask questions about this document',
    icon: 'chat'
  },
  ANNOTATIONS: {
    requiresCorpus: true,
    displayName: 'Annotations',
    description: 'Highlight and annotate text',
    icon: 'highlight'
  },
  // ... other features
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;
```

#### 1.2 Feature Availability Hook
```typescript
// /frontend/src/hooks/useFeatureAvailability.ts
export function useFeatureAvailability(corpusId?: string) {
  return {
    isAvailable: (feature: FeatureKey) => {
      if (!FEATURE_FLAGS[feature].requiresCorpus) return true;
      return !!corpusId;
    },
    unavailableFeatures: Object.keys(FEATURE_FLAGS).filter(
      key => FEATURE_FLAGS[key].requiresCorpus && !corpusId
    ),
    getFeatureConfig: (feature: FeatureKey) => FEATURE_FLAGS[feature]
  };
}
```

### Phase 2: Component Refactoring (3-4 days)

#### 2.1 Update DocumentKnowledgeBase
```typescript
interface DocumentKnowledgeBaseProps {
  documentId: string;
  corpusId?: string;  // Make optional
  permissions?: DocumentPermissions;
}

// Inside component
const features = useFeatureAvailability(corpusId);

// Conditional rendering
{features.isAvailable('CHAT') && (
  <ChatTray corpusId={corpusId!} documentId={documentId} />
)}
```

#### 2.2 Create Fallback Components
```typescript
// Components for corpus-required features when no corpus
<FeaturePrompt 
  feature="ANNOTATIONS"
  onAddToCorpus={() => setShowAddToCorpusModal(true)}
/>
```

### Phase 3: UI/UX Enhancements (2-3 days)

#### 3.1 Add-to-Corpus Flow
```typescript
// /frontend/src/components/modals/AddToCorpusModal.tsx
interface AddToCorpusModalProps {
  documentId: string;
  onSuccess: (corpusId: string) => void;
  suggestedFeature?: FeatureKey;
}
```

#### 3.2 Feature Discovery UI
- Tooltips on disabled features explaining corpus requirement
- "Unlock features" banner when viewing without corpus
- Progressive disclosure of available actions

### Phase 4: Testing & Polish (2 days)

#### 4.1 Test Scenarios
```typescript
describe('Corpus-Optional Document Viewer', () => {
  it('renders document without corpus', () => {
    // Test basic viewing works
  });
  
  it('shows feature prompts for corpus features', () => {
    // Test UI shows appropriate prompts
  });
  
  it('enables features after adding to corpus', () => {
    // Test feature activation flow
  });
});
```

## Migration Guide

### For Existing Components

1. **Check corpus dependency**:
   ```typescript
   // Before
   const { corpusId } = props;  // Required
   
   // After
   const { corpusId } = props;  // Optional
   const hasCorpus = !!corpusId;
   ```

2. **Guard corpus-dependent code**:
   ```typescript
   // Before
   refetch({ corpusId, documentId });
   
   // After
   if (corpusId) {
     refetch({ corpusId, documentId });
   } else {
     refetchDocumentOnly({ documentId });
   }
   ```

3. **Update GraphQL queries**:
   ```typescript
   // Add document-only query variants
   const GET_DOCUMENT_ONLY = gql`
     query GetDocument($documentId: ID!) {
       document(id: $documentId) {
         id
         title
         content
         // ... no corpus fields
       }
     }
   `;
   ```

## Performance Considerations

### Query Optimization
- Use separate queries for corpus vs non-corpus contexts
- Avoid fetching corpus data when not needed
- Cache document-only queries separately

### Bundle Size
- Lazy load corpus-specific components
- Split feature modules for code splitting

### State Management
- Separate corpus-dependent state from document state
- Use derived state for feature availability

## Security Considerations

1. **Server-side enforcement**: All permission checks must be server-side
2. **Feature flags are UI hints**: Never rely on client-side feature flags for security
3. **Document access**: Ensure document-level permissions are checked

## Developer Tasks Checklist

### Senior Developer Tasks (5-6 days)
- [ ] Create feature configuration system
- [ ] Build useFeatureAvailability hook
- [ ] Refactor DocumentKnowledgeBase props
- [ ] Update GraphQL queries for optional corpus
- [ ] Create AddToCorpusModal component

### Mid-Level Developer Tasks (3-4 days)
- [ ] Update child components for optional corpus
- [ ] Create FeaturePrompt components
- [ ] Add loading states for corpus transitions
- [ ] Update error boundaries

### Junior Developer Tasks (2-3 days)
- [ ] Add tooltips to disabled features
- [ ] Create feature discovery banner
- [ ] Update component documentation
- [ ] Add Storybook stories for new states

## Testing Strategy

### Unit Tests
- Test feature availability logic
- Test component rendering with/without corpus
- Test state transitions

### Integration Tests
- Test add-to-corpus flow
- Test feature activation
- Test permission changes

### E2E Tests
- Full user journey from document view to corpus addition
- Feature discovery and activation
- Error scenarios

## Rollout Plan

1. **Phase 1**: Deploy infrastructure changes (no user impact)
2. **Phase 2**: Enable for admin users (beta testing)
3. **Phase 3**: Gradual rollout to all users
4. **Phase 4**: Remove legacy corpus-required code

## Monitoring & Metrics

Track:
- Documents viewed without corpus
- Add-to-corpus conversion rate
- Feature discovery interactions
- Error rates for corpus-optional paths

## Related Documentation

- [Permission System Documentation](../permissioning/README.md)
- [Frontend Routing System](./routing_system.md)
- [Document Rendering](./document_rendering_and_annotation.md)

## FAQ

**Q: What happens to existing corpus-required features?**  
A: They remain unchanged when viewing documents within a corpus. This adds a new path for corpus-less viewing.

**Q: Can users create annotations without a corpus?**  
A: No, annotations require corpus context for storage and sharing.

**Q: How do we handle existing URLs?**  
A: Existing corpus URLs continue to work. New document-only URLs will be added.

**Q: What about mobile support?**  
A: The corpus-optional view will be mobile-responsive with appropriate feature hiding.