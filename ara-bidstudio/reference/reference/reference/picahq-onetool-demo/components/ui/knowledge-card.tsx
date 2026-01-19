import { Card, CardContent } from "@/components/card";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Action {
  title: string;
  description?: string;
  platform?: string;
}

interface KnowledgeCardProps {
  platform: string;
  actions?: Action[];
  action?: Action;
  knowledge?: Array<{ platform: string; action: any }>;
  totalActions?: number;
}

export default function KnowledgeCard({
  platform,
  actions,
  knowledge,
  totalActions,
}: KnowledgeCardProps) {
  // Group actions by platform
  const platformGroups = actions?.reduce((acc, curr) => {
    const platform = curr.platform?.toLowerCase() || "unknown";
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(curr);
    return acc;
  }, {} as Record<string, Action[]>);

  return (
    <div className="w-full min-w-lg p-2">
      <Card className="bg-background border-border overflow-hidden">
        <CardContent className="p-0">
          {/* Header with Stats */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/50">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />

              <h2 className="text-sm font-semibold">Pica Intelligence</h2>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-normal text-primary"
            >
              Active
            </Badge>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {platformGroups &&
              Object.entries(platformGroups).map(
                ([platformKey, platformActions]) => (
                  <div
                    key={platformKey}
                    className="flex items-center gap-2 px-2 py-[1px] rounded-md transition-colors group border text-xs"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 group-hover:bg-background/100">
                      <Image
                        src={`https://assets.buildable.dev/catalog/node-templates/${platformKey}.svg`}
                        alt={platformKey}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://assets.buildable.dev/catalog/node-templates/question.svg";
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {toTitleCase(platformKey)}
                    </span>
                    <span className="text-xs text-primary">
                      {platformActions.length} actions
                    </span>
                  </div>
                )
              )}
          </div>

          {/* Pica Knowledge */}
          {knowledge && knowledge.length > 0 && (
            <div className="px-2 pb-2">
              <div className="p-2 rounded-md bg-background/60 border border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">
                    Platform Knowledge
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-primary"
                  >
                    Loaded
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {knowledge.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Image
                        src={`https://assets.buildable.dev/catalog/node-templates/${item.platform.toLowerCase()}.svg`}
                        alt={item.platform}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://assets.buildable.dev/catalog/node-templates/question.svg";
                        }}
                      />
                      <span className="text-muted-foreground truncate">
                        {item.action.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to convert string to title case
const toTitleCase = (str: string) => {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
