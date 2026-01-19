import { describe, it, expect, vi } from "vitest";
import {
  buildQueryParams,
  getCorpusUrl,
  getDocumentUrl,
  navigateToCorpus,
  navigateToDocument,
  isCanonicalPath,
  parseRoute,
  parseQueryParam,
  buildCanonicalPath,
  QueryParams,
} from "../navigationUtils";
import { CorpusType, DocumentType } from "../../types/graphql-api";

describe("buildQueryParams()", () => {
  it("should build query string with single annotation", () => {
    const params: QueryParams = { annotationIds: ["123"] };
    expect(buildQueryParams(params)).toBe("?ann=123");
  });

  it("should build query string with multiple annotations", () => {
    const params: QueryParams = { annotationIds: ["123", "456", "789"] };
    // URLSearchParams encodes commas as %2C
    expect(buildQueryParams(params)).toBe("?ann=123%2C456%2C789");
  });

  it("should build query string with single analysis", () => {
    const params: QueryParams = { analysisIds: ["123"] };
    expect(buildQueryParams(params)).toBe("?analysis=123");
  });

  it("should build query string with multiple analyses", () => {
    const params: QueryParams = { analysisIds: ["123", "456"] };
    expect(buildQueryParams(params)).toBe("?analysis=123%2C456");
  });

  it("should build query string with single extract", () => {
    const params: QueryParams = { extractIds: ["456"] };
    expect(buildQueryParams(params)).toBe("?extract=456");
  });

  it("should build query string with multiple extracts", () => {
    const params: QueryParams = { extractIds: ["456", "789"] };
    expect(buildQueryParams(params)).toBe("?extract=456%2C789");
  });

  it("should combine all parameter types", () => {
    const params: QueryParams = {
      annotationIds: ["1", "2"],
      analysisIds: ["3"],
      extractIds: ["4", "5"],
    };
    const result = buildQueryParams(params);
    expect(result).toContain("ann=1%2C2");
    expect(result).toContain("analysis=3");
    expect(result).toContain("extract=4%2C5");
  });

  it("should return empty string for empty params", () => {
    expect(buildQueryParams({})).toBe("");
  });

  it("should return empty string for empty arrays", () => {
    const params: QueryParams = {
      annotationIds: [],
      analysisIds: [],
      extractIds: [],
    };
    expect(buildQueryParams(params)).toBe("");
  });

  it("should ignore undefined params", () => {
    const params: QueryParams = {
      annotationIds: ["123"],
      analysisIds: undefined,
      extractIds: ["456"],
    };
    const result = buildQueryParams(params);
    expect(result).toContain("ann=123");
    expect(result).toContain("extract=456");
    expect(result).not.toContain("analysis");
  });
});

describe("getCorpusUrl()", () => {
  const mockCorpus = {
    id: "corpus-1",
    slug: "my-corpus",
    creator: { id: "user-1", slug: "john" },
  } as CorpusType;

  describe("without query params", () => {
    it("should generate correct corpus URL", () => {
      expect(getCorpusUrl(mockCorpus)).toBe("/c/john/my-corpus");
    });

    it("should return # when corpus slug is missing", () => {
      const invalidCorpus = { ...mockCorpus, slug: "" };
      expect(getCorpusUrl(invalidCorpus as CorpusType)).toBe("#");
    });

    it("should return # when creator slug is missing", () => {
      const invalidCorpus = {
        ...mockCorpus,
        creator: { id: "user-1", slug: "" },
      };
      expect(getCorpusUrl(invalidCorpus as CorpusType)).toBe("#");
    });

    it("should return # when creator is null", () => {
      const invalidCorpus = { ...mockCorpus, creator: null };
      expect(getCorpusUrl(invalidCorpus as unknown as CorpusType)).toBe("#");
    });
  });

  describe("with query params", () => {
    it("should append single analysis param", () => {
      const url = getCorpusUrl(mockCorpus, { analysisIds: ["123"] });
      expect(url).toBe("/c/john/my-corpus?analysis=123");
    });

    it("should append single extract param", () => {
      const url = getCorpusUrl(mockCorpus, { extractIds: ["456"] });
      expect(url).toBe("/c/john/my-corpus?extract=456");
    });

    it("should append multiple params", () => {
      const url = getCorpusUrl(mockCorpus, {
        analysisIds: ["123"],
        extractIds: ["456", "789"],
      });
      expect(url).toContain("/c/john/my-corpus?");
      expect(url).toContain("analysis=123");
      expect(url).toContain("extract=456%2C789");
    });

    it("should return # even with params when slugs missing", () => {
      const invalidCorpus = { ...mockCorpus, slug: "" };
      const url = getCorpusUrl(invalidCorpus as CorpusType, {
        analysisIds: ["123"],
      });
      expect(url).toBe("#");
    });
  });
});

