import {
  ensureTenant as memEnsureTenant,
  createProject as memCreateProject,
  createTender as memCreateTender,
  addDocument as memAddDocument,
  listDocumentsByProject as memListDocumentsByProject,
  addRequirements as memAddRequirements,
  addComplianceItems as memAddComplianceItems,
  addEstimationItems as memAddEstimationItems,
  upsertDraft as memUpsertDraft,
  createSubmission as memCreateSubmission,
} from "./persistence";
import { getDb } from "./db";
import {
  dbEnsureTenant,
  dbCreateProject,
  dbCreateTender,
  dbAddDocument,
  dbListDocumentsByProject,
  dbAddRequirements,
  dbAddComplianceItems,
  dbAddEstimationItems,
  dbUpsertDraft,
  dbCreateSubmission,
} from "./persistence-db";
import type { ComplianceItem, Document, DraftSection, EstimationItem, Project, Requirement, Submission, Tender, Tenant } from "./schema";

const isDbEnabled = () => !!getDb();

export async function ensureTenant(slug?: string): Promise<Tenant> {
  const s = (slug || "").toLowerCase();
  return isDbEnabled() ? dbEnsureTenant(s) : memEnsureTenant(s);
}

export async function createProject(tenantId: string, name: string, description?: string): Promise<Project> {
  return isDbEnabled() ? dbCreateProject(tenantId, name, description) : memCreateProject(tenantId, name, description);
}

export async function createTender(tenantId: string, projectId: string, name: string): Promise<Tender> {
  return isDbEnabled() ? dbCreateTender(tenantId, projectId, name) : memCreateTender(tenantId, projectId, name);
}

export async function addDocument(tenantId: string, projectId: string, name: string, mimeType?: string, content?: string): Promise<Document> {
  return isDbEnabled() ? dbAddDocument(tenantId, projectId, name, mimeType, content) : memAddDocument(tenantId, projectId, name, mimeType, content);
}

export async function listDocumentsByProject(tenantId: string, projectId: string): Promise<Document[]> {
  return isDbEnabled() ? dbListDocumentsByProject(tenantId, projectId) : memListDocumentsByProject(tenantId, projectId);
}

export async function addRequirements(tenantId: string, tenderId: string, reqs: Omit<Requirement, "id"|"tenantId"|"tenderId">[]): Promise<Requirement[]> {
  return isDbEnabled() ? dbAddRequirements(tenantId, tenderId, reqs) : memAddRequirements(tenantId, tenderId, reqs);
}

export async function addComplianceItems(tenantId: string, tenderId: string, items: Omit<ComplianceItem, "id"|"tenantId"|"tenderId">[]): Promise<ComplianceItem[]> {
  return isDbEnabled() ? dbAddComplianceItems(tenantId, tenderId, items) : memAddComplianceItems(tenantId, tenderId, items);
}

export async function addEstimationItems(tenantId: string, tenderId: string, items: Omit<EstimationItem, "id"|"tenantId"|"tenderId">[]): Promise<EstimationItem[]> {
  return isDbEnabled() ? dbAddEstimationItems(tenantId, tenderId, items) : memAddEstimationItems(tenantId, tenderId, items);
}

export async function upsertDraft(tenantId: string, tenderId: string, section: string, content: string): Promise<DraftSection> {
  return isDbEnabled() ? dbUpsertDraft(tenantId, tenderId, section, content) : memUpsertDraft(tenantId, tenderId, section, content);
}

export async function createSubmission(tenantId: string, tenderId: string, files: { name: string; path: string }[]): Promise<Submission> {
  return isDbEnabled() ? dbCreateSubmission(tenantId, tenderId, files) : memCreateSubmission(tenantId, tenderId, files);
}
