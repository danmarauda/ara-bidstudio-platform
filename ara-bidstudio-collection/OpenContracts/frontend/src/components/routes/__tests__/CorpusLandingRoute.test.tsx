import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CorpusLandingRoute } from "../CorpusLandingRoute";
import { openedCorpus, routeLoading, routeError } from "../../../graphql/cache";

// Mock the Corpuses view component
vi.mock("../../../views/Corpuses", () => ({
  Corpuses: () => <div>Corpuses Component</div>,
}));

// Mock MetaTags
vi.mock("../../seo/MetaTags", () => ({
  MetaTags: () => null,
}));

// Mock ErrorBoundary
vi.mock("../../widgets/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

// Mock loading/error displays
vi.mock("../../widgets/ModernLoadingDisplay", () => ({
  ModernLoadingDisplay: () => <div>Loading...</div>,
}));

vi.mock("../../widgets/ModernErrorDisplay", () => ({
  ModernErrorDisplay: ({ error }: any) => (
    <div>Error: {error?.message || error}</div>
  ),
}));

/**
 * CorpusLandingRoute tests
 *
 * Note: This component is now a DUMB CONSUMER that reads state from reactive vars.
 * CentralRouteManager is responsible for setting these vars based on the URL.
 * These tests verify that the component correctly responds to different state combinations.
 */
describe("CorpusLandingRoute - State-Driven Rendering", () => {
  const mockCorpus = {
    id: "corpus-123",
    slug: "test-corpus",
    title: "Test Corpus",
    description: "Test description",
    creator: {
      id: "user-1",
      slug: "john",
      username: "john",
      email: "john@example.com",
    },
    isPublic: true,
    myPermissions: ["read_corpus"],
    analyses: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
  };

  beforeEach(() => {
    // Clear reactive variables before each test
    openedCorpus(null);
    routeLoading(false);
    routeError(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading display when routeLoading is true", () => {
      routeLoading(true);

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error display when routeError is set", () => {
      routeError(new Error("Failed to load corpus"));

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    it("should show Corpuses list when corpus is null (no error)", () => {
      routeLoading(false);
      openedCorpus(null);
      // No routeError set - this is the normal state for browsing corpus list

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      // When corpus is null without error, show corpus list view
      expect(screen.getByText("Corpuses Component")).toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    it("should render Corpuses view when corpus is loaded", () => {
      routeLoading(false);
      openedCorpus(mockCorpus as any);

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      expect(screen.getByText("Corpuses Component")).toBeInTheDocument();
    });

    it("should pass corpus data to view component", () => {
      routeLoading(false);
      openedCorpus(mockCorpus as any);

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      // Component renders with corpus data available in reactive var
      expect(screen.getByText("Corpuses Component")).toBeInTheDocument();
      expect(openedCorpus()).toEqual(mockCorpus);
    });
  });

  describe("Reactive State Updates", () => {
    it("should re-render when corpus changes", () => {
      routeLoading(false);
      openedCorpus(mockCorpus as any);

      const { rerender } = render(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      expect(screen.getByText("Corpuses Component")).toBeInTheDocument();

      // Change corpus
      const newCorpus = {
        ...mockCorpus,
        id: "corpus-456",
        title: "New Corpus",
      };
      openedCorpus(newCorpus as any);

      rerender(
        <MockedProvider mocks={[]} addTypename={false}>
          <MemoryRouter>
            <CorpusLandingRoute />
          </MemoryRouter>
        </MockedProvider>
      );

      // Should still render with new corpus
      expect(screen.getByText("Corpuses Component")).toBeInTheDocument();
      expect(openedCorpus()).toEqual(newCorpus);
    });
  });
});