describe("getDocumentUrl()", () => {
  const mockDocument = {
    id: "doc-1",
    slug: "my-document",
    creator: { id: "user-1", slug: "john" },
  } as DocumentType;

  const mockCorpus = {
    id: "corpus-1",
    slug: "my-corpus",
    creator: { id: "user-1", slug: "john" },
  } as CorpusType;

  describe("without corpus context", () => {
    it("should generate standalone document URL", () => {
      expect(getDocumentUrl(mockDocument)).toBe("/d/john/my-document");
    });

    it("should return # when document slug is missing", () => {
      const invalidDoc = { ...mockDocument, slug: "" };
      expect(getDocumentUrl(invalidDoc as DocumentType)).toBe("#");
    });

    it("should return # when creator slug is missing", () => {
      const invalidDoc = {
        ...mockDocument,
        creator: { id: "user-1", slug: "" },
      };
      expect(getDocumentUrl(invalidDoc as DocumentType)).toBe("#");
    });
  });

  describe("with corpus context", () => {
    it("should generate document in corpus URL", () => {
      expect(getDocumentUrl(mockDocument, mockCorpus)).toBe(
        "/d/john/my-corpus/my-document"
      );
    });

    it("should fallback to standalone when corpus slug missing", () => {
      const invalidCorpus = { ...mockCorpus, slug: "" };
      expect(getDocumentUrl(mockDocument, invalidCorpus as CorpusType)).toBe(
        "/d/john/my-document"
      );
    });
  });

  describe("with query params", () => {
    it("should append annotation params to standalone document", () => {
      const url = getDocumentUrl(mockDocument, null, {
        annotationIds: ["123"],
      });
      expect(url).toBe("/d/john/my-document?ann=123");
    });

    it("should append multiple param types to document in corpus", () => {
      const url = getDocumentUrl(mockDocument, mockCorpus, {
        annotationIds: ["1", "2"],
        analysisIds: ["3"],
        extractIds: ["4"],
      });
      expect(url).toContain("/d/john/my-corpus/my-document?");
      expect(url).toContain("ann=1%2C2");
      expect(url).toContain("analysis=3");
      expect(url).toContain("extract=4");
    });

    it("should return # with params when slugs missing", () => {
      const invalidDoc = { ...mockDocument, slug: "" };
      const url = getDocumentUrl(invalidDoc as DocumentType, null, {
        annotationIds: ["123"],
      });
      expect(url).toBe("#");
    });
  });
});

describe("isCanonicalPath()", () => {
  it("should return true for exact matches", () => {
    expect(isCanonicalPath("/c/john/corpus", "/c/john/corpus")).toBe(true);
  });

  it("should ignore trailing slashes", () => {
    expect(isCanonicalPath("/c/john/corpus/", "/c/john/corpus")).toBe(true);
    expect(isCanonicalPath("/c/john/corpus", "/c/john/corpus/")).toBe(true);
  });

  it("should ignore query parameters", () => {
    expect(
      isCanonicalPath("/c/john/corpus?analysis=123", "/c/john/corpus")
    ).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(isCanonicalPath("/c/John/Corpus", "/c/john/corpus")).toBe(true);
  });

  it("should return false for different paths", () => {
    expect(isCanonicalPath("/c/john/corpus1", "/c/john/corpus2")).toBe(false);
  });
});

