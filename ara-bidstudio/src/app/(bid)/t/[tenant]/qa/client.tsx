"use client";
import { useCopilotAction } from "@copilotkit/react-core";

export function QAClient({ tenant }: { tenant?: string }) {
  useCopilotAction({
    name: "answerQuestion",
    description: "Ask a question about tender documents",
    available: "frontend",
    parameters: [
      { name: "question", type: "string", required: true },
    ],
    render: ({ args }) => (
      <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
        <div className="font-medium text-sky-900">Question</div>
        <div className="text-sky-700 text-sm mt-1 break-words">{args.question}</div>
      </div>
    ),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Q&A</h1>
      <p className="text-gray-600">Tenant: {tenant}</p>
      <p className="text-gray-700">Use the Copilot to ask context-aware questions.</p>
    </div>
  );
}

