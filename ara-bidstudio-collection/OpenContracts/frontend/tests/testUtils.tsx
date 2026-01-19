import { useEffect } from "react";
import { MockLink, type MockedResponse } from "@apollo/client/testing";
import { InMemoryCache, ApolloLink, Observable } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { OperationDefinitionNode } from "graphql";
import {
  mergeArrayByIdFieldPolicy,
  authStatusVar,
  authToken,
  userObj,
  openedDocument,
  openedCorpus,
  selectedAnalysesIds,
  selectedExtractIds,
  selectedAnnotationIds,
  type AuthStatus,
} from "../src/graphql/cache";
import { DocumentType, CorpusType } from "../src/types/graphql-api";

/**
 * Hook to initialize Apollo reactive vars for component tests.
 *
 * The new routing system centralizes state in Apollo reactive vars managed by
 * CentralRouteManager. Component tests run in isolation without the route manager,
 * so we need to initialize these vars manually.
 *
 * @param options Configuration options for test setup
 * @param options.documentId Optional document ID to set as openedDocument
 * @param options.corpusId Optional corpus ID to set as openedCorpus
 * @param options.authStatus Authentication status (default: "AUTHENTICATED")
 * @param options.token Auth token (default: "test-auth-token")
 *
 * @example
 * ```tsx
 * const TestWrapper = () => {
 *   useTestSetup({
 *     documentId: "doc-123",
 *     corpusId: "corpus-456"
 *   });
 *   return <YourComponent />;
 * };
 * ```
 */
export const useTestSetup = (options?: {
  documentId?: string;
  corpusId?: string;
  authStatus?: AuthStatus;
  token?: string;
}) => {
  const {
    documentId,
    corpusId,
    authStatus = "AUTHENTICATED",
    token = "test-auth-token",
  } = options || {};

  useEffect(() => {
    // Set authentication state
    authStatusVar(authStatus);
    authToken(token);
    userObj({
      id: "test-user",
      email: "test@example.com",
      username: "testuser",
    });

    // Set document if provided
    if (documentId) {
      openedDocument({
        id: documentId,
        slug: "test-document",
        title: "Test Document",
        creator: { id: "test-user", slug: "testuser", username: "testuser" },
      } as DocumentType);
    } else {
      openedDocument(null);
    }

    // Set corpus if provided
    if (corpusId) {
      openedCorpus({
        id: corpusId,
        slug: "test-corpus",
        title: "Test Corpus",
        creator: { id: "test-user", slug: "testuser", username: "testuser" },
      } as CorpusType);
    } else {
      openedCorpus(null);
    }

    // Initialize URL-driven state vars as empty arrays
    // (these are normally controlled by URL query params like ?analysis=123&extract=456)
    selectedAnalysesIds([]);
    selectedExtractIds([]);
    selectedAnnotationIds([]);
  }, [documentId, corpusId, authStatus, token]);
};

/**
 * Creates an Apollo Link that handles unmocked GraphQL queries gracefully.
 *
 * This link intercepts specific operations (like AddAnnotation mutations) and
 * provides wildcard responses, preventing test failures when exact mocks aren't provided.
 * Falls back to MockLink for all other operations.
 *
 * @param mocks Array of GraphQL mock responses
 * @returns ApolloLink that handles both mocked and wildcard operations
 *
 * @example
 * ```tsx
 * const link = createWildcardLink([
 *   {
 *     request: { query: GET_DOCUMENT, variables: { id: "123" } },
 *     result: { data: { document: {...} } }
 *   }
 * ]);
 *
 * <MockedProvider link={link} cache={createTestCache()}>
 *   <YourComponent />
 * </MockedProvider>
 * ```
 */
export const createWildcardLink = (mocks: ReadonlyArray<MockedResponse>) => {
  const defaultMockLink = new MockLink(mocks);

  return new ApolloLink((operation) => {
    // Look for mutation operations
    const opDocument = operation.query.definitions.find(
      (def) =>
        def.kind === "OperationDefinition" && def.operation === "mutation"
    ) as OperationDefinitionNode | undefined;

    // Log operations for debugging
    console.log(
      `[LINK DEBUG] Processing operation: ${operation.operationName}`
    );

    // Check if it's an AddAnnotation mutation
    const isAddAnnotationMutation =
      operation.operationName === "AddAnnotation" ||
      (opDocument?.selectionSet?.selections.some(
        (selection) =>
          selection.kind === "Field" && selection.name.value === "addAnnotation"
      ) ??
        false);

    if (isAddAnnotationMutation) {
      console.log(
        `[MOCK HIT] Intercepted addAnnotation mutation - returning wildcard response`
      );
      const vars = operation.variables;

      return Observable.of({
        data: {
          addAnnotation: {
            __typename: "AddAnnotationPayload",
            ok: true,
            annotation: {
              __typename: "AnnotationType",
              id: `new-annotation-${Date.now()}`,
              page: vars.page,
              rawText: (vars.rawText?.substring(0, 50) ?? "") + "...",
              bounds: {
                __typename: "BoundingBoxType",
                left: 100,
                top: 100,
                right: 200,
                bottom: 200,
                page: vars.page,
              },
              json: vars.json,
              isPublic: false,
              approved: false,
              rejected: false,
              structural: false,
              annotation_created: new Date().toISOString(),
              annotationType: vars.annotationType,
              myPermissions: ["permission.can_update", "permission.can_read"],
              annotationLabel: {
                __typename: "AnnotationLabelType",
                id: vars.annotationLabelId,
                icon: null,
                description: "Test annotation label",
                color: "#FF0000",
                text: "Test Label",
                labelType: "TOKEN_LABEL",
              },
              sourceNodeInRelationships: {
                __typename: "RelationshipTypeConnection",
                edges: [],
              },
              creator: {
                __typename: "UserType",
                id: "test-user",
                email: "test@example.com",
              },
            },
          },
        },
      });
    }

    // Delegate all other operations to the default MockLink
    return defaultMockLink.request(operation) as any;
  });
};

/**
 * Creates a minimal Apollo InMemoryCache configuration for component tests.
 *
 * This cache includes essential type policies for core GraphQL types but avoids
 * complex read functions that rely on external reactive variables. It's designed
 * to work in isolated component tests without the full routing system.
 *
 * Key features:
 * - Relay-style pagination for all paginated queries
 * - Proper keyFields for entity normalization
 * - Simplified merge strategies for nested fields
 * - No reactive var dependencies in read functions
 *
 * @returns InMemoryCache instance configured for testing
 *
 * @example
 * ```tsx
 * <MockedProvider cache={createTestCache()} mocks={[...]}>
 *   <YourComponent />
 * </MockedProvider>
 * ```
 */
export const createTestCache = () =>
  new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Use simple pagination for all paginated queries
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
      // Define keyFields for core types (no read functions to avoid reactive var dependencies)
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
          // Keep merge policy for nested userFeedback
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
