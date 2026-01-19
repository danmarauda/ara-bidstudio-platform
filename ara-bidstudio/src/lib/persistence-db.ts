import { getDb, ensureSchema } from "./db";
import type { ComplianceItem, Document, DraftSection, EstimationItem, Project, Requirement, Submission, Tender, Tenant, DocChunk } from "./schema";

let idCounter = 100000; // separate namespace from memory store
const nextId = () => String(idCounter++);

export async function dbEnsureTenant(slug: string, name?: string): Promise<Tenant> {
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  await ensureSchema();
  const found = await db.execute({ sql: `SELECT * FROM tenants WHERE slug = ?`, args: [slug] });
  if (found.rows.length) return found.rows[0] as unknown as Tenant;
  const tenant: Tenant = { id: nextId(), slug, name: name || slug };
  await db.execute({ sql: `INSERT INTO tenants (id, slug, name) VALUES (?, ?, ?)`, args: [tenant.id, tenant.slug, tenant.name] });
  return tenant;
}

export async function dbCreateProject(tenantId: string, name: string, description?: string): Promise<Project> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const p: Project = { id: nextId(), tenantId, name, description };
  await db.execute({ sql: `INSERT INTO projects (id, tenantId, name, description) VALUES (?,?,?,?)`, args: [p.id, p.tenantId, p.name, p.description || null] });
  return p;
}

export async function dbCreateTender(tenantId: string, projectId: string, name: string): Promise<Tender> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const t: Tender = { id: nextId(), tenantId, projectId, name, status: "draft" };
  await db.execute({ sql: `INSERT INTO tenders (id, tenantId, projectId, name, status) VALUES (?,?,?,?,?)`, args: [t.id, t.tenantId, t.projectId, t.name, t.status] });
  return t;
}

export async function dbAddDocument(tenantId: string, projectId: string, name: string, mimeType?: string, content?: string): Promise<Document> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const d: Document = { id: nextId(), tenantId, projectId, name, mimeType, content, createdAt: Date.now() };
  await db.execute({ sql: `INSERT INTO documents (id, tenantId, projectId, name, mimeType, content, createdAt) VALUES (?,?,?,?,?,?,?)`, args: [d.id, d.tenantId, d.projectId, d.name, d.mimeType || null, d.content || null, d.createdAt] });
  return d;
}

export async function dbListDocumentsByProject(tenantId: string, projectId: string): Promise<Document[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const rs = await db.execute({ sql: `SELECT * FROM documents WHERE tenantId = ? AND projectId = ? ORDER BY createdAt DESC`, args: [tenantId, projectId] });
  return rs.rows as unknown as Document[];
}

export async function dbAddRequirements(tenantId: string, tenderId: string, reqs: Omit<Requirement, "id"|"tenantId"|"tenderId">[]): Promise<Requirement[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const out: Requirement[] = [];
  for (const r of reqs) {
    const rec: Requirement = { id: nextId(), tenantId, tenderId, ...r } as Requirement;
    await db.execute({ sql: `INSERT INTO requirements (id, tenantId, tenderId, text, category) VALUES (?,?,?,?,?)`, args: [rec.id, rec.tenantId, rec.tenderId, rec.text, rec.category || null] });
    out.push(rec);
  }
  return out;
}

export async function dbAddComplianceItems(tenantId: string, tenderId: string, items: Omit<ComplianceItem, "id"|"tenantId"|"tenderId">[]): Promise<ComplianceItem[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const out: ComplianceItem[] = [];
  for (const it of items) {
    const rec: ComplianceItem = { id: nextId(), tenantId, tenderId, ...it } as ComplianceItem;
    await db.execute({ sql: `INSERT INTO compliance (id, tenantId, tenderId, requirementId, status, note) VALUES (?,?,?,?,?,?)`, args: [rec.id, rec.tenantId, rec.tenderId, rec.requirementId, rec.status, rec.note || null] });
    out.push(rec);
  }
  return out;
}

