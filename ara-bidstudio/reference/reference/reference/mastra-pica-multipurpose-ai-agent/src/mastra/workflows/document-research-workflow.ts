// src/mastra/workflows/document-research-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { pica, picaTools } from "../tools/pica-tools";

// Step 1: Search across multiple platforms in parallel
const searchDocumentsStep = createStep({
  id: "search-documents",
  description: "Search for documents across multiple platforms",
  inputSchema: z.object({
    query: z.string(),
    platforms: z.array(z.enum(["google-drive", "github", "slack"])).optional(),
    requireApproval: z.boolean().default(true), // Changed to .default(true) to match workflow
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    googleDriveResults: z.array(z.any()).optional(),
    githubResults: z.array(z.any()).optional(),
    slackResults: z.array(z.any()).optional(),
    totalResults: z.number(),
    query: z.string(),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  execute: async ({ inputData, writer }) => {
    const { query, platforms = ["google-drive", "github", "slack"], requireApproval, publishChannels } = inputData;
    
    writer?.write({
      type: "search-status",
      status: "starting",
      platforms
    });

    const results = {
      googleDriveResults: [] as any[],
      githubResults: [] as any[],
      slackResults: [] as any[],
      totalResults: 0,
      query,
      requireApproval,
      publishChannels
    };

    // Search in parallel across platforms
    const searchPromises: Promise<void>[] = [];

    if (platforms.includes("google-drive")) {
      searchPromises.push(
        searchGoogleDrive(query).then(res => {
          results.googleDriveResults = res;
          writer?.write({
            type: "search-status",
            platform: "google-drive",
            status: "complete",
            count: res.length
          });
        })
      );
    }

    if (platforms.includes("github")) {
      searchPromises.push(
        searchGitHub(query).then(res => {
          results.githubResults = res;
          writer?.write({
            type: "search-status",
            platform: "github",
            status: "complete",
            count: res.length
          });
        })
      );
    }

    if (platforms.includes("slack")) {
      searchPromises.push(
        searchSlack(query).then(res => {
          results.slackResults = res;
          writer?.write({
            type: "search-status",
            platform: "slack",
            status: "complete",
            count: res.length
          });
        })
      );
    }

    await Promise.all(searchPromises);
    
    results.totalResults = 
      (results.googleDriveResults?.length || 0) +
      (results.githubResults?.length || 0) +
      (results.slackResults?.length || 0);

    return results;
  }
});

// Step 2: Analyze and synthesize the search results
const analyzeResultsStep = createStep({
  id: "analyze-results",
  description: "Analyze and synthesize search results using AI",
  inputSchema: z.object({
    googleDriveResults: z.array(z.any()).optional(),
    githubResults: z.array(z.any()).optional(),
    slackResults: z.array(z.any()).optional(),
    totalResults: z.number(),
    query: z.string(),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    summary: z.string(),
    keyFindings: z.array(z.string()),
    recommendations: z.array(z.string()),
    relevanceScore: z.number(),
    query: z.string(),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  execute: async ({ inputData, writer }) => {
    const { googleDriveResults = [], githubResults = [], slackResults = [], query, requireApproval, publishChannels } = inputData;
    
    writer?.write({
      type: "analysis-status",
      status: "analyzing"
    });

    const prompt = `
      Analyze the following search results for the query "${query}" and provide:
      1. A concise summary
      2. Key findings (3-5 bullet points)
      3. Actionable recommendations (2-3 items)
      4. A relevance score from 0-100
      
      Google Drive Results: ${JSON.stringify(googleDriveResults.slice(0, 5))}
      GitHub Results: ${JSON.stringify(githubResults.slice(0, 5))}
      Slack Results: ${JSON.stringify(slackResults.slice(0, 5))}
      
      Format your response as JSON with keys: summary, keyFindings, recommendations, relevanceScore
    `;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.3
    });

    try {
      const analysis = JSON.parse(text);
      writer?.write({
        type: "analysis-status",
        status: "complete"
      });
      return {
        ...analysis,
        query,
        requireApproval,
        publishChannels
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        summary: text,
        keyFindings: ["Analysis completed"],
        recommendations: ["Review the findings"],
        relevanceScore: 75,
        query,
        requireApproval,
        publishChannels
      };
    }
  }
});

// Step 3: Create a comprehensive report
const createReportStep = createStep({
  id: "create-report",
  description: "Create a formatted report document",
  inputSchema: z.object({
    summary: z.string(),
    keyFindings: z.array(z.string()),
    recommendations: z.array(z.string()),
    relevanceScore: z.number(),
    query: z.string(),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    reportTitle: z.string(),
    reportContent: z.string(),
    reportFormat: z.enum(["markdown", "html", "plain"]),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  execute: async ({ inputData }) => {
    const { summary, keyFindings, recommendations, relevanceScore, query, requireApproval, publishChannels } = inputData;
    
    const reportTitle = `Research Report: ${query}`;
    
    const reportContent = `
# ${reportTitle}

**Generated on:** ${new Date().toLocaleString()}
**Relevance Score:** ${relevanceScore}/100

## Executive Summary
${summary}

## Key Findings
${keyFindings.map(finding => `- ${finding}`).join('\n')}

## Recommendations
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

---
*This report was automatically generated by the Smart Document Research Workflow*
    `.trim();

    return {
      reportTitle,
      reportContent,
      reportFormat: "markdown" as const,
      requireApproval,
      publishChannels
    };
  }
});

// Step 4: Human approval step (suspendable)
const approvalStep = createStep({
  id: "human-approval",
  description: "Require human approval before publishing",
  inputSchema: z.object({
    reportTitle: z.string(),
    reportContent: z.string(),
    reportFormat: z.enum(["markdown", "html", "plain"]),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
    reportTitle: z.string(),
    reportContent: z.string(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  suspendSchema: z.object({
    reportTitle: z.string(),
    reportContent: z.string()
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
    modifiedContent: z.string().optional()
  }),
  execute: async ({ inputData, resumeData, suspend, writer }) => {
    const { reportTitle, reportContent, publishChannels } = inputData;
    
    if (!resumeData) {
      writer?.write({
        type: "approval-required",
        status: "waiting",
        message: "Human approval required for report publication"
      });
      
      await suspend({
        reportTitle,
        reportContent
      });
      
      return { 
        approved: false,
        reportTitle,
        reportContent,
        publishChannels
      };
    }

    writer?.write({
      type: "approval-received",
      status: resumeData.approved ? "approved" : "rejected",
      feedback: resumeData.feedback
    });

    return {
      approved: resumeData.approved,
      feedback: resumeData.feedback,
      reportTitle,
      reportContent: resumeData.modifiedContent || reportContent,
      publishChannels
    };
  }
});

// Step 5: Auto-approve step for when approval is not required
const autoApproveStep = createStep({
  id: "auto-approve",
  description: "Auto-approve the report",
  inputSchema: z.object({
    reportTitle: z.string(),
    reportContent: z.string(),
    reportFormat: z.enum(["markdown", "html", "plain"]),
    requireApproval: z.boolean(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    reportTitle: z.string(),
    reportContent: z.string(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  execute: async ({ inputData }) => ({
    approved: true,
    reportTitle: inputData.reportTitle,
    reportContent: inputData.reportContent,
    publishChannels: inputData.publishChannels
  })
});

// Step 6: Normalize branch output - handles the union type from branch
// Step 6: Normalize branch output - handles the union type from branch
const normalizeBranchOutputStep = createStep({
  id: "normalize-branch-output",
  description: "Normalize the output from approval branch",
  inputSchema: z.object({
    "human-approval": z.object({
      approved: z.boolean(),
      feedback: z.string().optional(),
      reportTitle: z.string(),
      reportContent: z.string(),
      publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
    }).optional(),
    "auto-approve": z.object({
      approved: z.boolean(),
      reportTitle: z.string(),
      reportContent: z.string(),
      publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
    }).optional()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    reportTitle: z.string(),
    reportContent: z.string(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  execute: async ({ inputData }) => {
    // Extract the actual data from whichever branch was executed
    const branchResult = inputData["human-approval"] || inputData["auto-approve"];
    
    if (!branchResult) {
      throw new Error("No branch result found");
    }
    
    return {
      approved: branchResult.approved,
      reportTitle: branchResult.reportTitle,
      reportContent: branchResult.reportContent,
      publishChannels: branchResult.publishChannels
    };
  }
});

// Step 7: Publish the report
const publishReportStep = createStep({
  id: "publish-report",
  description: "Publish report to selected channels",
  inputSchema: z.object({
    approved: z.boolean(),
    reportTitle: z.string(),
    reportContent: z.string(),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    published: z.boolean(),
    publishedChannels: z.array(z.string()),
    urls: z.array(z.string()).optional(),
    reportTitle: z.string(),
    message: z.string()
  }),
  execute: async ({ inputData, bail, writer }) => {
    if (!inputData.approved) {
      return bail({
        published: false,
        publishedChannels: [],
        urls: [],
        reportTitle: inputData.reportTitle,
        message: "Report was not approved for publication"
      });
    }

    const { reportTitle, reportContent, publishChannels = ["google-drive"] } = inputData;
    const publishedChannels: string[] = [];
    const urls: string[] = [];

    for (const channel of publishChannels) {
      writer?.write({
        type: "publishing",
        channel,
        status: "in-progress"
      });

      try {
        if (channel === "google-drive") {
          const url = await createGoogleDoc(reportTitle, reportContent);
          publishedChannels.push("google-drive");
          urls.push(url);
        } else if (channel === "slack") {
          await postToSlack(reportTitle, reportContent);
          publishedChannels.push("slack");
        } else if (channel === "email") {
          await sendEmail(reportTitle, reportContent);
          publishedChannels.push("email");
        }
        
        writer?.write({
          type: "publishing",
          channel,
          status: "complete"
        });
      } catch (error: any) {
        writer?.write({
          type: "publishing",
          channel,
          status: "failed",
          error: error?.message || "Unknown error"
        });
      }
    }

    return {
      published: publishedChannels.length > 0,
      publishedChannels,
      urls,
      reportTitle,
      message: publishedChannels.length > 0 
        ? `Report published to ${publishedChannels.join(", ")}`
        : "Report was not published to any channels"
    };
  }
});

// Helper functions (same as before)
async function searchGoogleDrive(query: string): Promise<any[]> {
  try {
    console.log(`Searching Google Drive for: ${query}`);
    return [
      { id: "1", name: `Document about ${query}`, type: "document" }
    ];
  } catch (error) {
    console.error("Google Drive search failed:", error);
    return [];
  }
}

async function searchGitHub(query: string): Promise<any[]> {
  try {
    console.log(`Searching GitHub for: ${query}`);
    return [
      { id: "1", name: `Repository related to ${query}`, type: "repository" }
    ];
  } catch (error) {
    console.error("GitHub search failed:", error);
    return [];
  }
}

async function searchSlack(query: string): Promise<any[]> {
  try {
    console.log(`Searching Slack for: ${query}`);
    return [
      { id: "1", text: `Message about ${query}`, channel: "general" }
    ];
  } catch (error) {
    console.error("Slack search failed:", error);
    return [];
  }
}

async function createGoogleDoc(title: string, content: string): Promise<string> {
  console.log(`Creating Google Doc: ${title}`);
  return `https://docs.google.com/document/d/example-${Date.now()}`;
}

async function postToSlack(title: string, content: string): Promise<boolean> {
  console.log(`Posting to Slack: ${title}`);
  return true;
}

async function sendEmail(title: string, content: string): Promise<boolean> {
  console.log(`Sending email: ${title}`);
  return true;
}

// Create the main workflow
export const documentResearchWorkflow = createWorkflow({
  id: "document-research-workflow",
  description: "Smart document research workflow with multi-platform search and AI analysis",
  inputSchema: z.object({
    query: z.string(),
    platforms: z.array(z.enum(["google-drive", "github", "slack"])).optional(),
    requireApproval: z.boolean().default(true),
    publishChannels: z.array(z.enum(["slack", "email", "google-drive"])).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    reportTitle: z.string().optional(),
    publishedChannels: z.array(z.string()).optional(),
    message: z.string()
  })
})
  // Search across platforms
  .then(searchDocumentsStep)
  // Analyze results
  .then(analyzeResultsStep)
  // Create report
  .then(createReportStep)
  // Branch for approval
  .branch([
    [
      async ({ inputData }) => inputData.requireApproval === true,
      approvalStep
    ],
    [
      async ({ inputData }) => inputData.requireApproval !== true,
      autoApproveStep
    ]
  ])
  // Normalize the branch output to handle union type
  .then(normalizeBranchOutputStep)
  // Publish report
  .then(publishReportStep)
  // Map final output
  .map(async ({ inputData }) => ({
    success: inputData.published,
    reportTitle: inputData.reportTitle,
    publishedChannels: inputData.publishedChannels,
    message: inputData.message
  }))
  .commit();