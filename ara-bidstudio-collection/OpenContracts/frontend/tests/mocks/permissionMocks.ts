/**
 * Utility functions for creating consistent permission mocks in tests
 */

// Standard permission strings used in the application
export const PERMISSIONS = {
  READ: "READ",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  PUBLISH: "PUBLISH",
  PERMISSION: "PERMISSION",
  COMMENT: "COMMENT",
} as const;

// Legacy permission format (lowercase with underscores)
export const LEGACY_PERMISSIONS = {
  READ_DOCUMENT: "read_document",
  CREATE_DOCUMENT: "create_document",
  UPDATE_DOCUMENT: "update_document",
  REMOVE_DOCUMENT: "remove_document",
  READ_CORPUS: "read_corpus",
  CREATE_CORPUS: "create_corpus",
  UPDATE_CORPUS: "update_corpus",
  REMOVE_CORPUS: "remove_corpus",
} as const;

// Corpus permission strings (backend format)
export const CORPUS_PERMISSIONS = {
  CAN_READ: "read_corpus",
  CAN_CREATE: "create_corpus",
  CAN_UPDATE: "update_corpus",
  CAN_REMOVE: "remove_corpus",
  CAN_PUBLISH: "publish_corpus",
  CAN_PERMISSION: "permission_corpus",
  CAN_COMMENT: "comment_corpus",
} as const;

/**
 * Creates a document with standard permissions
 */
export const createDocumentWithPermissions = (permissions: string[]) => ({
  id: "RG9jdW1lbnRUeXBlOjE=",
  title: "Test Document",
  fileType: "application/pdf",
  pdfFile: "test.pdf",
  pawlsParseFile: "test.pawls",
  txtExtractFile: null,
  mdSummaryFile: null,
  creator: { id: "user-1", email: "test@test.com" },
  created: "2024-01-01T00:00:00Z",
  myPermissions: permissions,
  allAnnotations: [],
  allStructuralAnnotations: [],
  allRelationships: [],
  allDocRelationships: [],
  allNotes: [],
});

/**
 * Creates a corpus with standard permissions
 */
export const createCorpusWithPermissions = (permissions: string[]) => ({
  id: "Q29ycHVzVHlwZTox",
  title: "Test Corpus",
  description: "Test corpus description",
  myPermissions: permissions,
  creator: { id: "user-1", email: "test@test.com" },
  labelSet: {
    id: "labelset-1",
    title: "Test Label Set",
    allAnnotationLabels: [
      {
        id: "label-1",
        text: "Test Label",
        color: "#0066cc",
        description: "Test annotation label",
        labelType: "SPAN_LABEL",
        icon: "tag",
        readOnly: false,
      },
    ],
  },
});

/**
 * Permission scenarios for testing
 */
export const PERMISSION_SCENARIOS = {
  // User has full permissions
  FULL_ACCESS: {
    document: [
      LEGACY_PERMISSIONS.READ_DOCUMENT,
      LEGACY_PERMISSIONS.CREATE_DOCUMENT,
      LEGACY_PERMISSIONS.UPDATE_DOCUMENT,
      LEGACY_PERMISSIONS.REMOVE_DOCUMENT,
    ],
    corpus: [
      CORPUS_PERMISSIONS.CAN_READ,
      CORPUS_PERMISSIONS.CAN_CREATE,
      CORPUS_PERMISSIONS.CAN_UPDATE,
      CORPUS_PERMISSIONS.CAN_REMOVE,
    ],
  },

  // User can only read
  READ_ONLY: {
    document: [LEGACY_PERMISSIONS.READ_DOCUMENT],
    corpus: [CORPUS_PERMISSIONS.CAN_READ],
  },

  // User can read and update
  READ_UPDATE: {
    document: [
      LEGACY_PERMISSIONS.READ_DOCUMENT,
      LEGACY_PERMISSIONS.UPDATE_DOCUMENT,
    ],
    corpus: [CORPUS_PERMISSIONS.CAN_READ, CORPUS_PERMISSIONS.CAN_UPDATE],
  },

  // Document has update but corpus doesn't
  DOCUMENT_UPDATE_ONLY: {
    document: [
      LEGACY_PERMISSIONS.READ_DOCUMENT,
      LEGACY_PERMISSIONS.UPDATE_DOCUMENT,
    ],
    corpus: [CORPUS_PERMISSIONS.CAN_READ],
  },

  // Corpus has update but document doesn't
  CORPUS_UPDATE_ONLY: {
    document: [LEGACY_PERMISSIONS.READ_DOCUMENT],
    corpus: [CORPUS_PERMISSIONS.CAN_READ, CORPUS_PERMISSIONS.CAN_UPDATE],
  },

  // No permissions at all
  NO_PERMISSIONS: {
    document: [],
    corpus: [],
  },
} as const;

/**
 * Creates GraphQL mocks with specific permission scenarios
 */
export const createPermissionMocks = (
  scenario: keyof typeof PERMISSION_SCENARIOS
) => {
  const permissions = PERMISSION_SCENARIOS[scenario];

  return {
    document: createDocumentWithPermissions(permissions.document),
    corpus: createCorpusWithPermissions(permissions.corpus),
  };
};
