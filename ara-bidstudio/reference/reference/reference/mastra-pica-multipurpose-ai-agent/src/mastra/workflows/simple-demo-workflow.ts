import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Simple workflow that demonstrates core concepts without external dependencies

// Schema for project input
const projectInputSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  teamSize: z.number().min(1).max(100),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Step 1: Validate and process project data
const processProjectData = createStep({
  id: 'process-project-data',
  description: 'Processes and validates project information',
  inputSchema: projectInputSchema,
  outputSchema: projectInputSchema.extend({
    projectId: z.string(),
    slug: z.string(),
    estimatedDuration: z.string(),
    createdAt: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log(`🔍 Processing project: ${inputData.projectName}`);
    
    // Generate project ID and slug
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const slug = inputData.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Calculate estimated duration based on team size and priority
    let baseDays = 30; // Base project duration
    
    // Adjust for team size
    if (inputData.teamSize <= 2) baseDays += 20;
    else if (inputData.teamSize <= 5) baseDays += 10;
    else baseDays -= 5; // Larger teams work faster
    
    // Adjust for priority
    if (inputData.priority === 'high') baseDays = Math.floor(baseDays * 0.8);
    else if (inputData.priority === 'low') baseDays = Math.floor(baseDays * 1.2);
    
    const estimatedDuration = `${baseDays} days`;
    
    console.log(`✅ Generated project ID: ${projectId}`);
    
    return {
      ...inputData,
      projectId,
      slug,
      estimatedDuration,
      createdAt: new Date().toISOString(),
    };
  },
});

// Step 2: Create project plan
const createProjectPlan = createStep({
  id: 'create-project-plan',
  description: 'Creates a detailed project plan',
  inputSchema: processProjectData.outputSchema,
  outputSchema: processProjectData.outputSchema.extend({
    phases: z.array(z.string()),
    milestones: z.array(z.string()),
    risks: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    console.log(`📋 Creating project plan for: ${inputData.projectName}`);
    
    // Generate phases based on project characteristics
    const phases = [
      'Project Initiation',
      'Requirements Gathering',
      'Design & Planning',
      'Development',
      'Testing',
      'Deployment',
      'Project Closure'
    ];
    
    // Generate milestones
    const milestones = [
      `Requirements approved (Week 1)`,
      `Design completed (Week 2)`,
      `MVP ready (Week 4)`,
      `Testing completed (Week 6)`,
      `Production deployment (Week 8)`
    ];
    
    // Generate risks based on team size and priority
    const risks: string[] = [];
    if (inputData.teamSize <= 2) {
      risks.push('Small team may face capacity constraints');
    }
    if (inputData.priority === 'high') {
      risks.push('Tight timeline may impact quality');
      risks.push('Increased pressure on team members');
    }
    risks.push('Scope creep during development');
    risks.push('Integration challenges');
    
    console.log(`✅ Created plan with ${phases.length} phases and ${milestones.length} milestones`);
    
    return {
      ...inputData,
      phases,
      milestones,
      risks,
    };
  },
});

// Step 3: Generate project report
const generateProjectReport = createStep({
  id: 'generate-project-report',
  description: 'Generates a comprehensive project report',
  inputSchema: createProjectPlan.outputSchema,
  outputSchema: z.object({
    projectId: z.string(),
    projectName: z.string(),
    report: z.string(),
    summary: z.string(),
    recommendations: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    console.log(`📝 Generating report for: ${inputData.projectName}`);
    
    const report = `
# PROJECT ANALYSIS REPORT

## Project Overview
- **Name**: ${inputData.projectName}
- **ID**: ${inputData.projectId}
- **Description**: ${inputData.description}
- **Team Size**: ${inputData.teamSize} members
- **Priority**: ${inputData.priority.toUpperCase()}
- **Estimated Duration**: ${inputData.estimatedDuration}
- **Created**: ${new Date(inputData.createdAt).toLocaleDateString()}

## Project Phases
${inputData.phases.map((phase, i) => `${i + 1}. ${phase}`).join('\n')}

## Key Milestones
${inputData.milestones.map((milestone, i) => `${i + 1}. ${milestone}`).join('\n')}

## Risk Assessment
${inputData.risks.map((risk, i) => `${i + 1}. ${risk}`).join('\n')}

## Resource Requirements
- Team Size: ${inputData.teamSize} members
- Timeline: ${inputData.estimatedDuration}
- Priority Level: ${inputData.priority}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const summary = `Project "${inputData.projectName}" is a ${inputData.priority} priority initiative requiring ${inputData.teamSize} team members and an estimated ${inputData.estimatedDuration} to complete. The project includes ${inputData.phases.length} phases and ${inputData.milestones.length} key milestones.`;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (inputData.teamSize <= 2) {
      recommendations.push('Consider adding additional team members to reduce delivery risk');
    }
    
    if (inputData.priority === 'high') {
      recommendations.push('Implement daily standup meetings for close progress monitoring');
      recommendations.push('Consider splitting into smaller, deliverable chunks');
    }
    
    recommendations.push('Set up regular stakeholder check-ins');
    recommendations.push('Document all decisions and changes');
    recommendations.push('Plan for regular testing cycles throughout development');
    
    console.log(`✅ Generated comprehensive report with ${recommendations.length} recommendations`);
    
    return {
      projectId: inputData.projectId,
      projectName: inputData.projectName,
      report,
      summary,
      recommendations,
    };
  },
});

// Create the workflow
const simpleDemoWorkflow = createWorkflow({
  id: 'simple-demo-workflow',
  description: 'A simple workflow demonstrating core Mastra workflow concepts',
  inputSchema: projectInputSchema,
  outputSchema: generateProjectReport.outputSchema,
})
  .then(processProjectData)
  .then(createProjectPlan)
  .then(generateProjectReport);

// Commit the workflow
simpleDemoWorkflow.commit();

export { simpleDemoWorkflow };
