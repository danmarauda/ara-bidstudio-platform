import { DocumentsClient } from "./client";

export default async function DocumentsPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <DocumentsClient tenant={tenant} />;
}
