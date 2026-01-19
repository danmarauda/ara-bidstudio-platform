import { AuthoringClient } from "./client";

export default async function AuthoringPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <AuthoringClient tenant={tenant} />;
}
