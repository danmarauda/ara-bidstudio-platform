"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function RequirementsClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "extractRequirements",
    description: "Extract requirements from documents",
    available: "frontend",
    parameters: [
      { name: "documentIds", type: "string[]", required: false },
      { name: "content", type: "string", required: false },
    ],
    render: ({ args }) => (
      <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
        <div className="font-medium text-violet-900">Requirements Extracted</div>
        <pre className="text-violet-800 text-xs mt-2 whitespace-pre-wrap break-words">{JSON.stringify(args, null, 2)}</pre>
      </div>
    ),
  });

  useCopilotAction({
    name: "mapCapabilities",
    description: "Map requirements to capabilities",
    available: "frontend",
    parameters: [
      { name: "requirements", type: "object[]", required: true },
    ],
    render: () => (
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
        <div className="font-medium text-indigo-900">Capabilities Mapping Proposed</div>
        <div className="text-indigo-700 text-sm mt-1">Review mappings and confirm.</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Requirements</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Use the Copilot to extract and map requirements.</p>
    </div>
  );
}
