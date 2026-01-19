import { NextRequest, NextResponse } from "next/server";
import { ensureTenant } from "@/lib/store";
import { seedARA } from "@/lib/seed";
import { ingestDocumentContent } from "@/lib/doc";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let filename = "uploaded.txt";
    let mimeType = "text/plain";
    let content = "";
    let tenantSlug: string | undefined;
    let projectId: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      tenantSlug = (form.get("tenant") as string) || undefined;
      projectId = (form.get("projectId") as string) || undefined;
      if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });
      filename = file.name;
      mimeType = file.type || mimeType;
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder();
      content = decoder.decode(arrayBuffer);
    } else {
      const body = await req.json();
      tenantSlug = body.tenant || undefined;
      projectId = body.projectId || undefined;
      filename = body.filename || filename;
      mimeType = body.mimeType || mimeType;
      content = body.content || content;
    }

    seedARA();
    const tenant = await ensureTenant(tenantSlug);
    const pid = projectId || seedARA().projectId;
    const ing = await ingestDocumentContent({ tenantId: tenant.id, projectId: pid, filename, mimeType, content });
    return NextResponse.json({ ok: true, documentId: ing.documentId, chunks: ing.chunkCount });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

