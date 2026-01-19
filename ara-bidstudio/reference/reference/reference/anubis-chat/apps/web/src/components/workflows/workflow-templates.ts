import type { WorkflowTemplate as WorkflowTemplateType } from './workflow-types';

export type WorkflowTemplate = WorkflowTemplateType;

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description:
      'AI-powered research workflow that gathers, analyzes, and summarizes information',
    category: 'research',
    nodes: [
      {
        id: 'start',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          type: 'start',
          label: 'Start Research',
          description: 'Begin research process',
        },
      },
      {
        id: 'gather',
        type: 'custom',
        position: { x: 250, y: 100 },
        data: {
          type: 'agent',
          label: 'Research Agent',
          description: 'Gather information from sources',
          config: { agentId: 'researcher', model: 'gpt-4o' },
        },
      },
      {
        id: 'analyze',
        type: 'custom',
        position: { x: 400, y: 100 },
        data: {
          type: 'agent',
          label: 'Analysis Agent',
          description: 'Analyze gathered data',
          config: { agentId: 'analyst', model: 'gpt-4o' },
        },
      },
      {
        id: 'summarize',
        type: 'custom',
        position: { x: 550, y: 100 },
        data: {
          type: 'agent',
          label: 'Writer Agent',
          description: 'Create summary report',
          config: { agentId: 'writer', model: 'gpt-4o' },
        },
      },
      {
        id: 'end',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          type: 'end',
          label: 'Complete',
          description: 'Research complete',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'gather', animated: true },
      { id: 'e2', source: 'gather', target: 'analyze', animated: true },
      { id: 'e3', source: 'analyze', target: 'summarize', animated: true },
      { id: 'e4', source: 'summarize', target: 'end', animated: true },
    ],
  },
  {
    id: 'content-generation',
    name: 'Content Generation Pipeline',
    description: 'Generate and refine content with AI agents',
    category: 'automation',
    nodes: [
      {
        id: 'start',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          type: 'start',
          label: 'Start',
          description: 'Begin content generation',
        },
      },
      {
        id: 'ideation',
        type: 'custom',
        position: { x: 250, y: 100 },
        data: {
          type: 'agent',
          label: 'Ideation Agent',
          description: 'Generate content ideas',
          config: { agentId: 'writer', model: 'gpt-4o' },
        },
      },
      {
        id: 'draft',
        type: 'custom',
        position: { x: 400, y: 100 },
        data: {
          type: 'agent',
          label: 'Writer Agent',
          description: 'Create first draft',
          config: { agentId: 'writer', model: 'gpt-4o' },
        },
      },
      {
        id: 'review',
        type: 'custom',
        position: { x: 550, y: 100 },
        data: {
          type: 'approval',
          label: 'Human Review',
          description: 'Review and approve content',
          config: { requiresApproval: true },
        },
      },
      {
        id: 'polish',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          type: 'agent',
          label: 'Editor Agent',
          description: 'Polish and finalize content',
          config: { agentId: 'writer', model: 'gpt-4o' },
        },
      },
      {
        id: 'end',
        type: 'custom',
        position: { x: 850, y: 100 },
        data: { type: 'end', label: 'Complete', description: 'Content ready' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'ideation', animated: true },
      { id: 'e2', source: 'ideation', target: 'draft', animated: true },
      { id: 'e3', source: 'draft', target: 'review', animated: true },
      { id: 'e4', source: 'review', target: 'polish', animated: true },
      { id: 'e5', source: 'polish', target: 'end', animated: true },
    ],
  },
  {
    id: 'code-review',
    name: 'Code Review Workflow',
    description: 'Automated code review and testing pipeline',
    category: 'development',
    nodes: [
      {
        id: 'start',
        type: 'custom',
        position: { x: 100, y: 150 },
        data: {
          type: 'start',
          label: 'Code Submitted',
          description: 'New code submission',
        },
      },
      {
        id: 'lint',
        type: 'custom',
        position: { x: 250, y: 150 },
        data: {
          type: 'task',
          label: 'Lint Check',
          description: 'Run linting and formatting checks',
        },
      },
      {
        id: 'test',
        type: 'custom',
        position: { x: 400, y: 150 },
        data: {
          type: 'task',
          label: 'Run Tests',
          description: 'Execute test suite',
        },
      },
      {
        id: 'condition',
        type: 'custom',
        position: { x: 550, y: 150 },
        data: {
          type: 'condition',
          label: 'Tests Pass?',
          description: 'Check if all tests pass',
          config: { condition: 'testResults.passed === true' },
        },
      },
      {
        id: 'ai-review',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          type: 'agent',
          label: 'Code Review AI',
          description: 'AI code review',
          config: { agentId: 'coder', model: 'gpt-4o' },
        },
      },
      {
        id: 'fix',
        type: 'custom',
        position: { x: 700, y: 200 },
        data: {
          type: 'task',
          label: 'Fix Issues',
          description: 'Address failed tests',
        },
      },
      {
        id: 'approve',
        type: 'custom',
        position: { x: 850, y: 100 },
        data: {
          type: 'approval',
          label: 'Final Approval',
          description: 'Human approval required',
          config: { requiresApproval: true },
        },
      },
      {
        id: 'merge',
        type: 'custom',
        position: { x: 1000, y: 150 },
        data: {
          type: 'end',
          label: 'Merge',
          description: 'Merge to main branch',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'lint', animated: true },
      { id: 'e2', source: 'lint', target: 'test', animated: true },
      { id: 'e3', source: 'test', target: 'condition', animated: true },
      {
        id: 'e4',
        source: 'condition',
        target: 'ai-review',
        label: 'Yes',
        animated: true,
      },
      {
        id: 'e5',
        source: 'condition',
        target: 'fix',
        label: 'No',
        animated: true,
      },
      { id: 'e6', source: 'fix', target: 'test', animated: true },
      { id: 'e7', source: 'ai-review', target: 'approve', animated: true },
      { id: 'e8', source: 'approve', target: 'merge', animated: true },
    ],
  },
  {
    id: 'data-pipeline',
    name: 'Data Processing Pipeline',
    description: 'ETL workflow for data transformation and analysis',
    category: 'data',
    nodes: [
      {
        id: 'start',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          type: 'start',
          label: 'Data Input',
          description: 'Receive raw data',
        },
      },
      {
        id: 'extract',
        type: 'custom',
        position: { x: 250, y: 100 },
        data: {
          type: 'task',
          label: 'Extract',
          description: 'Extract data from sources',
        },
      },
      {
        id: 'validate',
        type: 'custom',
        position: { x: 400, y: 100 },
        data: {
          type: 'task',
          label: 'Validate',
          description: 'Validate data quality',
        },
      },
      {
        id: 'transform',
        type: 'custom',
        position: { x: 550, y: 100 },
        data: {
          type: 'parallel',
          label: 'Transform',
          description: 'Parallel data transformations',
        },
      },
      {
        id: 'analyze',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          type: 'agent',
          label: 'Analysis Agent',
          description: 'AI-powered analysis',
          config: { agentId: 'analyst', model: 'gpt-4o' },
        },
      },
      {
        id: 'store',
        type: 'custom',
        position: { x: 850, y: 100 },
        data: {
          type: 'task',
          label: 'Store',
          description: 'Save to database',
        },
      },
      {
        id: 'notify',
        type: 'custom',
        position: { x: 1000, y: 100 },
        data: {
          type: 'webhook',
          label: 'Notify',
          description: 'Send completion notification',
        },
      },
      {
        id: 'end',
        type: 'custom',
        position: { x: 1150, y: 100 },
        data: {
          type: 'end',
          label: 'Complete',
          description: 'Pipeline complete',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'extract', animated: true },
      { id: 'e2', source: 'extract', target: 'validate', animated: true },
      { id: 'e3', source: 'validate', target: 'transform', animated: true },
      { id: 'e4', source: 'transform', target: 'analyze', animated: true },
      { id: 'e5', source: 'analyze', target: 'store', animated: true },
      { id: 'e6', source: 'store', target: 'notify', animated: true },
      { id: 'e7', source: 'notify', target: 'end', animated: true },
    ],
  },
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter((template) => template.category === category);
}
