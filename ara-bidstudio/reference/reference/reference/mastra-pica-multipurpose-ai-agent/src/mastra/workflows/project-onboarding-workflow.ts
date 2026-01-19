import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Base project schema
const projectInputSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  teamMembers: z.array(z.string().email()).min(1, "At least one team member email is required"),
  techStack: z.array(z.string()).default([]),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  platforms: z.object({
    github: z.boolean().default(true),
    slack: z.boolean().default(true),
    googleDrive: z.boolean().default(true),
  }).default({}),
});

// Cumulative schema that builds up through the workflow
const step1OutputSchema = projectInputSchema.extend({
  projectId: z.string(),
  createdAt: z.string(),
  slug: z.string(),
});

const step2OutputSchema = step1OutputSchema.extend({
  repositoryUrl: z.string(),
  repositoryName: z.string(),
  githubSuccess: z.boolean(),
});

const step3OutputSchema = step2OutputSchema.extend({
  driveFolderUrl: z.string(),
  driveFolderId: z.string(),
  driveSuccess: z.boolean(),
});

const step4OutputSchema = step3OutputSchema.extend({
  channelName: z.string(),
  channelId: z.string(),
  slackSuccess: z.boolean(),
});

const finalOutputSchema = z.object({
  projectSummary: z.string(),
  welcomeMessage: z.string(),
  onboardingComplete: z.boolean(),
  setupLinks: z.object({
    github: z.string().optional(),
    googleDrive: z.string().optional(),
    slack: z.string().optional(),
  }),
  projectId: z.string(),
});

// Step 1: Validate and prepare project data
const validateProjectData = createStep({
  id: 'validate-project-data',
  description: 'Validates and prepares project information for onboarding',
  inputSchema: projectInputSchema,
  outputSchema: step1OutputSchema,
  execute: async ({ inputData }) => {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = inputData.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      ...inputData,
      projectId,
      slug,
      createdAt: new Date().toISOString(),
    };
  },
});

// Step 2: Create GitHub repository
const createGitHubRepository = createStep({
  id: 'create-github-repo',
  description: 'Creates a new GitHub repository for the project',
  inputSchema: step1OutputSchema,
  outputSchema: step2OutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('projectAssistantAgent');
    if (!agent) {
      throw new Error('Project Assistant agent not found');
    }

    if (!inputData.platforms?.github) {
      return {
        ...inputData,
        repositoryUrl: '',
        repositoryName: '',
        githubSuccess: false,
      };
    }

    try {
      const prompt = `Create a new GitHub repository with these details:
      - Name: ${inputData.slug}
      - Description: ${inputData.description}
      - Make it private initially
      - Initialize with README
      - Add .gitignore for ${inputData.techStack.join(', ') || 'general development'}
      
      Please create the repository and return the repository URL.`;

      const response = await agent.generate(prompt, {
        resourceId: `system-${inputData.projectId}`,
        threadId: `github-setup-${inputData.projectId}`,
      });

      // In a real implementation, this would use Pica's GitHub integration
      // For now, we'll simulate the response
      return {
        ...inputData,
        repositoryUrl: `https://github.com/user/${inputData.slug}`,
        repositoryName: inputData.slug,
        githubSuccess: true,
      };
    } catch (error) {
      console.error('Failed to create GitHub repository:', error);
      return {
        ...inputData,
        repositoryUrl: '',
        repositoryName: '',
        githubSuccess: false,
      };
    }
  },
});

// Step 3: Create Google Drive folder
const createGoogleDriveFolder = createStep({
  id: 'create-google-drive-folder',
  description: 'Creates a shared project folder in Google Drive',
  inputSchema: step2OutputSchema,
  outputSchema: step3OutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('projectAssistantAgent');
    if (!agent) {
      throw new Error('Project Assistant agent not found');
    }

    if (!inputData.platforms?.googleDrive) {
      return {
        ...inputData,
        driveFolderUrl: '',
        driveFolderId: '',
        driveSuccess: false,
      };
    }

    try {
      const prompt = `Create a Google Drive folder for project "${inputData.projectName}":
      - Folder name: ${inputData.projectName} - Project Files
      - Share with team members: ${inputData.teamMembers.join(', ')}
      - Create subfolders: Documentation, Design Assets, Meeting Notes, Resources
      - Set permissions to allow editing for team members
      
      Please create the folder structure and return the main folder URL.`;

      const response = await agent.generate(prompt, {
        resourceId: `system-${inputData.projectId}`,
        threadId: `drive-setup-${inputData.projectId}`,
      });

      // In a real implementation, this would use Pica's Google Drive integration
      return {
        ...inputData,
        driveFolderUrl: `https://drive.google.com/drive/folders/example_folder_id`,
        driveFolderId: 'example_folder_id',
        driveSuccess: true,
      };
    } catch (error) {
      console.error('Failed to create Google Drive folder:', error);
      return {
        ...inputData,
        driveFolderUrl: '',
        driveFolderId: '',
        driveSuccess: false,
      };
    }
  },
});

