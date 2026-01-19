// tests/DocumentKnowledgeBase_AnalysisExtract.ct.tsx
/**
 * Integration tests for Analysis and Extract selection flow in DocumentKnowledgeBase
 *
 * These tests verify the interaction between:
 * - FloatingAnalysesPanel / FloatingExtractsPanel
 * - Context bar
 * - Sidebar with Extract/Analysis tabs
 * - URL-based selection state
 * - PDF rendering with annotations
 * - Jumping to annotations from analysis sidebar
 */

import { test, expect } from "@playwright/experimental-ct-react";
import { Page } from "@playwright/test";
import fs from "fs";
import { DocumentKnowledgeBaseTestWrapper } from "./DocumentKnowledgeBaseTestWrapper";
import {
  graphqlMocks,
  PDF_DOC_ID,
  CORPUS_ID,
  mockPdfDocument,
  createAnnotationsForAnalysisMock,
  createDatacellsForExtractMock,
  createDocumentKnowledgeMockWithAnalysisAnnotations,
  createDocumentAnnotationsOnlyMock,
  TEST_PDF_PATH,
  TEST_PAWLS_PATH,
  MOCK_PDF_URL,
  mockAnalysisAnnotation1,
} from "./mocks/DocumentKnowledgeBase.mocks";
import { GET_DOCUMENT_SUMMARY_VERSIONS } from "../src/components/knowledge_base/document/floating_summary_preview/graphql/documentSummaryQueries";

const LONG_TIMEOUT = 60_000;

// Load PAWLS data for PDF rendering
let mockPawlsDataContent: any;
try {
  const rawContent = fs.readFileSync(TEST_PAWLS_PATH, "utf-8");
  mockPawlsDataContent = JSON.parse(rawContent);
  console.log(`[MOCK PREP] Successfully read and parsed ${TEST_PAWLS_PATH}`);
} catch (err) {
  console.error(
    `[MOCK PREP ERROR] Failed to read or parse ${TEST_PAWLS_PATH}:`,
    err
  );
  mockPawlsDataContent = null;
}

