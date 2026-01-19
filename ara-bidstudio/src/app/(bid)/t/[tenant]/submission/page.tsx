import { SubmissionClient } from "./client";

export default async function SubmissionPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <SubmissionClient tenant={tenant} />;
}
