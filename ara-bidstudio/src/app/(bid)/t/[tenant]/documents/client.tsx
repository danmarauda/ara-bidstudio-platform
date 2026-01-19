"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function DocumentsClient({ tenant }: { tenant?: string }) {
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    alert(res.ok ? `Uploaded. docId=${json.documentId}, chunks=${json.chunks}` : `Upload failed: ${json.error}`);
  }

  useCopilotAction({
    name: "ingestDocument",
    description: "Ingest a new document for this tenant",
    available: "frontend",
    parameters: [
      { name: "filename", type: "string", required: true },
      { name: "content", type: "string", required: true },
      { name: "mimeType", type: "string", required: false },
    ],
    render: ({ args }) => (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
        <div className="font-medium text-emerald-900">Document Ingested</div>
        <div className="text-emerald-700 text-sm mt-1 break-words">{args.filename}</div>
      </div>
    ),
  });

  useCopilotAction({
    name: "answerQuestion",
    description: "Ask questions about tender documents",
    available: "frontend",
    parameters: [{ name: "question", type: "string", required: true }],
    render: ({ args }) => (
      <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
        <div className="font-medium text-sky-900">Q&A</div>
        <div className="text-sky-700 text-sm mt-1 break-words">{args.question}</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <form onSubmit={handleUpload} className="rounded-lg border p-4 flex items-center gap-3">
        <input type="hidden" name="tenant" value={tenant} />
        <input name="file" type="file" className="text-sm" />
        <button type="submit" className="px-3 py-1.5 rounded bg-black text-white text-sm">Upload</button>
      </form>
      <p className="text-gray-700">Use the Copilot to ingest documents and ask questions, or upload files directly.</p>
    </div>
  );
}
