'use client';

import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AgentsSidebar } from './agents-sidebar';
import { DashboardSidebar } from './dashboard-sidebar';
import { MarketplaceSidebar } from './marketplace-sidebar';
import { McpSidebar } from './mcp-sidebar';
import { useSidebar } from './sidebar-context';
import { WorkflowSidebar } from './workflow-sidebar';

export function PageSidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  // Determine which sidebar content to show based on the current path
  const getSidebarContent = () => {
    // Do not render a page-level sidebar on chat pages.
    // Chat history is now displayed in the global app sidebar.
    if (pathname.startsWith('/chat')) {
      return null;
    }
    if (pathname.startsWith('/dashboard')) {
      return <DashboardSidebar />;
    }
    if (pathname.startsWith('/agents')) {
      return <AgentsSidebar />;
    }
    if (pathname.startsWith('/mcp')) {
      return <McpSidebar />;
    }
    if (pathname.startsWith('/marketplace')) {
      return <MarketplaceSidebar />;
    }
    if (pathname.startsWith('/workflow')) {
      return <WorkflowSidebar />;
    }
    return null;
  };

  const sidebarContent = getSidebarContent();

  // Don't render sidebar if there's no content for this page
  if (!sidebarContent) {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-[65px] left-0 z-40 h-[calc(100vh-65px)] border-border/50 border-r bg-card/95 backdrop-blur-sm transition-all duration-300',
          isOpen ? 'w-80' : 'w-0'
        )}
      >
        <div
          className={cn('h-full overflow-hidden', isOpen ? 'block' : 'hidden')}
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-border/50 border-b px-4">
            <div className="flex-1">
              {/* Title will be set by individual sidebars */}
            </div>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="h-[calc(100%-56px)] overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      </div>

      {/* Main content offset */}
      <div
        className={cn('transition-all duration-300', isOpen ? 'ml-80' : 'ml-0')}
      />
    </>
  );
}
