import React, { useEffect } from "react";
import {
  MockedProvider,
  MockLink,
  type MockedResponse,
} from "@apollo/client/testing";
import { InMemoryCache, ApolloLink } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { MemoryRouter } from "react-router-dom";
import {
  authStatusVar,
  authToken,
  userObj,
  openedDocument,
  openedCorpus,
  selectedAnalysesIds,
  selectedExtractIds,
  selectedAnnotationIds,
  filterToLabelId,
  filterToLabelsetId,
  filterToCorpus,
  selectedAnalyses,
  selectedMetaAnnotationId,
  showCorpusActionOutputs,
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

interface FilterLayoutTestWrapperProps {
  children: React.ReactNode;
  mocks?: MockedResponse[];
}

export const FilterLayoutTestWrapper: React.FC<
  FilterLayoutTestWrapperProps
> = ({ children, mocks = [] }) => {
  // Create a wildcard link that handles all operations
  const link = createWildcardLink(mocks);

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
    // Initialize filter reactive vars
    filterToLabelId("");
    filterToLabelsetId(null);
    filterToCorpus(null);
    selectedAnalyses([]);
    selectedMetaAnnotationId("");
    showCorpusActionOutputs(true);
  }, []);

  return (
    <MemoryRouter initialEntries={["/test"]}>
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
        {children}
      </MockedProvider>
    </MemoryRouter>
  );
};
