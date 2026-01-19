import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { openedCorpus, openedDocument } from "../graphql/cache";
import { CorpusBreadcrumbs } from "../components/corpuses/CorpusBreadcrumbs";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  } as any;
});

const mockNavigate = vi.fn();

beforeEach(() => {
  mockNavigate.mockReset();
  openedCorpus({ id: "c1", title: "Test" } as any);
  openedDocument({ id: "d1", description: "Doc" } as any);
});

describe("CorpusBreadcrumbs", () => {
  it("navigates to /corpuses on root click (CentralRouteManager will clear state)", () => {
    const { getByText } = render(
      <MemoryRouter>
        <CorpusBreadcrumbs />
      </MemoryRouter>
    );

    const corpusesLink = getByText("Corpuses");
    fireEvent.click(corpusesLink);

    // PURE TEST: Component's responsibility is to navigate
    expect(mockNavigate).toHaveBeenCalledWith("/corpuses");

    // NOTE: We do NOT test that openedCorpus/openedDocument are cleared
    // That's CentralRouteManager Phase 1's job when it detects the route change
    // Only CentralRouteManager is allowed to set URL-driven reactive vars
  });
});
