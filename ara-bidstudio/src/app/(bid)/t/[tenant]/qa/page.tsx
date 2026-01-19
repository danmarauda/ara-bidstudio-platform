import { QAClient } from "./client";

export default async function QAPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <QAClient tenant={tenant} />;
}
