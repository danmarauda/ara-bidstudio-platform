import { Card, CardContent } from "@/components/card"
import { Activity, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

export interface ExecuteResult {
  platform: string;
  action: string;
  success: boolean;
  data?: any;
  message?: string;
  raw?: any;
  title?: string;
}

interface ExecuteCardProps {
  results: ExecuteResult[];
}

export default function ExecuteCard({ results }: ExecuteCardProps) {
  const [expandedData, setExpandedData] = useState<string | null>(null);

  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  return (
    <div className="max-w-lg min-w-lg p-2">
      <Card className="bg-background border-border overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/50">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <h2 className="text-sm font-semibold">Executed Actions</h2>
              <span className="text-xs text-muted-foreground">({results.length})</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-normal ${failedResults.length > 0 ? 'text-red-500' : 'text-primary'}`}
            >
              {failedResults.length > 0 ? `${successfulResults.length}/${results.length} Complete` : 'Complete'}
            </Badge>
          </div>

          {/* Successful Results */}
          {successfulResults.length > 0 && (
            <div className="space-y-1.5 p-2">
              {successfulResults.map((result, index) => (
                <div
                  key={`success-${index}`}
                  className="flex flex-col gap-2 px-3 py-2 rounded-md bg-background/50 border"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
                      <Image
                        src={`https://assets.buildable.dev/catalog/node-templates/${result.platform.toLowerCase()}.svg`}
                        alt={`${result.platform} logo`}
                        width={32}
                        height={32}
                        className="h-6 w-6"
                        onError={(e) => {
                          e.currentTarget.src = "https://assets.buildable.dev/catalog/node-templates/question.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.action}</div>
                      <div className="text-xs text-muted-foreground">
                        via {toTitleCase(result.platform)}
                      </div>
                    </div>
                    {result.data && (
                      <button
                        onClick={() => setExpandedData(expandedData === result.action ? null : result.action)}
                        className="flex items-center px-2 py-1 text-primary opacity-80 hover:opacity-100 transition-colors rounded-md hover:bg-primary/10 gap-2 text-xs"
                      >
                        {expandedData === result.action ? "Hide" : "View"} Details
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transform transition-transform ${expandedData === result.action ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Response Data Section */}
                  {expandedData === result.action && result.data && (
                    <div className="relative group">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
                          toast.success("Response data copied to clipboard");
                        }}
                        className="absolute top-2 right-2 px-1 py-1 text-primary opacity-80 hover:opacity-100 transition-colors rounded-md hover:bg-primary/10 flex items-center gap-2 z-10"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <pre className="max-h-[150px] overflow-y-scroll p-2 bg-background/50 border border-border rounded-lg">
                        <code className="font-mono whitespace-pre-wrap break-all text-xs">
                          {JSON.stringify(result.data, null, 2)}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Failed Results */}
          {failedResults.length > 0 && (
            <div className="space-y-1.5 p-2 bg-red-500/5">
              {failedResults.map((result, index) => (
                <div
                  key={`error-${index}`}
                  className="flex flex-col gap-2 px-3 py-2 rounded-md bg-background/50 border border-red-500/20"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-red-500">
                        {result.title || result.action && `Failed to execute ${result.action}` || 'Execution Failed'}
                      </div>
                      <div className="text-xs text-red-400">
                        {result.message || 'An error occurred during execution'}
                      </div>
                    </div>
                    {result.raw && (
                      <button
                        onClick={() => setExpandedData(expandedData === `error-${index}` ? null : `error-${index}`)}
                        className="flex items-center px-2 py-1 text-red-500 opacity-80 hover:opacity-100 transition-colors rounded-md hover:bg-red-500/10 gap-2 text-xs"
                      >
                        {expandedData === `error-${index}` ? "Hide" : "View"} Details
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transform transition-transform ${expandedData === `error-${index}` ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Error Details Section */}
                  {expandedData === `error-${index}` && result.raw && (
                    <div className="relative group">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result.raw, null, 2));
                          toast.success("Error details copied to clipboard");
                        }}
                        className="absolute top-2 right-2 px-1 py-1 text-red-500 opacity-80 hover:opacity-100 transition-colors rounded-md hover:bg-red-500/10 flex items-center gap-2 z-10"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <pre className="max-h-[150px] overflow-y-scroll p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <code className="font-mono whitespace-pre-wrap break-all text-xs text-red-400">
                          {JSON.stringify(result.raw, null, 2)}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const toTitleCase = (str: string) => {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}; 