// REST mock setup for PDF and PAWLS files
async function registerRestMocks(page: Page): Promise<void> {
  await page.route(`**/${mockPdfDocument.pawlsParseFile}`, (route) => {
    console.log(`[MOCK] PAWLS route triggered for: ${route.request().url()}`);
    if (!mockPawlsDataContent) {
      console.error(`[MOCK ERROR] Mock PAWLS data is null or undefined.`);
      route.fulfill({ status: 500, body: "Mock PAWLS data not loaded" });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPawlsDataContent),
    });
    console.log(
      `[MOCK] Served PAWLS JSON successfully for ${route.request().url()}`
    );
  });

  await page.route(MOCK_PDF_URL, async (route) => {
    console.log(`[MOCK] PDF file request: ${route.request().url()}`);
    if (!fs.existsSync(TEST_PDF_PATH)) {
      console.error(
        `[MOCK ERROR] Test PDF file not found at: ${TEST_PDF_PATH}`
      );
      return route.fulfill({ status: 404, body: "Test PDF not found" });
    }
    const buffer = fs.readFileSync(TEST_PDF_PATH);
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: buffer,
      headers: {
        "Content-Length": String(buffer.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  });

  await page.route(`**/${mockPdfDocument.mdSummaryFile}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/markdown",
      body: "# Mock Summary Title\n\nMock summary details.",
    })
  );
}

// Mock summary versions for document summary testing
const mockSummaryVersions = [
  {
    id: "rev-1",
    version: 1,
    created: "2025-01-24T14:00:00Z",
    snapshot: "# Mock Summary Title\n\nMock summary details.",
    diff: "",
    author: {
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      __typename: "UserType",
    },
    __typename: "DocumentSummaryRevision",
  },
];

const createSummaryMocks = (documentId: string, corpusId: string) => [
  {
    request: {
      query: GET_DOCUMENT_SUMMARY_VERSIONS,
      variables: { documentId, corpusId },
    },
    result: {
      data: {
        document: {
          id: documentId,
          summaryContent: mockSummaryVersions[0].snapshot,
          currentSummaryVersion: 1,
          summaryRevisions: mockSummaryVersions,
          __typename: "DocumentType",
        },
      },
    },
  },
];

// Helper to create complete mock set for extract tests
const createExtractTestMocks = (
  documentId: string,
  corpusId: string,
  extractId: string
) => [
  ...graphqlMocks,
  ...createSummaryMocks(documentId, corpusId),
  createDatacellsForExtractMock(extractId),
];

// Helper to create complete mock set for analysis tests
const createAnalysisTestMocks = (
  documentId: string,
  corpusId: string,
  analysisId: string
) => [
  ...graphqlMocks,
  ...createSummaryMocks(documentId, corpusId),
  createAnnotationsForAnalysisMock(analysisId, documentId),
];

test.use({ viewport: { width: 1280, height: 720 } });
test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await registerRestMocks(page);
});

// ============================================================================
// Integration Tests: Extract Selection Flow
// ============================================================================

test.describe("DocumentKnowledgeBase - Extract Selection Integration", () => {
  test("selecting extract hides FloatingExtractsPanel and shows context bar", async ({
    mount,
    page,
  }) => {
    // Mount with initial URL that selects extract-1
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createExtractTestMocks(PDF_DOC_ID, CORPUS_ID, "extract-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&extract=extract-1`}
      />
    );

    // Wait for document to load
    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    // Wait for routing to settle
    await page.waitForTimeout(1500);

    // Context bar should be visible
    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Context bar should show extract fieldset name
    await expect(contextBar).toContainText("Contract Parties");

    // FloatingExtractsPanel should be hidden (no "Document Extracts" header visible)
    const extractsHeader = page.locator("text=Document Extracts");
    await expect(extractsHeader).not.toBeVisible({ timeout: LONG_TIMEOUT });
  });

  test("selecting extract opens sidebar with Extract tab", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createExtractTestMocks(PDF_DOC_ID, CORPUS_ID, "extract-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&extract=extract-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    // Sidebar should be open
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).toBeVisible({ timeout: LONG_TIMEOUT });

    // Extract tab should be visible
    const extractTab = page.getByTestId("view-mode-extract");
    await expect(extractTab).toBeVisible({ timeout: LONG_TIMEOUT });

    // Extract content should be showing
    await expect(slidingPanel).toContainText("Contract Parties Extract");
    await expect(slidingPanel).toContainText("Data Extract Results");
  });

  test("clearing extract selection hides context bar and closes sidebar", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createExtractTestMocks(PDF_DOC_ID, CORPUS_ID, "extract-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&extract=extract-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    // Context bar should be visible
    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Click clear button
    const clearButton = page.getByTestId("clear-analysis-extract-button");
    await expect(clearButton).toBeVisible({ timeout: LONG_TIMEOUT });
    await clearButton.click();

    // Wait for state to update and navigation to complete
    await page.waitForTimeout(2000);

    // Context bar should be hidden
    await expect(contextBar).not.toBeVisible({ timeout: LONG_TIMEOUT });

    // Sidebar should be closed
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).not.toBeVisible();
  });

  test("context bar shows correct extract stats", async ({ mount, page }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createExtractTestMocks(PDF_DOC_ID, CORPUS_ID, "extract-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&extract=extract-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Should show EXTRACT badge
    await expect(contextBar).toContainText("EXTRACT");

    // Should show total extracts count (we have 2 mocked)
    await expect(contextBar).toContainText("2");

    // Should show extract fieldset name
    await expect(contextBar).toContainText("Contract Parties");
  });
});

// ============================================================================
// Integration Tests: Analysis Selection Flow
// ============================================================================

