# Testing Permissions

## Overview

This guide covers strategies, utilities, and best practices for testing permission-related functionality in OpenContracts.

## Test Utilities

### Permission Mock Factory

```typescript
// tests/mocks/permissionMocks.ts
export const PERMISSION_SCENARIOS = {
  FULL_ACCESS: {
    document: ["CAN_READ", "CAN_UPDATE", "CAN_REMOVE"],
    corpus: ["CAN_READ", "CAN_UPDATE", "CAN_REMOVE"]
  },
  READ_ONLY: {
    document: ["CAN_READ"],
    corpus: ["CAN_READ"]
  },
  CORPUS_UPDATE_ONLY: {
    document: ["CAN_READ"],
    corpus: ["CAN_READ", "CAN_UPDATE"]
  },
  DOCUMENT_UPDATE_ONLY: {
    document: ["CAN_READ", "CAN_UPDATE"],
    corpus: ["CAN_READ"]
  },
  NO_PERMISSIONS: {
    document: [],
    corpus: []
  }
};

export const createPermissionMocks = (scenario: keyof typeof PERMISSION_SCENARIOS) => {
  const permissions = PERMISSION_SCENARIOS[scenario];
  return {
    document: createDocumentWithPermissions(permissions.document),
    corpus: createCorpusWithPermissions(permissions.corpus)
  };
};
```

### GraphQL Mock Helpers

```typescript
export const createDocumentMock = (permissions: string[]) => ({
  request: {
    query: GET_DOCUMENT_KNOWLEDGE_AND_ANNOTATIONS,
    variables: { documentId: "123", corpusId: "456" }
  },
  result: {
    data: {
      document: {
        id: "123",
        myPermissions: permissions,
        // ... other fields
      }
    }
  }
});

export const createCorpusMock = (permissions: string[]) => ({
  request: {
    query: GET_CORPUS,
    variables: { corpusId: "456" }
  },
  result: {
    data: {
      corpus: {
        id: "456",
        myPermissions: permissions,
        // ... other fields
      }
    }
  }
});
```

## Testing Patterns

### Pattern 1: Testing Permission Priority

```typescript
describe('Permission Priority', () => {
  it('should prioritize corpus permissions over document', async () => {
    const mocks = [
      createDocumentMock(["READ"]), // Document: read-only
      createCorpusMock(["CAN_READ", "CAN_UPDATE"]) // Corpus: can edit
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DocumentKnowledgeBase documentId="123" corpusId="456" />
      </MockedProvider>
    );

    // Should be editable due to corpus permission
    await waitFor(() => {
      expect(screen.queryByText('Document is read-only')).not.toBeInTheDocument();
    });
  });
});
```

### Pattern 2: Testing Read-Only Behavior

```typescript
describe('Read-Only Mode', () => {
  it('should prevent editing with read-only permissions', async () => {
    const mocks = createPermissionMocks('READ_ONLY');

    render(
      <MockedProvider mocks={[mocks]}>
        <DocumentKnowledgeBase documentId="123" corpusId="456" />
      </MockedProvider>
    );

    // Try to create annotation
    const text = screen.getByText('Sample text');
    fireEvent.mouseDown(text);
    fireEvent.mouseUp(text);

    // Should show read-only message
    await waitFor(() => {
      expect(screen.getByText('Document is read-only')).toBeInTheDocument();
    });
  });
});
```

### Pattern 3: Testing Feature Availability

```typescript
describe('Feature Availability', () => {
  it('should hide corpus features without corpus', () => {
    render(
      <MockedProvider mocks={[documentOnlyMock]}>
        <DocumentKnowledgeBase documentId="123" />
      </MockedProvider>
    );

    // Corpus features should be hidden
    expect(screen.queryByTestId('annotation-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analyses-panel')).not.toBeInTheDocument();

    // Document features should be visible
    expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('notes-panel')).toBeInTheDocument();
  });
});
```

### Pattern 4: Testing Permission Changes

```typescript
describe('Permission Updates', () => {
  it('should update UI when permissions change', async () => {
    const { rerender } = render(
      <MockedProvider mocks={[readOnlyMocks]}>
        <DocumentKnowledgeBase documentId="123" corpusId="456" />
      </MockedProvider>
    );

    // Initially read-only
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();

    // Update with edit permissions
    rerender(
      <MockedProvider mocks={[editableMocks]}>
        <DocumentKnowledgeBase documentId="123" corpusId="456" />
      </MockedProvider>
    );

    // Now editable
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });
});
```

## Component Test Examples

### DocumentKnowledgeBase Tests

```typescript
describe('DocumentKnowledgeBase Permissions', () => {
  const scenarios = [
    { name: 'full access', scenario: 'FULL_ACCESS', canEdit: true },
    { name: 'read only', scenario: 'READ_ONLY', canEdit: false },
    { name: 'corpus update', scenario: 'CORPUS_UPDATE_ONLY', canEdit: true },
    { name: 'document update', scenario: 'DOCUMENT_UPDATE_ONLY', canEdit: false }
  ];

  scenarios.forEach(({ name, scenario, canEdit }) => {
    it(`should handle ${name} permissions`, async () => {
      const mocks = createPermissionMocks(scenario);

      render(
        <MockedProvider mocks={[mocks]}>
          <DocumentKnowledgeBase documentId="123" corpusId="456" />
        </MockedProvider>
      );

      if (canEdit) {
        expect(screen.queryByText('read-only')).not.toBeInTheDocument();
      } else {
        expect(screen.getByText(/read-only/i)).toBeInTheDocument();
      }
    });
  });
});
```