export async function dbAddEstimationItems(tenantId: string, tenderId: string, items: Omit<EstimationItem, "id"|"tenantId"|"tenderId">[]): Promise<EstimationItem[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const out: EstimationItem[] = [];
  for (const it of items) {
    const rec: EstimationItem = { id: nextId(), tenantId, tenderId, ...it } as EstimationItem;
    await db.execute({ sql: `INSERT INTO estimation (id, tenantId, tenderId, name, cost) VALUES (?,?,?,?,?)`, args: [rec.id, rec.tenantId, rec.tenderId, rec.name, rec.cost] });
    out.push(rec);
  }
  return out;
}

export async function dbUpsertDraft(tenantId: string, tenderId: string, section: string, content: string): Promise<DraftSection> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  // naive upsert by delete+insert
  const existing = await db.execute({ sql: `SELECT * FROM drafts WHERE tenantId = ? AND tenderId = ? AND section = ?`, args: [tenantId, tenderId, section] });
  if (existing.rows.length) {
    await db.execute({ sql: `DELETE FROM drafts WHERE tenantId = ? AND tenderId = ? AND section = ?`, args: [tenantId, tenderId, section] });
  }
  const rec: DraftSection = { id: nextId(), tenantId, tenderId, section, content };
  await db.execute({ sql: `INSERT INTO drafts (id, tenantId, tenderId, section, content) VALUES (?,?,?,?,?)`, args: [rec.id, rec.tenantId, rec.tenderId, rec.section, rec.content] });
  return rec;
}

export async function dbCreateSubmission(tenantId: string, tenderId: string, files: { name: string; path: string }[]): Promise<Submission> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const rec: Submission = { id: nextId(), tenantId, tenderId, files, createdAt: Date.now() };
  await db.execute({ sql: `INSERT INTO submissions (id, tenantId, tenderId, files, createdAt) VALUES (?,?,?,?,?)`, args: [rec.id, rec.tenantId, rec.tenderId, JSON.stringify(files), rec.createdAt] });
  return rec;
}

export async function dbAddChunks(chunks: Omit<DocChunk, "id">[]): Promise<DocChunk[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const out: DocChunk[] = [];
  for (const c of chunks) {
    const id = nextId();
    await db.execute({
      sql: `INSERT INTO doc_chunks (id, tenantId, projectId, documentId, idx, text, embedding) VALUES (?,?,?,?,?,?,?)`,
      args: [id, c.tenantId, c.projectId, c.documentId, c.index, c.text, c.embedding ? JSON.stringify(c.embedding) : null],
    });
    out.push({ id, ...c });
  }
  return out;
}

export async function dbListChunksByTenant(tenantId: string): Promise<DocChunk[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const rs = await db.execute({ sql: `SELECT * FROM doc_chunks WHERE tenantId = ? ORDER BY documentId, idx`, args: [tenantId] });
  return (rs.rows as unknown as { id: string; tenantId: string; projectId: string; documentId: string; idx: number; text: string; embedding?: string }[]).map((r) => ({
    id: r.id, tenantId: r.tenantId, projectId: r.projectId, documentId: r.documentId, index: Number(r.idx), text: r.text, embedding: r.embedding ? JSON.parse(r.embedding) : undefined,
  }));
}

export async function dbListChunksByProject(tenantId: string, projectId: string): Promise<DocChunk[]> {
  const db = getDb(); if (!db) throw new Error("DB not configured");
  const rs = await db.execute({ sql: `SELECT * FROM doc_chunks WHERE tenantId = ? AND projectId = ? ORDER BY documentId, idx`, args: [tenantId, projectId] });
  return (rs.rows as unknown as { id: string; tenantId: string; projectId: string; documentId: string; idx: number; text: string; embedding?: string }[]).map((r) => ({
    id: r.id, tenantId: r.tenantId, projectId: r.projectId, documentId: r.documentId, index: Number(r.idx), text: r.text, embedding: r.embedding ? JSON.parse(r.embedding) : undefined,
  }));
}