describe("navigateToCorpus()", () => {
  const mockCorpus = {
    id: "corpus-1",
    slug: "my-corpus",
    creator: { id: "user-1", slug: "john" },
  } as CorpusType;

  it("should call navigate with correct URL", () => {
    const mockNavigate = vi.fn();
    navigateToCorpus(mockCorpus, mockNavigate);
    expect(mockNavigate).toHaveBeenCalledWith("/c/john/my-corpus");
  });

  it("should append query params when provided", () => {
    const mockNavigate = vi.fn();
    navigateToCorpus(mockCorpus, mockNavigate, undefined, {
      analysisIds: ["123"],
      extractIds: ["456"],
    });
    const calledUrl = mockNavigate.mock.calls[0][0];
    expect(calledUrl).toContain("/c/john/my-corpus?");
    expect(calledUrl).toContain("analysis=123");
    expect(calledUrl).toContain("extract=456");
  });

  it("should not navigate when already at destination", () => {
    const mockNavigate = vi.fn();
    const currentPath = "/c/john/my-corpus";
    navigateToCorpus(mockCorpus, mockNavigate, currentPath);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when corpus has no slug", () => {
    const mockNavigate = vi.fn();
    const invalidCorpus = { ...mockCorpus, slug: "" };
    navigateToCorpus(invalidCorpus as CorpusType, mockNavigate);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("navigateToDocument()", () => {
  const mockDocument = {
    id: "doc-1",
    slug: "my-document",
    creator: { id: "user-1", slug: "john" },
  } as DocumentType;

  const mockCorpus = {
    id: "corpus-1",
    slug: "my-corpus",
    creator: { id: "user-1", slug: "john" },
  } as CorpusType;

  it("should navigate to standalone document", () => {
    const mockNavigate = vi.fn();
    navigateToDocument(mockDocument, null, mockNavigate);
    expect(mockNavigate).toHaveBeenCalledWith("/d/john/my-document");
  });

  it("should navigate to document in corpus", () => {
    const mockNavigate = vi.fn();
    navigateToDocument(mockDocument, mockCorpus, mockNavigate);
    expect(mockNavigate).toHaveBeenCalledWith("/d/john/my-corpus/my-document");
  });

  it("should append query params", () => {
    const mockNavigate = vi.fn();
    navigateToDocument(mockDocument, mockCorpus, mockNavigate, undefined, {
      annotationIds: ["1", "2"],
      analysisIds: ["3"],
      extractIds: ["4"],
    });
    const calledUrl = mockNavigate.mock.calls[0][0];
    expect(calledUrl).toContain("/d/john/my-corpus/my-document?");
    expect(calledUrl).toContain("ann=1%2C2");
    expect(calledUrl).toContain("analysis=3");
    expect(calledUrl).toContain("extract=4");
  });

  it("should not navigate when already at destination", () => {
    const mockNavigate = vi.fn();
    const currentPath = "/d/john/my-document";
    navigateToDocument(mockDocument, null, mockNavigate, currentPath);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when document has no slug", () => {
    const mockNavigate = vi.fn();
    const invalidDoc = { ...mockDocument, slug: "" };
    navigateToDocument(invalidDoc as DocumentType, null, mockNavigate);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Real-world URL scenarios", () => {
  const corpus = {
    id: "1",
    slug: "legal-corpus",
    creator: { id: "1", slug: "john-lawyer" },
  } as CorpusType;

  const document = {
    id: "2",
    slug: "contract-2024",
    creator: { id: "1", slug: "john-lawyer" },
  } as DocumentType;

  it("should handle corpus with analysis and extract", () => {
    const url = getCorpusUrl(corpus, {
      analysisIds: ["5678"],
      extractIds: ["9012"],
    });
    expect(url).toBe("/c/john-lawyer/legal-corpus?analysis=5678&extract=9012");
  });

  it("should handle document with all params", () => {
    const url = getDocumentUrl(document, corpus, {
      annotationIds: ["1234", "5678"],
      analysisIds: ["9012"],
      extractIds: ["3456"],
    });
    expect(url).toContain("/d/john-lawyer/legal-corpus/contract-2024?");
    expect(url).toContain("ann=1234%2C5678");
    expect(url).toContain("analysis=9012");
    expect(url).toContain("extract=3456");
  });

  it("should handle standalone document with analysis", () => {
    const url = getDocumentUrl(document, null, {
      analysisIds: ["7890"],
    });
    expect(url).toBe("/d/john-lawyer/contract-2024?analysis=7890");
  });

  it("should preserve params during navigation", () => {
    const mockNavigate = vi.fn();
    navigateToDocument(document, corpus, mockNavigate, undefined, {
      annotationIds: ["123"],
      analysisIds: ["456"],
      extractIds: ["789"],
    });

    const navigatedUrl = mockNavigate.mock.calls[0][0];
    // Single IDs don't get encoded
    expect(navigatedUrl).toContain("ann=123");
    expect(navigatedUrl).toContain("analysis=456");
    expect(navigatedUrl).toContain("extract=789");
  });
});

describe("parseRoute()", () => {
  describe("corpus routes", () => {
    it("should parse corpus route", () => {
      const result = parseRoute("/c/john/my-corpus");
      expect(result).toEqual({
        type: "corpus",
        userIdent: "john",
        corpusIdent: "my-corpus",
      });
    });

    it("should handle corpus route with trailing slash", () => {
      const result = parseRoute("/c/john/my-corpus/");
      expect(result).toEqual({
        type: "corpus",
        userIdent: "john",
        corpusIdent: "my-corpus",
      });
    });
  });

  describe("document routes", () => {
    it("should parse standalone document route", () => {
      const result = parseRoute("/d/john/my-document");
      expect(result).toEqual({
        type: "document",
        userIdent: "john",
        documentIdent: "my-document",
      });
    });

    it("should parse document in corpus route", () => {
      const result = parseRoute("/d/john/my-corpus/my-document");
      expect(result).toEqual({
        type: "document",
        userIdent: "john",
        corpusIdent: "my-corpus",
        documentIdent: "my-document",
      });
    });

    it("should handle document route with trailing slash", () => {
      const result = parseRoute("/d/john/my-corpus/my-document/");
      expect(result).toEqual({
        type: "document",
        userIdent: "john",
        corpusIdent: "my-corpus",
        documentIdent: "my-document",
      });
    });
  });

  describe("browse routes", () => {
    it("should parse annotations route", () => {
      const result = parseRoute("/annotations");
      expect(result).toEqual({
        type: "browse",
        browsePath: "annotations",
      });
    });

    it("should parse extracts route", () => {
      const result = parseRoute("/extracts");
      expect(result).toEqual({
        type: "browse",
        browsePath: "extracts",
      });
    });

    it("should parse corpuses route", () => {
      const result = parseRoute("/corpuses");
      expect(result).toEqual({
        type: "browse",
        browsePath: "corpuses",
      });
    });

    it("should parse documents route", () => {
      const result = parseRoute("/documents");
      expect(result).toEqual({
        type: "browse",
        browsePath: "documents",
      });
    });

    it("should parse label_sets route", () => {
      const result = parseRoute("/label_sets");
      expect(result).toEqual({
        type: "browse",
        browsePath: "label_sets",
      });
    });
  });

  describe("invalid routes", () => {
    it("should return unknown for invalid pattern", () => {
      const result = parseRoute("/invalid/route");
      expect(result).toEqual({ type: "unknown" });
    });

    it("should return unknown for empty path", () => {
      const result = parseRoute("");
      expect(result).toEqual({ type: "unknown" });
    });

    it("should return unknown for root path", () => {
      const result = parseRoute("/");
      expect(result).toEqual({ type: "unknown" });
    });

    it("should return unknown for incomplete corpus route", () => {
      const result = parseRoute("/c/john");
      expect(result).toEqual({ type: "unknown" });
    });

    it("should return unknown for incomplete document route", () => {
      const result = parseRoute("/d/john");
      expect(result).toEqual({ type: "unknown" });
    });
  });
});

describe("parseQueryParam()", () => {
  it("should parse single value", () => {
    expect(parseQueryParam("123")).toEqual(["123"]);
  });

  it("should parse comma-separated values", () => {
    expect(parseQueryParam("123,456,789")).toEqual(["123", "456", "789"]);
  });

  it("should filter empty values", () => {
    expect(parseQueryParam("123,,456,,")).toEqual(["123", "456"]);
  });

  it("should return empty array for null", () => {
    expect(parseQueryParam(null)).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    expect(parseQueryParam("")).toEqual([]);
  });

  it("should handle values with special characters", () => {
    expect(parseQueryParam("abc-123,def_456")).toEqual(["abc-123", "def_456"]);
  });
});

describe("buildCanonicalPath()", () => {
  const mockDocument = {
    id: "doc-1",
    slug: "my-document",
    creator: { id: "user-1", slug: "john" },
  } as DocumentType;

  const mockCorpus = {
    id: "corpus-1",
    slug: "my-corpus",
    creator: { id: "user-1", slug: "john" },
  } as CorpusType;

  it("should build document in corpus path", () => {
    const path = buildCanonicalPath(mockDocument, mockCorpus);
    expect(path).toBe("/d/john/my-corpus/my-document");
  });

  it("should build standalone document path", () => {
    const path = buildCanonicalPath(mockDocument, null);
    expect(path).toBe("/d/john/my-document");
  });

  it("should build standalone document path when corpus missing slug", () => {
    const invalidCorpus = { ...mockCorpus, slug: "" };
    const path = buildCanonicalPath(mockDocument, invalidCorpus as CorpusType);
    expect(path).toBe("/d/john/my-document");
  });

  it("should build corpus-only path", () => {
    const path = buildCanonicalPath(null, mockCorpus);
    expect(path).toBe("/c/john/my-corpus");
  });

  it("should fallback to corpus path when document missing slug", () => {
    const invalidDoc = { ...mockDocument, slug: "" };
    const path = buildCanonicalPath(invalidDoc as DocumentType, mockCorpus);
    expect(path).toBe("/c/john/my-corpus"); // Falls back to corpus if document invalid
  });

  it("should return empty string when document missing creator slug", () => {
    const invalidDoc = {
      ...mockDocument,
      creator: { id: "user-1", slug: "" },
    };
    const path = buildCanonicalPath(invalidDoc as DocumentType, null);
    expect(path).toBe("");
  });

  it("should return empty string when corpus missing slug", () => {
    const invalidCorpus = { ...mockCorpus, slug: "" };
    const path = buildCanonicalPath(null, invalidCorpus as CorpusType);
    expect(path).toBe("");
  });

  it("should return empty string when corpus missing creator slug", () => {
    const invalidCorpus = {
      ...mockCorpus,
      creator: { id: "user-1", slug: "" },
    };
    const path = buildCanonicalPath(null, invalidCorpus as CorpusType);
    expect(path).toBe("");
  });

  it("should return empty string when both entities null", () => {
    const path = buildCanonicalPath(null, null);
    expect(path).toBe("");
  });
});
