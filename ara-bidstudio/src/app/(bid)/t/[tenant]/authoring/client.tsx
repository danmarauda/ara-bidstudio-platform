"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function AuthoringClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "createSectionDraft",
    description: "Create a draft for a section",
    available: "frontend",
    parameters: [
      { name: "section", type: "string", required: true },
      { name: "outline", type: "string[]", required: false },
    ],
    render: ({ args }) => (
      <div className="rounded-xl bg-fuchsia-50 border border-fuchsia-200 p-4">
        <div className="font-medium text-fuchsia-900">Draft Created: {String(args.section || "")}</div>
      </div>
    ),
  });

  useCopilotAction({
    name: "reviseSection",
    description: "Revise a section per instructions",
    available: "frontend",
    parameters: [
      { name: "section", type: "string", required: true },
      { name: "instructions", type: "string", required: true },
    ],
    render: ({ args }) => (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
        <div className="font-medium text-rose-900">Draft Revised: {String(args.section || "")}</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Authoring</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Create and refine proposal sections with the Copilot.</p>
    </div>
  );
}

