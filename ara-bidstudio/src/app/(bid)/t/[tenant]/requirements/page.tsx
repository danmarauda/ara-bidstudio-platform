import { RequirementsClient } from "./client";

export default async function RequirementsPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <RequirementsClient tenant={tenant} />;
}
