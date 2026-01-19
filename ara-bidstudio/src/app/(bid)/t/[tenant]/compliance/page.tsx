import { ComplianceClient } from "./client";

export default async function CompliancePage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <ComplianceClient tenant={tenant} />;
}
