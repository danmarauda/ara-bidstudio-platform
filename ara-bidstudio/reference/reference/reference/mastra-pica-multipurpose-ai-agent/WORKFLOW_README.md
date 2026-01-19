# Project Onboarding Workflow

This Mastra workflow automates the setup of new projects across multiple platforms including GitHub, Slack, and Google Drive.

## Features

The **Project Onboarding Workflow** provides:

### 🔄 **Multi-Platform Setup**
- **GitHub Repository** creation with README and .gitignore
- **Slack Channel** setup for team communication
- **Google Drive Folder** creation with organized subfolders
- **Configurable platform selection** - enable/disable any combination

### 📝 **Comprehensive Project Management**
- **Project validation** with required fields
- **Team member management** with email validation
- **Tech stack documentation**
- **Priority and deadline tracking**
- **Automated project ID generation**

### 🤖 **AI-Powered Assistance**
- **Intelligent repository setup** based on tech stack
- **Automated channel topic and pinning**
- **Generated project summaries** and welcome messages
- **Smart folder structure** creation

## Workflow Steps

The workflow consists of 5 sequential steps:

1. **Validate Project Data** - Validates input and generates unique project ID
2. **Create GitHub Repository** - Sets up version control with appropriate configuration
3. **Create Google Drive Folder** - Establishes shared document storage with subfolders
4. **Create Slack Channel** - Configures team communication channel
5. **Generate Project Summary** - Creates comprehensive onboarding documentation

## Usage

### Basic Example

```typescript
import { mastra } from './mastra';

const workflow = mastra.getWorkflow('projectOnboardingWorkflow');
const run = await workflow.createRunAsync();

const result = await run.start({
  inputData: {
    projectName: 'AI-Powered Task Manager',
    description: 'A revolutionary task management application.',
    teamMembers: ['john@company.com', 'sarah@company.com'],
    techStack: ['React', 'TypeScript', 'Node.js'],
    priority: 'high',
    deadline: '2024-03-15',
    platforms: {
      github: true,
      slack: true,
      googleDrive: true,
    }
  }
});

if (result.status === 'success') {
  console.log('✅ Project onboarding completed!');
  console.log(`Project ID: ${result.result.projectId}`);
  console.log(`GitHub: ${result.result.setupLinks.github}`);
  console.log(`Slack: ${result.result.setupLinks.slack}`);
  console.log(`Drive: ${result.result.setupLinks.googleDrive}`);
}
```

### Running Examples

```bash
# Run all workflow examples
npx tsx src/example-workflow-usage.ts

# Or run individual functions
npx tsx -e "
import { exampleProjectOnboardingWorkflow } from './src/example-workflow-usage';
exampleProjectOnboardingWorkflow();
"
```

## Input Schema

```typescript
{
  projectName: string;        // Required: Project name
  description: string;        // Required: Min 10 characters
  teamMembers: string[];      // Required: Valid email addresses
  techStack?: string[];       // Optional: Technology stack
  deadline?: string;          // Optional: Project deadline
  priority: 'low' | 'medium' | 'high';  // Default: 'medium'
  platforms: {                // Platform configuration
    github: boolean;          // Default: true
    slack: boolean;           // Default: true
    googleDrive: boolean;     // Default: true
  }
}
```

## Output Schema

```typescript
{
  projectSummary: string;           // AI-generated project summary
  welcomeMessage: string;           // Formatted welcome message
  onboardingComplete: boolean;      // Success status
  projectId: string;               // Unique project identifier
  setupLinks: {                   // Platform URLs
    github?: string;              // Repository URL
    googleDrive?: string;         // Drive folder URL
    slack?: string;              // Slack channel link
  }
}
```

## Platform-Specific Features

### GitHub Integration
- Repository creation with project name as slug
- Automatic README.md initialization
- Tech stack-appropriate .gitignore
- Private repository by default

### Slack Integration
- Channel naming: `proj-{project-slug}`
- Automatic team member invitations
- Pinned project information (deadline, priority)
- Topic set to project description

### Google Drive Integration
- Main folder: `{Project Name} - Project Files`
- Subfolders: Documentation, Design Assets, Meeting Notes, Resources
- Team member sharing with edit permissions

