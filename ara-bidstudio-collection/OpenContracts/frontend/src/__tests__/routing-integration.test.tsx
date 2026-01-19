/**
 * Integration tests for centralized routing system
 *
 * These tests verify the complete URL ↔ State flow:
 * 1. URL changes → CentralRouteManager → Reactive vars updated
 * 2. User actions → Update reactive vars → URL updated
 * 3. Route components correctly respond to state changes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";
import { CentralRouteManager } from "../routing/CentralRouteManager";
import { DocumentLandingRoute } from "../components/routes/DocumentLandingRoute";
import { CorpusLandingRoute } from "../components/routes/CorpusLandingRoute";
import {
  openedCorpus,
  openedDocument,
  selectedAnnotationIds,
  selectedAnalysesIds,
  selectedExtractIds,
  routeLoading,
  routeError,
  authStatusVar,
} from "../graphql/cache";
import {
  RESOLVE_CORPUS_BY_SLUGS_FULL,
  RESOLVE_DOCUMENT_BY_SLUGS_FULL,
  RESOLVE_DOCUMENT_IN_CORPUS_BY_SLUGS_FULL,
} from "../graphql/queries";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock all view components
vi.mock("../components/knowledge_base", () => ({
  DocumentKnowledgeBase: () => (
    <div data-testid="document-view">Document View</div>
  ),
}));

vi.mock("../views/Corpuses", () => ({
  Corpuses: () => <div data-testid="corpus-view">Corpus View</div>,
}));

vi.mock("../components/seo/MetaTags", () => ({
  MetaTags: () => null,
}));

vi.mock("../components/widgets/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../components/widgets/ModernLoadingDisplay", () => ({
  ModernLoadingDisplay: () => <div>Loading...</div>,
}));

vi.mock("../components/widgets/ModernErrorDisplay", () => ({
  ModernErrorDisplay: ({ error }: any) => (
    <div>Error: {error?.message || error}</div>
  ),
}));

describe("Routing Integration - Full Flow", () => {
  const mockCorpus = {
    id: "corpus-123",
    slug: "my-corpus",
    title: "My Corpus",
    creator: { id: "user-1", slug: "john", email: "john@example.com" },
    analyses: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
  };

  const mockDocument = {
    id: "doc-456",
    slug: "my-document",
    title: "My Document",
    creator: { id: "user-1", slug: "john" },
  };

  beforeEach(() => {
    // Clear all state
    openedCorpus(null);
    openedDocument(null);
    selectedAnnotationIds([]);
    selectedAnalysesIds([]);
    selectedExtractIds([]);
    routeLoading(false);
    routeError(null);
    mockNavigate.mockReset();

    // CRITICAL: Set auth status so CentralRouteManager proceeds with entity fetching
    // Without this, CentralRouteManager waits forever for auth to initialize
    authStatusVar("AUTHENTICATED");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Corpus Route - URL to State to Component", () => {
    it("should flow from URL → CentralRouteManager → Reactive Vars → Component", async () => {
      const mocks = [
        {
          request: {
            query: RESOLVE_CORPUS_BY_SLUGS_FULL,
            variables: {
              userSlug: "john",
              corpusSlug: "my-corpus",
            },
          },
          result: {
            data: {
              corpusBySlugs: mockCorpus,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter
            initialEntries={["/c/john/my-corpus?analysis=123&extract=456"]}
          >
            {/* CentralRouteManager handles URL → State */}
            <CentralRouteManager />

            <Routes>
              {/* Route component just consumes State */}
              <Route
                path="/c/:userIdent/:corpusIdent"
                element={<CorpusLandingRoute />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      );

      // Phase 1: Loading state set
      expect(routeLoading()).toBe(true);

      // Phase 2: Wait for entity resolution
      await waitFor(() => {
        expect(routeLoading()).toBe(false);
      });

      // Phase 3: Verify reactive vars are set
      expect(openedCorpus()).toEqual(mockCorpus);
      expect(selectedAnalysesIds()).toEqual(["123"]);
      expect(selectedExtractIds()).toEqual(["456"]);

      // Phase 4: Verify component rendered with state
      expect(screen.getByTestId("corpus-view")).toBeInTheDocument();
    });
  });

  describe("Document Route - URL to State to Component", () => {
    it("should handle standalone document with query params", async () => {
      const mocks = [
        {
          request: {
            query: RESOLVE_DOCUMENT_BY_SLUGS_FULL,
            variables: {
              userSlug: "john",
              documentSlug: "my-document",
            },
          },
          result: {
            data: {
              documentBySlugs: mockDocument,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter
            initialEntries={["/d/john/my-document?ann=1,2,3&analysis=789"]}
          >
            <CentralRouteManager />

            <Routes>
              <Route
                path="/d/:userIdent/:docIdent"
                element={<DocumentLandingRoute />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(routeLoading()).toBe(false);
      });

      // Verify all state set correctly
      expect(openedDocument()).toEqual(mockDocument);
      expect(openedCorpus()).toBeNull();
      expect(selectedAnnotationIds()).toEqual(["1", "2", "3"]);
      expect(selectedAnalysesIds()).toEqual(["789"]);

      expect(screen.getByTestId("document-view")).toBeInTheDocument();
    });

    it("should handle document in corpus context", async () => {
      const mocks = [
        {
          request: {
            query: RESOLVE_DOCUMENT_IN_CORPUS_BY_SLUGS_FULL,
            variables: {
              userSlug: "john",
              corpusSlug: "my-corpus",
              documentSlug: "my-document",
            },
          },
          result: {
            data: {
              corpusBySlugs: mockCorpus,
              documentInCorpusBySlugs: mockDocument,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter
            initialEntries={["/d/john/my-corpus/my-document?ann=123"]}
          >
            <CentralRouteManager />

            <Routes>
              <Route
                path="/d/:userIdent/:corpusIdent/:docIdent"
                element={<DocumentLandingRoute />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(routeLoading()).toBe(false);
      });

      // Both corpus and document should be set
      expect(openedCorpus()).toEqual(mockCorpus);
      expect(openedDocument()).toEqual(mockDocument);
      expect(selectedAnnotationIds()).toEqual(["123"]);

      expect(screen.getByTestId("document-view")).toBeInTheDocument();
    });
  });

  describe("Browse Routes - Query Params Only", () => {
    it("should set query params without entity fetch", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter
            initialEntries={["/annotations?ann=111,222&analysis=333"]}
          >
            <CentralRouteManager />
          </MemoryRouter>
        </MockedProvider>
      );

      // Should not trigger loading
      expect(routeLoading()).toBe(false);

      // Should set query params
      expect(selectedAnnotationIds()).toEqual(["111", "222"]);
      expect(selectedAnalysesIds()).toEqual(["333"]);

      // Should not set entities
      expect(openedCorpus()).toBeNull();
      expect(openedDocument()).toBeNull();
    });
  });

  describe("State to URL Synchronization", () => {
    it("should update URL when reactive vars change", async () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter initialEntries={["/annotations"]}>
            <CentralRouteManager />
          </MemoryRouter>
        </MockedProvider>
      );

      // Change reactive vars (simulating user action)
      selectedAnnotationIds(["new-1", "new-2"]);
      selectedAnalysesIds(["new-3"]);

      // CentralRouteManager should sync to URL
      await waitFor(() => {
        const calls = mockNavigate.mock.calls;
        const lastCall = calls[calls.length - 1];
        if (lastCall && lastCall[0]?.search) {
          // Comma is URL-encoded as %2C
          expect(lastCall[0].search).toContain("ann=new-1%2Cnew-2");
          expect(lastCall[0].search).toContain("analysis=new-3");
        }
      });
    });
  });

  describe("Error Handling", () => {
    it("should navigate to 404 when entity fetch fails", async () => {
      const mocks = [
        {
          request: {
            query: RESOLVE_CORPUS_BY_SLUGS_FULL,
            variables: {
              userSlug: "john",
              corpusSlug: "not-found",
            },
          },
          error: new Error("Corpus not found"),
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter initialEntries={["/c/john/not-found"]}>
            <CentralRouteManager />

            <Routes>
              <Route
                path="/c/:userIdent/:corpusIdent"
                element={<CorpusLandingRoute />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      );

      // GraphQL errors trigger navigation to /404, not routeError
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/404", { replace: true });
      });
    });
  });

  describe("Navigation Between Routes", () => {
    it("should clear old entity when navigating to browse route", async () => {
      // Set initial corpus state (simulating previous navigation)
      openedCorpus(mockCorpus);

      // Navigate to browse route
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter initialEntries={["/annotations"]}>
            <CentralRouteManager />
          </MemoryRouter>
        </MockedProvider>
      );

      // CentralRouteManager should immediately clear entities on browse routes
      expect(openedCorpus()).toBeNull();
      expect(openedDocument()).toBeNull();
    });
  });
});
