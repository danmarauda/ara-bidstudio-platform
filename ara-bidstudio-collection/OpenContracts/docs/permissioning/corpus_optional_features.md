# Corpus-Optional Features

## Overview

OpenContracts supports viewing and interacting with documents both within and outside of corpus contexts. This document describes which features require corpus membership and how to implement corpus-optional functionality.

## Feature Classification

### Always Available (Document-Level)
These features work with or without corpus context:

- **Document Viewing**: PDF/TXT rendering
- **Basic Search**: Search within document
- **Notes**: Personal notes on documents
- **Document Metadata**: Title, creator, dates
- **Export/Download**: Save document locally
- **Navigation**: Page navigation, zoom

### Corpus-Required Features
These features only work within corpus context:

- **Annotations**: Require corpus label sets
- **Collaborative Summaries**: Multi-perspective analysis
- **Analyses**: Corpus-scoped processing
- **Extracts**: Corpus-based data extraction
- **Shared Comments**: Team collaboration
- **Label Management**: Annotation types and colors

### Progressive Enhancement
Features that enhance when corpus is added:

- **Chat**: Basic chat without corpus, history with corpus
- **Permissions**: Document permissions alone, or corpus permissions override
- **Sharing**: Limited without corpus, full sharing within corpus

## Implementation Strategy

### Feature Availability Hook

```typescript
export const useFeatureAvailability = (corpusId?: string) => {
  const isFeatureAvailable = (feature: string): boolean => {
    const config = FEATURE_FLAGS[feature];
    return !config.requiresCorpus || Boolean(corpusId);
  };

  return {
    isFeatureAvailable,
    hasCorpus: Boolean(corpusId),
    getFeatureStatus: (feature: string) => ({
      available: isFeatureAvailable(feature),
      message: config.disabledMessage
    })
  };
};
```

### Conditional GraphQL Queries

```typescript
const DocumentKnowledgeBase = ({ documentId, corpusId }) => {
  // Use different queries based on corpus availability
  const { data } = useQuery(
    corpusId ? GET_DOCUMENT_WITH_CORPUS : GET_DOCUMENT_ONLY,
    {
      variables: corpusId
        ? { documentId, corpusId }
        : { documentId }
    }
  );
};
```

### Component Adaptation

```typescript
// Annotations only with corpus
const annotations = corpusId ? data?.annotations : [];

// Conditional handler
const handleCreateAnnotation = useCallback(
  async (annotation) => {
    if (!corpusId) {
      toast.info('Add document to corpus to create annotations');
      return;
    }
    await createAnnotation(annotation);
  },
  [corpusId, createAnnotation]
);

// Conditional rendering
return (
  <>
    {/* Always show document viewer */}
    <DocumentViewer document={document} />

    {/* Corpus-required features */}
    {corpusId && (
      <>
        <AnnotationPanel annotations={annotations} />
        <AnalysesPanel corpusId={corpusId} />
      </>
    )}

    {/* Corpus-optional features */}
    <NotesPanel documentId={documentId} corpusId={corpusId} />

    {/* Add to corpus prompt when not in corpus */}
    {!corpusId && (
      <AddToCorpusPrompt documentId={documentId} />
    )}
  </>
);
```

## Feature Flags Configuration

```typescript
export const FEATURE_FLAGS = {
  ANNOTATIONS: {
    requiresCorpus: true,
    displayName: 'Annotations',
    disabledMessage: 'Add to corpus to annotate'
  },
  NOTES: {
    requiresCorpus: false,
    displayName: 'Notes',
    disabledMessage: null
  },
  CHAT: {
    requiresCorpus: false, // Basic chat works without corpus
    enhancedWithCorpus: true, // But better with corpus
    displayName: 'Document Chat'
  },
  ANALYSES: {
    requiresCorpus: true,
    displayName: 'Document Analyses',
    disabledMessage: 'Add to corpus to run analyses'
  }
};
```

## UI Patterns

### Empty State with CTA

```typescript
const CorpusRequiredEmptyState = ({ feature, onAddToCorpus }) => (
  <EmptyState>
    <Icon name="folder open" size="huge" />
    <Header>{feature} requires corpus membership</Header>
    <p>Add this document to a corpus to enable {feature}.</p>
    <Button primary onClick={onAddToCorpus}>
      Add to Corpus
    </Button>
  </EmptyState>
);
```

### Adaptive Controls

