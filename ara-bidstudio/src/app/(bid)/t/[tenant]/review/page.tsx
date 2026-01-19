import { ReviewClient } from "./client";

export default async function ReviewPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return <ReviewClient tenant={tenant} />;
}
