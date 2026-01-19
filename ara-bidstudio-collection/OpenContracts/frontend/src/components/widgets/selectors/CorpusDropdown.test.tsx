import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { CorpusDropdown } from "./CorpusDropdown";
import { GET_CORPUSES } from "../../../graphql/queries";
import { selectedCorpus } from "../../../graphql/cache";
import { vi } from "vitest";

// Default mocks for initial load
const initialMocks = [
  {
    request: { query: GET_CORPUSES, variables: {} },
    result: {
      data: {
        corpuses: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          edges: [
            {
              node: {
                id: "1",
                slug: "corpus-1",
                icon: null,
                title: "Corpus 1",
                creator: {
                  email: "test@example.com",
                  slug: "test-user",
                },
                description: "Description 1",
                preferredEmbedder: null,
                appliedAnalyzerIds: [],
                isPublic: false,
                is_selected: false,
                is_open: false,
                myPermissions: [],
                parent: null,
                annotations: {
                  totalCount: 0,
                },
                documents: {
                  totalCount: 0,
                  edges: [],
                },
                labelSet: null,
              },
            },
            {
              node: {
                id: "2",
                slug: "corpus-2",
                icon: null,
                title: "Corpus 2",
                creator: {
                  email: "test@example.com",
                  slug: "test-user",
                },
                description: "Description 2",
                preferredEmbedder: null,
                appliedAnalyzerIds: [],
                isPublic: false,
                is_selected: false,
                is_open: false,
                myPermissions: [],
                parent: null,
                annotations: {
                  totalCount: 0,
                },
                documents: {
                  totalCount: 0,
                  edges: [],
                },
                labelSet: null,
              },
            },
          ],
        },
      },
    },
    // No delay for initial load
  },
];

// Mocks for specific search
const searchMocks = [
  {
    request: { query: GET_CORPUSES, variables: {} },
    result: {
      data: {
        corpuses: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          edges: [],
        },
      },
    },
    delay: 10, // initial in search case
  },
  {
    request: { query: GET_CORPUSES, variables: { textSearch: "Corpus 1" } },
    result: {
      data: {
        corpuses: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          edges: [
            {
              node: {
                id: "1",
                slug: "corpus-1",
                icon: null,
                title: "Corpus 1",
                creator: {
                  email: "test@example.com",
                  slug: "test-user",
                },
                description: "Description 1",
                preferredEmbedder: null,
                appliedAnalyzerIds: [],
                isPublic: false,
                is_selected: false,
                is_open: false,
                myPermissions: [],
                parent: null,
                annotations: {
                  totalCount: 0,
                },
                documents: {
                  totalCount: 0,
                  edges: [],
                },
                labelSet: null,
              },
            },
          ],
        },
      },
    },
    delay: 10,
  },
  // Duplicate mock for potential second query with same search term
  {
    request: { query: GET_CORPUSES, variables: { textSearch: "Corpus 1" } },
    result: {
      data: {
        corpuses: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          edges: [
            {
              node: {
                id: "1",
                slug: "corpus-1",
                icon: null,
                title: "Corpus 1",
                creator: {
                  email: "test@example.com",
                  slug: "test-user",
                },
                description: "Description 1",
                preferredEmbedder: null,
                appliedAnalyzerIds: [],
                isPublic: false,
                is_selected: false,
                is_open: false,
                myPermissions: [],
                parent: null,
                annotations: {
                  totalCount: 0,
                },
                documents: {
                  totalCount: 0,
                  edges: [],
                },
                labelSet: null,
              },
            },
          ],
        },
      },
    },
    delay: 10,
  },
];

describe("CorpusDropdown", () => {
  it("renders corpus options and allows selection", async () => {
    render(
      <MockedProvider mocks={initialMocks} addTypename={false}>
        <CorpusDropdown />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(
        screen.queryByText("Error loading corpuses")
      ).not.toBeInTheDocument()
    );
    const dropdownElement = await screen.findByRole("combobox");
    await waitFor(() =>
      expect(dropdownElement).not.toHaveAttribute("aria-busy", "true")
    );

    fireEvent.click(dropdownElement);
    const listbox = await screen.findByRole("listbox");
    expect(await within(listbox).findByText("Corpus 1")).toBeInTheDocument();
    expect(await within(listbox).findByText("Corpus 2")).toBeInTheDocument();

    fireEvent.click(within(listbox).getByText("Corpus 1"));

    await waitFor(() => {
      const selected = selectedCorpus();
      expect(selected).toBeTruthy();
      expect(selected?.id).toBe("1");
      expect(selected?.title).toBe("Corpus 1");
      expect(selected?.description).toBe("Description 1");
      expect(dropdownElement).toHaveTextContent("Corpus 1");
    });
  });

  it("fetches corpuses based on search query", async () => {
    vi.useFakeTimers();
    render(
      <MockedProvider mocks={searchMocks} addTypename={false}>
        <CorpusDropdown />
      </MockedProvider>
    );

    // Advance timers to resolve the initial mock in this test
    vi.advanceTimersByTime(10);

    await waitFor(async () => {
      expect(
        screen.queryByText("Error loading corpuses")
      ).not.toBeInTheDocument();
      const dropdownElement = await screen.findByRole("combobox");
      expect(dropdownElement).not.toHaveAttribute("aria-disabled", "true");
      expect(dropdownElement).not.toHaveAttribute("aria-busy", "true");
      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toBeDisabled();
      fireEvent.change(searchInput, { target: { value: "Corpus 1" } });
    });

    // Advance timers for debounce and mock fetch
    vi.advanceTimersByTime(350);

    await waitFor(() =>
      expect(
        screen.queryByText("Error loading corpuses")
      ).not.toBeInTheDocument()
    );
    const corpus1Option = await screen.findByRole("option", {
      name: /Corpus 1/i,
    });
    expect(corpus1Option).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("combobox")).not.toHaveAttribute(
        "aria-busy",
        "true"
      )
    );
    expect(
      screen.queryByRole("option", { name: /Corpus 2/i })
    ).not.toBeInTheDocument();

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
});
