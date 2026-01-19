"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function SubmissionClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "prepareSubmissionPackage",
    description: "Prepare a submission package",
    available: "frontend",
    parameters: [
      { name: "tenderId", type: "string", required: false },
    ],
    render: () => (
      <div className="rounded-xl bg-lime-50 border border-lime-200 p-4">
        <div className="font-medium text-lime-900">Submission Package Prepared</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Submission</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Prepare submission packages and validate completeness with the Copilot.</p>
    </div>
  );
}