test.describe("DocumentKnowledgeBase - Analysis Selection Integration", () => {
  test("selecting analysis hides FloatingAnalysesPanel and shows context bar", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createAnalysisTestMocks(PDF_DOC_ID, CORPUS_ID, "analysis-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=analysis-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    // Context bar should be visible
    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Context bar should show analysis description
    await expect(contextBar).toContainText("Entity Recognition Analyzer");

    // FloatingAnalysesPanel should be hidden
    const analysesHeader = page.locator("text=Document Analyses");
    await expect(analysesHeader).not.toBeVisible();
  });

  test("selecting analysis opens sidebar with Analysis tab", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createAnalysisTestMocks(PDF_DOC_ID, CORPUS_ID, "analysis-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=analysis-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    // Sidebar should be open
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).toBeVisible({ timeout: LONG_TIMEOUT });

    // Analysis tab should be visible
    const analysisTab = page.getByTestId("view-mode-analysis");
    await expect(analysisTab).toBeVisible({ timeout: LONG_TIMEOUT });

    // Analysis content should be showing
    await expect(slidingPanel).toContainText("Entity Recognition Analyzer");
    await expect(slidingPanel).toContainText("Analysis Results");
  });

  test("clearing analysis selection hides context bar and closes sidebar", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createAnalysisTestMocks(PDF_DOC_ID, CORPUS_ID, "analysis-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=analysis-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    // Context bar should be visible
    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Click clear button
    const clearButton = page.getByTestId("clear-analysis-extract-button");
    await expect(clearButton).toBeVisible({ timeout: LONG_TIMEOUT });
    await clearButton.click();

    // Wait for state to update and navigation to complete
    await page.waitForTimeout(2000);

    // Context bar should be hidden
    await expect(contextBar).not.toBeVisible({ timeout: LONG_TIMEOUT });

    // Sidebar should be closed
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).not.toBeVisible();
  });

  test("context bar shows correct analysis stats", async ({ mount, page }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createAnalysisTestMocks(PDF_DOC_ID, CORPUS_ID, "analysis-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=analysis-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });

    // Should show ANALYSIS badge
    await expect(contextBar).toContainText("ANALYSIS");

    // Should show total analyses count (we have 2 mocked)
    await expect(contextBar).toContainText("2");

    // Should show analysis description
    await expect(contextBar).toContainText("Entity Recognition Analyzer");
  });

  test("sidebar header renders markdown properly for analysis", async ({
    mount,
    page,
  }) => {
    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={createAnalysisTestMocks(PDF_DOC_ID, CORPUS_ID, "analysis-1")}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=analysis-1`}
      />
    );

    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(1500);

    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).toBeVisible({ timeout: LONG_TIMEOUT });

    // The markdown bold text "**Entity Recognition Analyzer**" should render as bold
    const boldText = slidingPanel.locator("strong, b").first();
    await expect(boldText).toContainText("Entity Recognition Analyzer");

    // Regular text should also be present
    await expect(slidingPanel).toContainText(
      "Identifies and extracts named entities"
    );
  });
});

// ============================================================================
// Integration Tests: PDF Rendering with Analysis Annotations
// ============================================================================

test.describe("DocumentKnowledgeBase - PDF with Analysis Annotations", () => {
  test("loads PDF and renders analysis annotations in document", async ({
    mount,
    page,
  }) => {
    // Create mocks that include both the document with annotations and the analysis data
    const analysisId = "analysis-1";
    const mocks = [
      ...graphqlMocks,
      ...createSummaryMocks(PDF_DOC_ID, CORPUS_ID),
      createAnnotationsForAnalysisMock(analysisId, PDF_DOC_ID),
      createDocumentKnowledgeMockWithAnalysisAnnotations(
        PDF_DOC_ID,
        CORPUS_ID,
        analysisId
      ),
      createDocumentAnnotationsOnlyMock(PDF_DOC_ID, CORPUS_ID, analysisId),
    ];

    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={mocks}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=${analysisId}`}
      />
    );

    // Wait for document title to load
    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log("[TEST] Document title loaded");

    // Wait for PDF to render
    const pdfCanvas = page.locator("#pdf-container canvas").first();
    await expect(pdfCanvas).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log("[TEST] PDF canvas loaded");

    // Wait a bit for annotations to render
    await page.waitForTimeout(2000);

    // Verify analysis annotations are rendered in the document
    // Annotations should have data-annotation-id attributes
    const annotationHighlight = page.locator(
      `[data-annotation-id="${mockAnalysisAnnotation1.id}"]`
    );
    await expect(annotationHighlight).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log("[TEST] Analysis annotation rendered in PDF");

    // Context bar should be visible
    const contextBar = page.locator('[data-testid="context-bar"]');
    await expect(contextBar).toBeVisible({ timeout: LONG_TIMEOUT });
    await expect(contextBar).toContainText("ANALYSIS");

    // Sidebar should be open with Analysis tab
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).toBeVisible({ timeout: LONG_TIMEOUT });

    const analysisTab = page.getByTestId("view-mode-analysis");
    await expect(analysisTab).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log("[TEST] Successfully loaded PDF with analysis annotations");
  });

  test("clicking annotation in analysis sidebar jumps to it in PDF", async ({
    mount,
    page,
  }) => {
    const analysisId = "analysis-1";
    const mocks = [
      ...graphqlMocks,
      ...createSummaryMocks(PDF_DOC_ID, CORPUS_ID),
      createAnnotationsForAnalysisMock(analysisId, PDF_DOC_ID),
      createDocumentKnowledgeMockWithAnalysisAnnotations(
        PDF_DOC_ID,
        CORPUS_ID,
        analysisId
      ),
      createDocumentAnnotationsOnlyMock(PDF_DOC_ID, CORPUS_ID, analysisId),
    ];

    await mount(
      <DocumentKnowledgeBaseTestWrapper
        mocks={mocks}
        documentId={PDF_DOC_ID}
        corpusId={CORPUS_ID}
        initialUrl={`/document/${PDF_DOC_ID}?corpus=${CORPUS_ID}&analysis=${analysisId}`}
      />
    );

    // Wait for document and PDF to load
    await expect(
      page.getByRole("heading", { name: mockPdfDocument.title ?? "" })
    ).toBeVisible({ timeout: LONG_TIMEOUT });

    const pdfCanvas = page.locator("#pdf-container canvas").first();
    await expect(pdfCanvas).toBeVisible({ timeout: LONG_TIMEOUT });

    await page.waitForTimeout(2000);

    // Sidebar should be open with Analysis tab
    const slidingPanel = page.locator("#sliding-panel");
    await expect(slidingPanel).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log("[TEST] Looking for annotation in analysis sidebar");

    // Find the first annotation in the sidebar - it should display the rawText
    // Annotations in the analysis sidebar should show their text content
    const annotationInSidebar = slidingPanel
      .locator("div, button, span")
      .filter({ hasText: mockAnalysisAnnotation1.rawText })
      .first();

    await expect(annotationInSidebar).toBeVisible({ timeout: LONG_TIMEOUT });

    console.log(
      `[TEST] Found annotation "${mockAnalysisAnnotation1.rawText}" in sidebar`
    );

    // Get the PDF container scroll position before clicking
    const pdfContainer = page.locator("#pdf-container");
    const scrollBefore = await pdfContainer.evaluate((el) => el.scrollTop);

    console.log(`[TEST] PDF scroll position before click: ${scrollBefore}`);

    // Click the annotation in the sidebar
    await annotationInSidebar.click();

    // Wait for scroll animation
    await page.waitForTimeout(1000);

    // Verify the annotation highlight is visible in the viewport
    const annotationHighlight = page.locator(
      `[data-annotation-id="${mockAnalysisAnnotation1.id}"]`
    );
    await expect(annotationHighlight).toBeVisible({ timeout: LONG_TIMEOUT });

    // Verify the highlight is actually in the viewport (not just exists)
    const highlightBox = await annotationHighlight.boundingBox();
    const pdfBox = await pdfContainer.boundingBox();

    expect(highlightBox).toBeTruthy();
    expect(pdfBox).toBeTruthy();

    if (highlightBox && pdfBox) {
      // Check that the highlight is within the visible area of the PDF container
      const isInViewport =
        highlightBox.y >= pdfBox.y &&
        highlightBox.y + highlightBox.height <= pdfBox.y + pdfBox.height;

      expect(isInViewport).toBe(true);
      console.log("[TEST] Annotation is visible in viewport after click");
    }

    console.log(
      "[TEST] Successfully jumped to annotation from analysis sidebar"
    );
  });
});