## Configuration Examples

### Minimal Setup (GitHub Only)
```typescript
{
  projectName: 'Quick Prototype',
  description: 'A quick prototype for testing.',
  teamMembers: ['developer@company.com'],
  platforms: {
    github: true,
    slack: false,
    googleDrive: false,
  }
}
```

### Documentation Project (No GitHub)
```typescript
{
  projectName: 'API Documentation',
  description: 'Comprehensive API documentation project.',
  teamMembers: ['writer@company.com'],
  techStack: ['Markdown', 'Docusaurus'],
  platforms: {
    github: false,
    slack: true,
    googleDrive: true,
  }
}
```

### Full Enterprise Setup
```typescript
{
  projectName: 'Enterprise Dashboard',
  description: 'Business analytics dashboard.',
  teamMembers: ['pm@company.com', 'dev1@company.com', 'dev2@company.com'],
  techStack: ['Vue.js', 'Python', 'PostgreSQL', 'Docker'],
  deadline: '2024-04-30',
  priority: 'high',
  platforms: {
    github: true,
    slack: true,
    googleDrive: true,
  }
}
```

## Workflow Result Handling

The workflow returns different status types:

### Success
```typescript
if (result.status === 'success') {
  // Access result data
  const { projectId, setupLinks, welcomeMessage } = result.result;
}
```

### Suspended (if workflow pauses)
```typescript
if (result.status === 'suspended') {
  // Handle suspended steps
  const suspendedSteps = result.suspended;
  // Resume with additional data if needed
}
```

### Failed
```typescript
if (result.status === 'failed') {
  // Handle error
  console.error('Workflow failed:', result.error);
}
```

## Integration with Pica

This workflow leverages **Pica's 100+ integrations** through the project assistant agent. In a production environment, you would:

1. **Configure Pica credentials** in your `.env` file
2. **Enable specific connectors** for GitHub, Slack, Google Drive
3. **Replace simulated API calls** with actual Pica tool integrations
4. **Use Pica's authentication** for secure platform access

Example Pica integration:
```typescript
// Instead of simulated responses, use actual Pica tools
const githubTool = pica.tools.github.createRepository;
const slackTool = pica.tools.slack.createChannel;
const driveTool = pica.tools.googleDrive.createFolder;
```

## Advanced Features

### Workflow Monitoring
Monitor step-by-step execution with the `.watch()` method:

```typescript
const run = await workflow.createRunAsync();

run.watch((event) => {
  console.log(`Step: ${event.step}, Status: ${event.status}`);
});

const result = await run.start({ inputData });
```

### Custom Platform Logic
The workflow includes conditional logic that skips platform setup when disabled:

```typescript
if (!inputData.platforms?.github) {
  return {
    ...inputData,
    githubSuccess: false,
    repositoryUrl: '',
    repositoryName: '',
  };
}
```

This ensures the workflow completes successfully even with partial platform configurations.

## Troubleshooting

### Common Issues

1. **Agent Not Found Error**
   ```
   Error: Project Assistant agent not found
   ```
   Ensure the `projectAssistantAgent` is properly registered in your Mastra instance.

2. **Schema Validation Errors**
   ```
   Error: Content too short: X characters
   ```
   Verify your input meets the minimum requirements (description ≥ 10 chars, valid emails, etc.).

3. **Platform Setup Failures**
   Individual platform failures won't stop the workflow. Check the success flags in the result:
   ```typescript
   console.log('GitHub success:', result.result.setupLinks.github ? 'Yes' : 'No');
   ```

### Development Tips

- Use **TypeScript** for full type safety
- Enable **detailed logging** during development
- Test with **minimal configurations** first
- Monitor **step-by-step execution** for debugging

## Next Steps

1. **Enhance with Real Integrations** - Replace simulated API calls with actual Pica integrations
2. **Add More Platforms** - Extend support for Notion, Trello, Jira, etc.
3. **Implement Webhooks** - Add real-time notifications for workflow completion
4. **Create Templates** - Build project templates for different types of work
5. **Add Analytics** - Track workflow usage and success rates
