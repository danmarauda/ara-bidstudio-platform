import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client | null {
  const url = process.env.DB_URL;
  if (!url) return null;
  if (client) return client;
  client = createClient({
    url,
    authToken: process.env.DB_AUTH_TOKEN,
  });
  return client;
}

export async function ensureSchema() {
  const db = getDb();
  if (!db) return;
  const stmts = [
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, slug TEXT UNIQUE, name TEXT)`,
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, description TEXT)`,
    `CREATE TABLE IF NOT EXISTS tenders (id TEXT PRIMARY KEY, tenantId TEXT, projectId TEXT, name TEXT, status TEXT)`,
    `CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, tenantId TEXT, projectId TEXT, name TEXT, mimeType TEXT, content TEXT, createdAt INTEGER)` ,
    `CREATE TABLE IF NOT EXISTS requirements (id TEXT PRIMARY KEY, tenantId TEXT, tenderId TEXT, text TEXT, category TEXT)` ,
    `CREATE TABLE IF NOT EXISTS compliance (id TEXT PRIMARY KEY, tenantId TEXT, tenderId TEXT, requirementId TEXT, status TEXT, note TEXT)` ,
    `CREATE TABLE IF NOT EXISTS estimation (id TEXT PRIMARY KEY, tenantId TEXT, tenderId TEXT, name TEXT, cost REAL)` ,
    `CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, tenantId TEXT, tenderId TEXT, section TEXT, content TEXT)` ,
    `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, tenantId TEXT, tenderId TEXT, files TEXT, createdAt INTEGER)` ,
    `CREATE TABLE IF NOT EXISTS doc_chunks (id TEXT PRIMARY KEY, tenantId TEXT, projectId TEXT, documentId TEXT, idx INTEGER, text TEXT, embedding TEXT)` ,
  ];
  for (const sql of stmts) {
    await db.execute(sql);
  }
}
