import { addDocument } from "./store";
import { addChunks as memAddChunks, listChunksByTenant as memListChunksByTenant, listChunksByProject as memListChunksByProject } from "./persistence";
import { dbAddChunks as sqlAddChunks, dbListChunksByTenant as sqlListChunksByTenant, dbListChunksByProject as sqlListChunksByProject } from "./persistence-db";
import type { DocChunk } from "./schema";
import { getDb } from "./db";
import { getEmbedding, cosineSimilarity } from "./embedding";

export function splitIntoChunks(text: string, chunkSize = 1000, overlap = 100): { index: number; text: string }[] {
  const chunks: { index: number; text: string }[] = [];
  let i = 0;
  let idx = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + chunkSize);
    chunks.push({ index: idx++, text: text.slice(i, end) });
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

const isDbEnabled = () => !!getDb();

export async function ingestDocumentContent(params: { tenantId: string; projectId: string; filename: string; mimeType?: string; content: string }): Promise<{ documentId: string; chunkCount: number }>{
  const { tenantId, projectId, filename, mimeType, content } = params;
  const doc = await addDocument(tenantId, projectId, filename, mimeType, content);
  const chunks = splitIntoChunks(content);
  const embeddingsAvailable = !!process.env.OPENAI_API_KEY;
  const out: Omit<DocChunk, "id">[] = [];
  for (const c of chunks) {
    const emb = embeddingsAvailable ? await getEmbedding(c.text) : null;
    out.push({ tenantId, projectId, documentId: doc.id, index: c.index, text: c.text, embedding: emb || undefined });
  }
  if (isDbEnabled()) await sqlAddChunks(out);
  else memAddChunks(out);
  return { documentId: doc.id, chunkCount: out.length };
}

export async function searchChunks(params: { tenantId: string; projectId?: string; query: string; topK?: number }): Promise<DocChunk[]> {
  const { tenantId, projectId, query } = params;
  const topK = params.topK || 3;
  const queryEmb = await getEmbedding(query);
  const all = isDbEnabled()
    ? (projectId ? await sqlListChunksByProject(tenantId, projectId) : await sqlListChunksByTenant(tenantId))
    : (projectId ? memListChunksByProject(tenantId, projectId) : memListChunksByTenant(tenantId));
  if (queryEmb) {
    const scored = all.map((c) => ({ c, score: c.embedding ? cosineSimilarity(queryEmb, c.embedding) : 0 }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK).map((s) => s.c);
  }
  // fallback keyword search
  const scored = all.map((c) => ({ c, score: c.text.toLowerCase().includes(query.toLowerCase()) ? 1 : 0 }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK).map((s) => s.c);
}
