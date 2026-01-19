"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function ReviewClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "proposeReviewChecklist",
    description: "Propose a review checklist",
    available: "frontend",
    parameters: [
      { name: "scope", type: "string", required: false },
    ],
    render: () => (
      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
        <div className="font-medium text-yellow-900">Review Checklist Proposed</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Review</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Track review checklists and approvals with the Copilot.</p>
    </div>
  );
}