// Step 4: Create Slack channel
const createSlackChannel = createStep({
  id: 'create-slack-channel',
  description: 'Creates a dedicated Slack channel for the project',
  inputSchema: step3OutputSchema,
  outputSchema: step4OutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('projectAssistantAgent');
    if (!agent) {
      throw new Error('Project Assistant agent not found');
    }

    if (!inputData.platforms?.slack) {
      return {
        ...inputData,
        channelName: '',
        channelId: '',
        slackSuccess: false,
      };
    }

    try {
      const channelName = `proj-${inputData.slug}`;
      const prompt = `Create a Slack channel for project communication:
      - Channel name: #${channelName}
      - Topic: ${inputData.description}
      - Invite team members: ${inputData.teamMembers.join(', ')}
      - Pin important information: Project deadline ${inputData.deadline || 'TBD'}, Priority: ${inputData.priority}
      
      Please create the channel and invite the team members.`;

      const response = await agent.generate(prompt, {
        resourceId: `system-${inputData.projectId}`,
        threadId: `slack-setup-${inputData.projectId}`,
      });

      // In a real implementation, this would use Pica's Slack integration
      return {
        ...inputData,
        channelName,
        channelId: `C${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        slackSuccess: true,
      };
    } catch (error) {
      console.error('Failed to create Slack channel:', error);
      return {
        ...inputData,
        channelName: '',
        channelId: '',
        slackSuccess: false,
      };
    }
  },
});

// Step 5: Generate project summary and welcome message
const generateProjectSummary = createStep({
  id: 'generate-project-summary',
  description: 'Generates a comprehensive project summary and sends welcome message',
  inputSchema: step4OutputSchema,
  outputSchema: finalOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('projectAssistantAgent');
    if (!agent) {
      throw new Error('Project Assistant agent not found');
    }

    const prompt = `Generate a comprehensive project onboarding summary for "${inputData.projectName}":

    Project Details:
    - Name: ${inputData.projectName}
    - Description: ${inputData.description}
    - Team: ${inputData.teamMembers.join(', ')}
    - Tech Stack: ${inputData.techStack.join(', ') || 'Not specified'}
    - Priority: ${inputData.priority}
    - Deadline: ${inputData.deadline || 'TBD'}

    Created Resources:
    - GitHub Repository: ${inputData.githubSuccess ? inputData.repositoryUrl : 'Not created'}
    - Google Drive Folder: ${inputData.driveSuccess ? inputData.driveFolderUrl : 'Not created'}
    - Slack Channel: ${inputData.slackSuccess ? `#${inputData.channelName}` : 'Not created'}

    Please generate a professional project summary with next steps for the team.`;

    const response = await agent.generate(prompt, {
      resourceId: `system-${inputData.projectId}`,
      threadId: `summary-${inputData.projectId}`,
    });

    const welcomeMessage = `🎉 Welcome to ${inputData.projectName}!

Your project has been successfully set up with the following resources:

📂 **Project Resources:**
${inputData.githubSuccess ? `• GitHub Repository: ${inputData.repositoryUrl}` : '• GitHub: Setup failed'}
${inputData.driveSuccess ? `• Google Drive Folder: ${inputData.driveFolderUrl}` : '• Google Drive: Setup failed'}
${inputData.slackSuccess ? `• Slack Channel: #${inputData.channelName}` : '• Slack: Setup failed'}

👥 **Team Members:** ${inputData.teamMembers.join(', ')}
📅 **Deadline:** ${inputData.deadline || 'To be determined'}
🏷️ **Priority:** ${inputData.priority.toUpperCase()}
🔧 **Tech Stack:** ${inputData.techStack.join(', ') || 'Not specified'}

**Next Steps:**
1. Clone the repository and set up your development environment
2. Join the Slack channel for team communication
3. Access the Google Drive folder for shared documents
4. Review the project requirements and timeline

Let's build something amazing together! 🚀`;

    return {
      projectSummary: response.text,
      welcomeMessage,
      onboardingComplete: true,
      setupLinks: {
        github: inputData.githubSuccess ? inputData.repositoryUrl : undefined,
        googleDrive: inputData.driveSuccess ? inputData.driveFolderUrl : undefined,
        slack: inputData.slackSuccess ? `slack://channel?team=YOUR_TEAM&id=${inputData.channelId}` : undefined,
      },
      projectId: inputData.projectId,
    };
  },
});

// Create the main workflow
const projectOnboardingWorkflow = createWorkflow({
  id: 'project-onboarding-workflow',
  description: 'Comprehensive workflow to onboard a new project across multiple platforms',
  inputSchema: projectInputSchema,
  outputSchema: finalOutputSchema,
})
  .then(validateProjectData)
  .then(createGitHubRepository)
  .then(createGoogleDriveFolder)
  .then(createSlackChannel)
  .then(generateProjectSummary);

// Commit the workflow
projectOnboardingWorkflow.commit();

export { projectOnboardingWorkflow };
