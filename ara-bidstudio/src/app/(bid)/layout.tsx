"use client";
import { CopilotKit } from "@copilotkit/react-core";

export default function BidLayout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="bidAgent" showDevConsole={false}>
      {children}
    </CopilotKit>
  );
}