```typescript
const FloatingControls = ({ corpusId, documentId }) => {
  const { isFeatureAvailable } = useFeatureAvailability(corpusId);

  return (
    <ControlsContainer>
      {/* Always available */}
      <Button icon="search" title="Search" />
      <Button icon="note" title="Add note" />

      {/* Show add to corpus if needed */}
      {!corpusId && (
        <Button icon="folder plus" title="Add to corpus" primary />
      )}

      {/* Corpus features */}
      {isFeatureAvailable('ANNOTATIONS') && (
        <Button icon="highlighter" title="Annotate" />
      )}
    </ControlsContainer>
  );
};
```

### Progressive Disclosure

```typescript
const DocumentPanel = ({ corpusId }) => {
  const [showCorpusFeatures, setShowCorpusFeatures] = useState(false);

  useEffect(() => {
    // Reveal corpus features with animation
    if (corpusId) {
      setShowCorpusFeatures(true);
    }
  }, [corpusId]);

  return (
    <Panel>
      <BasicFeatures />
      {showCorpusFeatures && (
        <AnimatedReveal>
          <CorpusFeatures />
        </AnimatedReveal>
      )}
    </Panel>
  );
};
```

## Add to Corpus Flow

### Modal Component

```typescript
const AddToCorpusModal = ({ documentId, open, onClose, onSuccess }) => {
  const { data } = useQuery(GET_MY_CORPUSES);
  const [addDocument] = useMutation(ADD_DOCUMENT_TO_CORPUS);

  const handleAdd = async (corpusId) => {
    const result = await addDocument({
      variables: { documentId, corpusId }
    });

    if (result.data.success) {
      onSuccess(corpusId);
      toast.success('Document added to corpus');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header>Add Document to Corpus</Modal.Header>
      <Modal.Content>
        <CorpusList
          corpuses={data?.corpuses}
          onSelect={handleAdd}
        />
      </Modal.Content>
    </Modal>
  );
};
```

### Success Handling

```typescript
const handleAddToCorpusSuccess = (newCorpusId) => {
  // Option 1: Reload with corpus context
  window.location.href = `/corpus/${newCorpusId}/document/${documentId}`;

  // Option 2: Update state and refetch
  setCorpusId(newCorpusId);
  refetch({ documentId, corpusId: newCorpusId });

  // Option 3: Show success message and update UI
  setShowSuccessMessage(true);
  setCorpusFeatures(true);
};
```

## Performance Considerations

### Lighter Initial Load
- Skip corpus data when not needed
- No annotation rendering overhead
- Fewer GraphQL queries
- No WebSocket connections for collaboration

### Progressive Loading
```typescript
// Load corpus features only when needed
const { data: corpusData, loading } = useQuery(
  GET_CORPUS_FEATURES,
  {
    skip: !corpusId,
    variables: { corpusId }
  }
);
```

### Caching Strategy
```typescript
// Cache user's corpuses for quick add-to-corpus
const { data: cachedCorpuses } = useQuery(GET_MY_CORPUSES, {
  fetchPolicy: 'cache-first'
});
```

## Testing Corpus-Optional Features

### Test Without Corpus
```typescript
it('should show document without corpus features', () => {
  render(<DocumentKnowledgeBase documentId="123" />);

  expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
  expect(screen.queryByTestId('annotation-panel')).not.toBeInTheDocument();
  expect(screen.getByText('Add to Corpus')).toBeInTheDocument();
});
```

### Test Corpus Addition
```typescript
it('should enable features after adding to corpus', async () => {
  const { rerender } = render(
    <DocumentKnowledgeBase documentId="123" />
  );

  // Add to corpus
  fireEvent.click(screen.getByText('Add to Corpus'));
  fireEvent.click(screen.getByText('My Research Corpus'));

  // Rerender with corpus
  rerender(
    <DocumentKnowledgeBase documentId="123" corpusId="456" />
  );

  // Features now available
  await waitFor(() => {
    expect(screen.getByTestId('annotation-panel')).toBeInTheDocument();
  });
});
```

## Migration Path

### Phase 1: Make corpusId Optional
1. Update DocumentKnowledgeBase props
2. Add conditional GraphQL queries
3. Implement feature availability checks

### Phase 2: Build UI Components
1. Create AddToCorpusModal
2. Add empty states with CTAs
3. Implement adaptive controls

### Phase 3: Test and Polish
1. Test all corpus-optional scenarios
2. Add loading states
3. Implement success animations
4. Handle edge cases
