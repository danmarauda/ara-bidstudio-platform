"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { ReactNode } from "react";

type Props = {
  themeColor: string;
  children: ReactNode;
};

// Left-docked Copilot panel containing the CopilotChat UI
export default function CopilotSidebarClient({ themeColor, children }: Props) {
  const panelWidth = 360;
  return (
    <div>
      {/* Left fixed panel */}
      <aside
        style={{ width: panelWidth, backgroundColor: "#fff" }}
        className="fixed left-0 top-0 h-screen border-r border-gray-200 z-50 flex flex-col"
      >
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700">Popup Assistant</div>
          <div className="text-xs text-gray-500">
            👋 Hi, there! You're chatting with a Mastra PM agent. You can ask me to do anything relevant to the project at hand!
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <CopilotChat className="h-full" />
        </div>
      </aside>

      {/* Main content shifted to the right of the panel */}
      <div style={{ marginLeft: panelWidth }}>
        {children}
      </div>
    </div>
  );
}

