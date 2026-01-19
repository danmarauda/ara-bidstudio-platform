"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function ComplianceClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "buildComplianceMatrix",
    description: "Build a compliance matrix",
    available: "frontend",
    parameters: [
      { name: "requirements", type: "object[]", required: true },
    ],
    render: () => (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="font-medium text-amber-900">Compliance Matrix Generated</div>
        <div className="text-amber-700 text-sm mt-1">Review gaps and assign owners.</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Compliance</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Use the Copilot to generate and manage compliance items.</p>
    </div>
  );
}
