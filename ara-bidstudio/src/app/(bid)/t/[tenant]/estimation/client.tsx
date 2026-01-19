"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function EstimationClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "generateEstimate",
    description: "Generate an estimate from scope",
    available: "frontend",
    parameters: [
      { name: "scope", type: "string", required: true },
    ],
    render: () => (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
        <div className="font-medium text-emerald-900">Estimate Generated</div>
        <div className="text-emerald-700 text-sm mt-1">Review items and refine.</div>
      </div>
    ),
  });

  useCopilotAction({
    name: "costSummary",
    description: "Summarize estimate totals",
    available: "frontend",
    parameters: [
      { name: "items", type: "object[]", required: true },
    ],
    render: () => (
      <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
        <div className="font-medium text-teal-900">Cost Summary</div>
        <div className="text-teal-700 text-sm mt-1">Totals computed.</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Estimation</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Use the Copilot to generate and refine estimates.</p>
    </div>
  );
}
