import React, { useEffect } from "react";
import { Provider as JotaiProvider } from "jotai";
import {
  MockedProvider,
  MockedResponse,
  MockLink,
} from "@apollo/client/testing";
import { InMemoryCache, ApolloLink, Observable } from "@apollo/client";
import { MemoryRouter } from "react-router-dom";
import { relayStylePagination } from "@apollo/client/utilities";
import { FloatingExtractsPanel } from "../src/components/knowledge_base/document/FloatingExtractsPanel";
import { ExtractType, ColumnType } from "../src/types/graphql-api";
import {
  authStatusVar,
  authToken,
  userObj,
  openedDocument,
  openedCorpus,
  selectedAnalysesIds,
  selectedExtractIds,
  selectedAnnotationIds,
} from "../src/graphql/cache";
import { mergeArrayByIdFieldPolicy } from "../src/graphql/cache";
import {
  GET_DOCUMENT_ANALYSES_AND_EXTRACTS,
  GET_DATACELLS_FOR_EXTRACT,
  GET_ANNOTATIONS_FOR_ANALYSIS,
} from "../src/graphql/queries";

// Create minimal test cache
const createTestCache = () =>
  new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          annotations: relayStylePagination(),
          userFeedback: relayStylePagination(),
          pageAnnotations: { keyArgs: false, merge: true },
          documents: relayStylePagination(),
          corpuses: relayStylePagination(),
          userexports: relayStylePagination(),
          labelsets: relayStylePagination(),
          annotationLabels: relayStylePagination(),
          relationshipLabels: relayStylePagination(),
          extracts: relayStylePagination(),
          columns: relayStylePagination(),
        },
      },
      DocumentType: { keyFields: ["id"] },
      CorpusType: { keyFields: ["id"] },
      LabelSetType: { keyFields: ["id"] },
      AnnotationType: { keyFields: ["id"] },
      ServerAnnotationType: {
        keyFields: ["id"],
        fields: {
          userFeedback: mergeArrayByIdFieldPolicy,
        },
      },
      UserFeedbackType: { keyFields: ["id"] },
      DatacellType: { keyFields: ["id"] },
      ExtractType: { keyFields: ["id"] },
      AnalysisType: { keyFields: ["id"] },
      PageAwareAnnotationType: {
        fields: {
          pageAnnotations: { keyArgs: false, merge: true },
        },
      },
    },
  });

// Create wildcard link to handle dynamic queries
const createWildcardLink = (mocks: ReadonlyArray<MockedResponse>) => {
  const mockLink = new MockLink(mocks);

  return new ApolloLink((operation) => {
    console.log(`[LINK] Processing operation: ${operation.operationName}`);

    // Handle GET_DOCUMENT_ANALYSES_AND_EXTRACTS
    if (operation.operationName === "DocumentData") {
      console.log(
        "[MOCK HIT] DocumentData - returning empty analyses/extracts"
      );
      return Observable.of({
        data: {
          documentCorpusActions: {
            corpusActions: [],
            extracts: [],
            analysisRows: [],
            __typename: "DocumentCorpusActionsType",
          },
        },
      });
    }

    // Handle GET_DATACELLS_FOR_EXTRACT
    if (operation.operationName === "GetDatacellsForExtract") {
      console.log("[MOCK HIT] GetDatacellsForExtract");
      return Observable.of({
        data: {
          extract: {
            id: operation.variables.extractId,
            datacells: [],
            fieldset: {
              id: "fieldset-1",
              columns: [],
              __typename: "FieldsetType",
            },
            __typename: "ExtractType",
          },
        },
      });
    }

    // Handle GET_ANNOTATIONS_FOR_ANALYSIS
    if (operation.operationName === "GetAnnotationsForAnalysis") {
      console.log("[MOCK HIT] GetAnnotationsForAnalysis");
      return Observable.of({
        data: {
          analysis: {
            id: operation.variables.analysisId,
            annotations: [],
            __typename: "AnalysisType",
          },
        },
      });
    }

    return mockLink.request(operation) as any;
  });
};

interface FloatingExtractsPanelTestWrapperProps {
  visible?: boolean;
  extracts?: ExtractType[];
  onClose?: () => void;
  panelOffset?: number;
  initiallyExpanded?: boolean;
  readOnly?: boolean;
}

// Mock extract data
const createMockExtract = (id: string): ExtractType => ({
  id,
  name: `Test Extract ${id}`,
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  started: new Date().toISOString(),
  finished: new Date().toISOString(),
  isPublic: false,
  error: null,
  creator: {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    __typename: "UserType",
  },
  corpus: {
    id: "corpus-1",
    title: "Test Corpus",
    __typename: "CorpusType",
  },
  __typename: "ExtractType",
});

export const FloatingExtractsPanelTestWrapper: React.FC<
  FloatingExtractsPanelTestWrapperProps
> = ({
  visible = true,
  extracts = [
    createMockExtract("1"),
    createMockExtract("2"),
    createMockExtract("3"),
  ],
  onClose = () => {},
  panelOffset = 0,
  initiallyExpanded = false,
  readOnly = false,
}) => {
  // Default mocks for GraphQL queries
  const defaultMocks: MockedResponse[] = [];

  // Create link with wildcard handling
  const link = createWildcardLink(defaultMocks);

  // Set up authentication for tests - BEFORE any components mount
  authToken("test-auth-token");
  userObj({
    id: "test-user",
    email: "test@example.com",
    username: "testuser",
  });

  // Set reactive vars that CentralRouteManager would normally set
  // Component tests run in isolation, so we set these directly
  useEffect(() => {
    authStatusVar("AUTHENTICATED");
    openedDocument({
      id: "test-document-id",
      slug: "test-document",
      title: "Test Document",
      creator: { id: "test-user", slug: "testuser", username: "testuser" },
    } as any);
    openedCorpus({
      id: "corpus-1",
      slug: "test-corpus",
      title: "Test Corpus",
      creator: { id: "test-user", slug: "testuser", username: "testuser" },
    } as any);
    // Initialize selection arrays
    selectedAnalysesIds([]);
    selectedExtractIds([]);
    selectedAnnotationIds([]);
  }, []);

  return (
    <MemoryRouter initialEntries={["/test"]}>
      <JotaiProvider>
        <MockedProvider
          link={link}
          cache={createTestCache()}
          addTypename
          defaultOptions={{
            watchQuery: { errorPolicy: "all" },
            query: { errorPolicy: "all" },
            mutate: { errorPolicy: "all" },
          }}
        >
          <div
            style={{
              width: "100vw",
              height: "100vh",
              position: "relative",
              background: "#f5f5f5",
            }}
          >
            <FloatingExtractsPanel
              visible={visible}
              extracts={extracts}
              onClose={onClose}
              panelOffset={panelOffset}
              initiallyExpanded={initiallyExpanded}
              readOnly={readOnly}
            />
          </div>
        </MockedProvider>
      </JotaiProvider>
    </MemoryRouter>
  );
};
