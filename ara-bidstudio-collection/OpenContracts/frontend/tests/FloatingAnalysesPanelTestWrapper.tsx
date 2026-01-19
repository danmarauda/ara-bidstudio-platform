import React, { useEffect } from "react";
import {
  MockedProvider,
  MockLink,
  type MockedResponse,
} from "@apollo/client/testing";
import { InMemoryCache, ApolloLink } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router-dom";
import { FloatingAnalysesPanel } from "../src/components/knowledge_base/document/FloatingAnalysesPanel";
import { AnalysisType } from "../src/types/graphql-api";
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

// Create a minimal test cache configuration
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
      DocumentType: {
        keyFields: ["id"],
      },
      CorpusType: {
        keyFields: ["id"],
      },
      AnnotationType: {
        keyFields: ["id"],
      },
      AnalysisType: {
        keyFields: ["id"],
      },
    },
  });

// Create a wildcard link that handles all GraphQL operations gracefully
const createWildcardLink = (mocks: ReadonlyArray<MockedResponse>) => {
  const defaultMockLink = new MockLink(mocks);
  return new ApolloLink((operation, forward) => {
    // Try the mock link first
    const result = defaultMockLink.request(operation, forward);
    if (result) {
      return result;
    }

    // If no mock found, return empty data to prevent errors
    return ApolloLink.empty();
  });
};

interface FloatingAnalysesPanelTestWrapperProps {
  visible?: boolean;
  analyses?: AnalysisType[];
  onClose?: () => void;
  panelOffset?: number;
  readOnly?: boolean;
}

// Mock analysis data helper (also defined in test file to avoid import issues)
const createMockAnalysis = (
  id: string,
  completed: boolean = true
): AnalysisType => ({
  id,
  analysisName: `Test Analysis ${id}`,
  analysisCompleted: completed,
  analysisStatus: completed ? "COMPLETE" : "PROCESSING",
  analysisStarted: new Date().toISOString(),
  analyzer: {
    id: `analyzer-${id}`,
    description: `Test Analyzer ${id}`,
    taskName: `test_analyzer_${id}`,
    disabled: false,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    creator: {
      id: "user-1",
      email: "test@example.com",
      username: "testuser",
      __typename: "UserType",
    },
    hostGremlin: {
      id: "gremlin-1",
      __typename: "GremlinEngineType_Write",
    } as any,
    __typename: "AnalyzerType",
  },
  annotations: {
    totalCount: Math.floor(Math.random() * 50) + 1,
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
      __typename: "PageInfo",
    },
    __typename: "AnnotationTypeConnection",
  },
  __typename: "AnalysisType",
});

export const FloatingAnalysesPanelTestWrapper: React.FC<
  FloatingAnalysesPanelTestWrapperProps
> = ({
  visible = true,
  analyses = [
    createMockAnalysis("1", true),
    createMockAnalysis("2", true),
    createMockAnalysis("3", false),
  ],
  onClose = () => {},
  panelOffset = 0,
  readOnly = false,
}) => {
  // Create a wildcard link that handles all operations
  const link = createWildcardLink([]);

  // Set up authentication for tests - BEFORE any components mount
  authToken("test-auth-token");
  userObj({
    id: "test-user",
    email: "test@example.com",
    username: "testuser",
  });

  // Initialize reactive vars that the routing system would normally set
  useEffect(() => {
    authStatusVar("AUTHENTICATED");
    openedDocument({
      id: "test-document-id",
      slug: "test-document",
      title: "Test Document",
      creator: { id: "test-user", slug: "testuser", username: "testuser" },
    } as any);
    openedCorpus({
      id: "test-corpus-id",
      slug: "test-corpus",
      title: "Test Corpus",
      creator: { id: "test-user", slug: "testuser", username: "testuser" },
    } as any);
    // Initialize selection arrays to empty
    selectedAnalysesIds([]);
    selectedExtractIds([]);
    selectedAnnotationIds([]);
  }, []);

  return (
    <MemoryRouter initialEntries={["/test"]}>
      <Provider>
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
            <FloatingAnalysesPanel
              visible={visible}
              analyses={analyses}
              onClose={onClose}
              panelOffset={panelOffset}
              readOnly={readOnly}
            />
          </div>
        </MockedProvider>
      </Provider>
    </MemoryRouter>
  );
};
