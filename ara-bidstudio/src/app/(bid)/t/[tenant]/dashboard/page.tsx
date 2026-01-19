export default async function DashboardPage({ params }: { params: Promise<{ tenant?: string }> }) {
  const { tenant } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600">Welcome to the Bid & Tender Studio for <span className="font-medium">{tenant}</span>.</p>
      <ul className="list-disc ml-6 text-gray-700">
        <li>Track tender lifecycle progress</li>
        <li>Recent documents and extracted requirements</li>
        <li>Open compliance gaps and review items</li>
      </ul>
    </div>
  );
}
