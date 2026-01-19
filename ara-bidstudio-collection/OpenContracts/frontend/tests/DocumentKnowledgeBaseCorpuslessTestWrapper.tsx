import React from "react";
import {
  MockedProvider,
  MockLink,
  type MockedResponse,
} from "@apollo/client/testing";
import { InMemoryCache, ApolloLink, Observable } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { mergeArrayByIdFieldPolicy } from "../src/graphql/cache";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router-dom";
import DocumentKnowledgeBase from "../src/components/knowledge_base/document/DocumentKnowledgeBase";
import {
  authStatusVar,
  authToken,
  userObj,
  openedDocument,
  openedCorpus,
} from "../src/graphql/cache";
import { GET_DOCUMENT_ANNOTATIONS_ONLY } from "../src/graphql/queries";

// Create test cache
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
      LabelSetType: {
        keyFields: ["id"],
      },
      AnnotationType: {
        keyFields: ["id"],
      },
      ServerAnnotationType: {
        keyFields: ["id"],
        fields: {
          userFeedback: mergeArrayByIdFieldPolicy,
        },
      },
      UserFeedbackType: {
        keyFields: ["id"],
      },
      DatacellType: {
        keyFields: ["id"],
      },
      PageAwareAnnotationType: {
        fields: {
          pageAnnotations: { keyArgs: false, merge: true },
        },
      },
    },
  });

interface WrapperProps {
  mocks: ReadonlyArray<MockedResponse>;
  documentId: string;
  corpusId?: string; // Optional for corpus-less testing
  readOnly?: boolean;
  showSuccessMessage?: string;
  showCorpusInfo?: boolean;
}

export const DocumentKnowledgeBaseCorpuslessTestWrapper: React.FC<
  WrapperProps
> = ({
  mocks,
  documentId,
  corpusId,
  readOnly = false,
  showSuccessMessage,
  showCorpusInfo,
}) => {
  // Component tests set reactive vars directly (pragmatic exception to The ONE PLACE TO RULE THEM ALL)
  React.useEffect(() => {
    authStatusVar("AUTHENTICATED");
    authToken("mock-token");
    userObj({
      id: "user-123",
      email: "test@example.com",
      permissions: ["read", "write"],
    });

    // Set document reactive var
    openedDocument({
      id: documentId,
      slug: "test-document",
      title: "Test Document",
      creator: { id: "user-123", slug: "testuser", username: "testuser" },
    } as any);

    // Set corpus reactive var if provided
    if (corpusId) {
      openedCorpus({
        id: corpusId,
        slug: "test-corpus",
        title: "Test Corpus",
        creator: { id: "user-123", slug: "testuser", username: "testuser" },
      } as any);
    } else {
      openedCorpus(null);
    }
  }, [documentId, corpusId]);

  // Add default annotations mock
  const defaultAnnotationsMock = {
    request: {
      query: GET_DOCUMENT_ANNOTATIONS_ONLY,
      variables: {
        documentId,
        corpusId: corpusId || null,
        analysisId: null,
      },
    },
    result: {
      data: {
        document: {
          id: documentId,
          allStructuralAnnotations: [],
          allAnnotations: [],
          allRelationships: [],
        },
      },
    },
  };

  const allMocks = [...mocks, defaultAnnotationsMock];

  // Create custom link that handles requests
  const link = new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const { operationName } = operation;
      console.log(`[GraphQL Request] ${operationName}`, operation.variables);

      // Find matching mock
      const mock = allMocks.find((m) => {
        const mockDef = m.request.query.definitions[0] as any;
        return mockDef.name?.value === operationName;
      });

      if (mock) {
        setTimeout(() => {
          if (mock.error) {
            console.log(`[GraphQL Error] ${operationName}`, mock.error);
            observer.error(mock.error);
          } else {
            console.log(`[GraphQL Response] ${operationName}`, mock.result);
            observer.next(mock.result as any);
            observer.complete();
          }
        }, 10);
      } else {
        console.error(`[GraphQL] No mock found for ${operationName}`);
        observer.error(new Error(`No mock for ${operationName}`));
      }
    });
  });

  return (
    <MemoryRouter>
      <MockedProvider
        mocks={allMocks}
        cache={createTestCache()}
        link={link}
        addTypename={false}
      >
        <Provider>
          <DocumentKnowledgeBase
            documentId={documentId}
            corpusId={corpusId}
            readOnly={readOnly}
            showSuccessMessage={showSuccessMessage}
            showCorpusInfo={showCorpusInfo}
          />
        </Provider>
      </MockedProvider>
    </MemoryRouter>
  );
};
