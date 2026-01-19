import type { ComplianceItem, Document, DraftSection, EstimationItem, Project, Requirement, Submission, Tender, Tenant, DocChunk } from "./schema";
import { DEFAULT_TENANT } from "./tenant";

// Simple in-memory persistence (replace with LibSQL/Postgres later)
const db = {
  tenants: new Map<string, Tenant>(),
  projects: new Map<string, Project>(),
  tenders: new Map<string, Tender>(),
  documents: new Map<string, Document>(),
  requirements: new Map<string, Requirement>(),
  compliance: new Map<string, ComplianceItem>(),
  estimation: new Map<string, EstimationItem>(),
  drafts: new Map<string, DraftSection>(),
  submissions: new Map<string, Submission>(),
  chunks: new Map<string, DocChunk>(),
};

let idCounter = 1;
const nextId = () => String(idCounter++);

export function ensureTenant(slug?: string): Tenant {
  const s = (slug || DEFAULT_TENANT).toLowerCase();
  for (const t of db.tenants.values()) if (t.slug === s) return t;
  const tenant: Tenant = { id: nextId(), slug: s, name: s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
  db.tenants.set(tenant.id, tenant);
  return tenant;
}

export function createProject(tenantId: string, name: string, description?: string): Project {
  const p: Project = { id: nextId(), tenantId, name, description };
  db.projects.set(p.id, p); return p;
}

export function createTender(tenantId: string, projectId: string, name: string): Tender {
  const t: Tender = { id: nextId(), tenantId, projectId, name, status: "draft" };
  db.tenders.set(t.id, t); return t;
}

export function addDocument(tenantId: string, projectId: string, name: string, mimeType?: string, content?: string): Document {
  const d: Document = { id: nextId(), tenantId, projectId, name, mimeType, content, createdAt: Date.now() };
  db.documents.set(d.id, d); return d;
}

export function listDocumentsByProject(tenantId: string, projectId: string): Document[] {
  return Array.from(db.documents.values()).filter(d => d.tenantId === tenantId && d.projectId === projectId);
}

export function addRequirements(tenantId: string, tenderId: string, reqs: Omit<Requirement, "id"|"tenantId"|"tenderId">[]): Requirement[] {
  const out = reqs.map(r => { const rec: Requirement = { id: nextId(), tenantId, tenderId, ...r }; db.requirements.set(rec.id, rec); return rec; });
  return out;
}

export function addComplianceItems(tenantId: string, tenderId: string, items: Omit<ComplianceItem, "id"|"tenantId"|"tenderId">[]): ComplianceItem[] {
  const out = items.map(it => { const rec: ComplianceItem = { id: nextId(), tenantId, tenderId, ...it }; db.compliance.set(rec.id, rec); return rec; });
  return out;
}

export function addEstimationItems(tenantId: string, tenderId: string, items: Omit<EstimationItem, "id"|"tenantId"|"tenderId">[]): EstimationItem[] {
  const out = items.map(it => { const rec: EstimationItem = { id: nextId(), tenantId, tenderId, ...it }; db.estimation.set(rec.id, rec); return rec; });
  return out;
}

export function upsertDraft(tenantId: string, tenderId: string, section: string, content: string): DraftSection {
  const existing = Array.from(db.drafts.values()).find(d => d.tenantId === tenantId && d.tenderId === tenderId && d.section === section);
  if (existing) { existing.content = content; return existing; }
  const rec: DraftSection = { id: nextId(), tenantId, tenderId, section, content }; db.drafts.set(rec.id, rec); return rec;
}

export function createSubmission(tenantId: string, tenderId: string, files: { name: string; path: string }[]): Submission {
  const rec: Submission = { id: nextId(), tenantId, tenderId, files, createdAt: Date.now() };
  db.submissions.set(rec.id, rec); return rec;
}

export const store = db;

export function addChunks(chunks: Omit<DocChunk, "id">[]): DocChunk[] {
  return chunks.map((c) => {
    const rec: DocChunk = { id: nextId(), ...c } as DocChunk;
    db.chunks.set(rec.id, rec);
    return rec;
  });
}

export function listChunksByTenant(tenantId: string): DocChunk[] {
  return Array.from(db.chunks.values()).filter((c) => c.tenantId === tenantId);
}

export function listChunksByProject(tenantId: string, projectId: string): DocChunk[] {
  return Array.from(db.chunks.values()).filter((c) => c.tenantId === tenantId && c.projectId === projectId);
}
