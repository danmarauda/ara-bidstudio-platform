# Frontend Analyzer Framework

## Overview

This document details how users can trigger new document analyses through the OpenContracts frontend interface. The frontend provides multiple entry points for starting analyses, each with specific UI/UX patterns and permission requirements.

## Ways to Trigger New Analysis for a Document

There are **2 main ways** to trigger a new analysis for a document using the `START_ANALYSIS` GraphQL mutation:

### 1. **Corpus View - "Start New Analysis" Button**

- **Component**: Corpuses view (`/frontend/src/views/Corpuses.tsx`)
- **UI**: Blue "Start New Analysis" button with factory icon
- **Location**: Top action bar when viewing a corpus
- **UX**: Opens a tabbed modal where you can choose between "Analyzer" or "Fieldset" tabs, then select from available analyzers/fieldsets to run on the entire corpus or specific documents

**Permission Requirements:**
- User must be authenticated (`auth_token` exists)
- User must have **both** `CAN_READ` and `CAN_UPDATE` permissions on the corpus
- These permissions are derived from the corpus's `myPermissions` field via the `getPermissions()` transform function

### 2. **Document Viewer - Floating Controls**

- **Component**: FloatingDocumentControls (`/frontend/src/components/knowledge_base/document/FloatingDocumentControls.tsx`)
- **UI**: Green floating action button with Plus icon labeled "Start New Analysis"
- **Location**: Floating controls panel when viewing a document
- **UX**: Same tabbed modal interface as corpus view, but focused on analyzing the current document

**Permission Requirements (`canCreateAnalysis`):**
- User must have **both** `CAN_READ` and `CAN_UPDATE` permissions on the corpus (same as corpus view)
- The component must **not** be in `readOnly` mode (passed as a prop to hide create/edit functionality)

## Permission System Details

### PermissionTypes Enum

The frontend uses a standardized permission system defined in `/frontend/src/components/types.ts`:

```typescript
export enum PermissionTypes {
  CAN_PERMISSION = "CAN_PERMISSION",
  CAN_PUBLISH = "CAN_PUBLISH",
  CAN_COMMENT = "CAN_COMMENT",
  CAN_CREATE = "CAN_CREATE",
  CAN_READ = "CAN_READ",      // Required for analysis
  CAN_UPDATE = "CAN_UPDATE",  // Required for analysis
  CAN_REMOVE = "CAN_REMOVE",
}
```

### Permission Transformation

The `getPermissions()` function in `/frontend/src/utils/transform.tsx` converts Django-style permission strings to frontend `PermissionTypes`:

- `"superuser"` → Grants all permissions including `CAN_READ` and `CAN_UPDATE`
- Permissions containing `"update_"` or `"change_"` → `CAN_UPDATE`
- Permissions containing `"read_"` or `"view_"` → `CAN_READ`

**Real-world Permission Examples:**
- Django permissions like `"change_corpus"`, `"update_corpus"` → `CAN_UPDATE`
- Django permissions like `"view_corpus"`, `"read_corpus"` → `CAN_READ`
- `"superuser"` → All permissions including both required ones

## Modal Components

### 1. SelectAnalyzerOrFieldsetModal

**File**: `/frontend/src/components/widgets/modals/SelectCorpusAnalyzerOrFieldsetAnalyzer.tsx`

**Features:**
- **Tabbed Interface**: Choose between "Analyzer" and "Fieldset" tabs
- **Analyzer Tab**: Dropdown selection from available analyzers with descriptions
- **Fieldset Tab**: Unified fieldset selector with extract naming (for corpus-level operations)
- **Info Boxes**: Shows detailed analyzer/fieldset information when selected
- **Responsive Design**: Modern animated interface with loading states

**Use Cases:**
- Corpus-level analysis (analyze all documents in a corpus)
- Document-level analysis when triggered from document view
- Extract creation using fieldsets

### 2. SelectDocumentAnalyzerModal

**File**: `/frontend/src/components/knowledge_base/document/SelectDocumentAnalyzerModal.tsx`

