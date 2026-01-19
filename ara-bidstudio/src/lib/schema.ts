export type Tenant = { id: string; slug: string; name: string };
export type Project = { id: string; tenantId: string; name: string; description?: string };
export type Tender = { id: string; tenantId: string; projectId: string; name: string; status: "draft"|"active"|"submitted" };

export type Document = { id: string; tenantId: string; projectId: string; name: string; mimeType?: string; content?: string; createdAt: number };
export type Requirement = { id: string; tenantId: string; tenderId: string; text: string; category?: string };
export type ComplianceItem = { id: string; tenantId: string; tenderId: string; requirementId: string; status: "meets"|"partial"|"gap"; note?: string };
export type EstimationItem = { id: string; tenantId: string; tenderId: string; name: string; cost: number };
export type DraftSection = { id: string; tenantId: string; tenderId: string; section: string; content: string };
export type Submission = { id: string; tenantId: string; tenderId: string; files: { name: string; path: string }[]; createdAt: number };

export type DocChunk = {
  id: string;
  tenantId: string;
  projectId: string;
  documentId: string;
  index: number;
  text: string;
  embedding?: number[];
};