### Route Component Tests

```typescript
describe('DocumentLandingRoute', () => {
  it('should not hardcode readOnly prop', async () => {
    const MockDocumentKnowledgeBase = vi.fn(() => <div>Mock</div>);

    vi.mock('../DocumentKnowledgeBase', () => ({
      default: MockDocumentKnowledgeBase
    }));

    render(
      <MemoryRouter initialEntries={['/d/user/corpus/doc']}>
        <DocumentLandingRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      const props = MockDocumentKnowledgeBase.mock.calls[0][0];
      expect(props.readOnly).not.toBe(true);
    });
  });
});
```

## Integration Tests

### Permission Flow Integration

```typescript
describe('Permission Flow Integration', () => {
  it('should correctly flow permissions from route to components', async () => {
    const slugResolutionMock = {
      request: {
        query: RESOLVE_DOCUMENT_IN_CORPUS_BY_SLUGS,
        variables: { userSlug: 'user', corpusSlug: 'corpus', documentSlug: 'doc' }
      },
      result: {
        data: {
          corpusBySlugs: { myPermissions: ['CAN_UPDATE'] },
          documentInCorpusBySlugs: { myPermissions: ['READ'] }
        }
      }
    };

    render(
      <MockedProvider mocks={[slugResolutionMock]}>
        <MemoryRouter initialEntries={['/d/user/corpus/doc']}>
          <DocumentLandingRoute />
        </MemoryRouter>
      </MockedProvider>
    );

    // Should be editable due to corpus UPDATE permission
    await waitFor(() => {
      const pdfComponent = screen.getByTestId('pdf-viewer');
      expect(pdfComponent).not.toHaveAttribute('read-only');
    });
  });
});
```

## E2E Permission Tests

### Playwright Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Permission Enforcement', () => {
  test('read-only user cannot edit', async ({ page }) => {
    // Login as read-only user
    await page.goto('/login');
    await page.fill('#email', 'readonly@test.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // Navigate to document
    await page.goto('/corpus/test-corpus/document/test-doc');

    // Try to create annotation
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();

    // Should see read-only message
    await expect(page.locator('text=Document is read-only')).toBeVisible();
  });

  test('editor can modify document', async ({ page }) => {
    // Login as editor
    await loginAsEditor(page);

    // Navigate to document
    await page.goto('/corpus/test-corpus/document/test-doc');

    // Create annotation
    await page.selectText('sample text');

    // Annotation menu should appear
    await expect(page.locator('.annotation-menu')).toBeVisible();

    // Select label
    await page.click('.label-option');

    // Annotation should be created
    await expect(page.locator('.annotation-highlight')).toBeVisible();
  });
});
```

## Testing Utilities

### Custom Matchers

```typescript
// Custom matcher for permission checking
expect.extend({
  toHavePermission(received, permission) {
    const pass = received.includes(permission);
    return {
      pass,
      message: () =>
        `Expected permissions ${received} to ${pass ? 'not ' : ''}include ${permission}`
    };
  }
});

// Usage
expect(permissions).toHavePermission('CAN_UPDATE');
```

### Test Helpers

```typescript
// Helper to set up permission context
export const withPermissions = (permissions: string[], children: React.ReactNode) => {
  const mockValue = {
    permissions,
    setPermissions: jest.fn()
  };

  return (
    <PermissionContext.Provider value={mockValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Usage
render(withPermissions(['CAN_UPDATE'], <MyComponent />));
```

## Common Test Scenarios

### Scenario 1: New Feature Permission Check
```typescript
it('should only show new feature with proper permissions', () => {
  // Test with permission
  render(<Feature permissions={['CAN_CREATE']} />);
  expect(screen.getByText('Create New')).toBeInTheDocument();

  // Test without permission
  render(<Feature permissions={['CAN_READ']} />);
  expect(screen.queryByText('Create New')).not.toBeInTheDocument();
});
```

### Scenario 2: Permission Upgrade
```typescript
it('should handle permission upgrade', async () => {
  const { rerender } = render(<Component permissions={['READ']} />);

  // Initially read-only
  expect(screen.getByText('View Only')).toBeInTheDocument();

  // Upgrade permissions
  rerender(<Component permissions={['READ', 'UPDATE']} />);

  // Now editable
  expect(screen.getByText('Edit')).toBeInTheDocument();
});
```

### Scenario 3: Corpus vs Document Permissions
```typescript
it('should prefer corpus permissions', () => {
  render(
    <Component
      documentPermissions={['READ']}
      corpusPermissions={['CAN_UPDATE']}
    />
  );

  // Should be editable due to corpus permission
  expect(screen.getByText('Edit')).toBeInTheDocument();
});
```

## Debugging Permission Tests

### Console Logging
```typescript
// Add debug logging in tests
console.log('Document permissions:', documentPermissions);
console.log('Corpus permissions:', corpusPermissions);
console.log('Can edit:', canEdit);
```

### React Testing Library Debug
```typescript
import { screen, debug } from '@testing-library/react';

// Debug entire DOM
debug();

// Debug specific element
debug(screen.getByTestId('permission-indicator'));
```

### Mock Verification
```typescript
// Verify mocks are being called
expect(mockQuery).toHaveBeenCalledWith({
  variables: { documentId: '123', corpusId: '456' }
});
```