**Features:**
- **Advanced Grid Layout**: Visual cards showing analyzer details
- **Search & Filter**: Real-time search by analyzer name, description, or title
- **Configurability Indicators**: Visual indicators showing which analyzers support custom inputs
- **Two-Stage Process**:
  1. **Selection Stage**: Choose analyzer from searchable grid
  2. **Configuration Stage**: JSON schema-based form for analyzers supporting custom inputs
- **Rich UI Elements**:
  - Analyzer path display with monospace formatting
  - Markdown description rendering
  - Animated transitions and hover effects
  - Configuration badges ("Configurable" vs "Ready to Run")

**Advanced Configuration Support:**
- **JSON Schema Forms**: Uses React JSON Schema Form (RJSF) for dynamic configuration
- **Schema Validation**: Built-in validation using AJV8
- **Custom Input Data**: Supports passing `analysisInputData` to analyzers
- **Responsive Layout**: Adapts to different screen sizes with scrollable content

## GraphQL Mutations

### Primary Mutations Used:

1. **`START_ANALYSIS`** (`/frontend/src/graphql/mutations.ts:1787`)
   - **Purpose**: Main mutation for starting document analysis
   - **Parameters**:
     - `documentId` (optional): ID of document to analyze
     - `analyzerId` (required): ID of analyzer to use
     - `corpusId` (optional): ID of corpus context
     - `analysisInputData` (optional): Custom configuration data matching analyzer's JSON schema

2. **`START_DOCUMENT_EXTRACT`**
   - **Purpose**: For fieldset-based extraction on individual documents
   - **Use**: Document-level data extraction operations

3. **`REQUEST_CREATE_EXTRACT`** + **`REQUEST_START_EXTRACT`**
   - **Purpose**: For corpus-level extract operations
   - **Use**: Creating and starting extracts across entire corpus

### Example Usage:

```typescript
const [startDocumentAnalysis] = useMutation<StartAnalysisOutput, StartAnalysisInput>(START_ANALYSIS);

const handleStartAnalysis = async () => {
  const result = await startDocumentAnalysis({
    variables: {
      documentId: "doc-123",
      analyzerId: "analyzer-456",
      corpusId: "corpus-789",
      analysisInputData: { customParam: "value" }
    },
  });
};
```

## User Experience Flow

### Standard Analysis Flow:

1. **Entry Point**: User clicks "Start New Analysis" button (corpus view) or Plus button (document view)
2. **Modal Selection**: `SelectAnalyzerOrFieldsetModal` opens with tabbed interface
3. **Analyzer Choice**: User selects analyzer from dropdown with descriptions
4. **Configuration** (if supported): Advanced analyzers may redirect to `SelectDocumentAnalyzerModal` for custom configuration
5. **Execution**: GraphQL mutation fired with appropriate parameters
6. **Feedback**: Toast notifications confirm success/failure
7. **Navigation**: Modal closes and analysis begins processing

### Advanced Configuration Flow:

1. **Analyzer Selection**: User chooses configurable analyzer (indicated by "Configurable" badge)
2. **Configuration Screen**: Two-panel layout showing selected analyzer info and configuration form
3. **Schema-based Form**: Dynamic form generated from analyzer's `inputSchema`
4. **Validation**: Real-time validation of user inputs
5. **Execution**: Custom configuration passed as `analysisInputData` to mutation

## Technical Implementation Notes

### State Management:
- Uses Apollo Client reactive variables for modal visibility
- `showSelectCorpusAnalyzerOrFieldsetModal(true/false)` controls modal state
- Component state manages selected analyzers and configuration data

### Permission Checking:
- Real-time permission validation before showing UI elements
- Graceful degradation when permissions insufficient
- Read-only mode support for view-only scenarios

### Error Handling:
- Toast notifications for user feedback
- Validation errors displayed inline in forms
- Network error handling with retry mechanisms

### Performance Considerations:
- Lazy loading of analyzer data
- Debounced search in advanced modal
- Efficient re-renders with proper React patterns

## Security Considerations

- **Authentication Required**: All analysis operations require valid auth token
- **Permission Validation**: Both frontend and backend validate user permissions
- **Input Sanitization**: JSON schema validation prevents malicious inputs
- **Access Control**: Users can only analyze documents/corpuses they have access to

This frontend framework provides a comprehensive, user-friendly interface for triggering document analyses while maintaining security and providing rich configuration options for advanced use cases.
