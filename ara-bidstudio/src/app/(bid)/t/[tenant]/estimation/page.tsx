import { EstimationClient } from "./client";

export default async function EstimationPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <EstimationClient tenant={tenant} />;
}
