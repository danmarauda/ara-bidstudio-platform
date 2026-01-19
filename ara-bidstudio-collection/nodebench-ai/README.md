# NodeBench AI

An advanced AI-native document workspace platform that combines real-time collaboration, multi-agent AI orchestration, and intelligent content management to create the ultimate productivity environment.

![NodeBench AI](https://img.shields.io/badge/NodeBench-AI--Native-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square)
![Convex](https://img.shields.io/badge/Convex-1.28.2-black?style=flat-square)

## 🌟 Overview

NodeBench AI is a comprehensive AI-powered workspace that transforms how teams create, collaborate, and manage knowledge. Built with cutting-edge AI integration and real-time capabilities, it provides an intelligent environment where AI anticipates user needs and seamlessly integrates into every aspect of knowledge work.

### Key Features

- **🤖 Multi-Agent AI System**: Specialized AI agents for document analysis, research, code generation, and workflow orchestration
- **📄 Advanced Document Intelligence**: AI-powered document processing, analysis, and management with multimodal understanding
- **🔄 Real-Time Collaboration**: Live editing, streaming AI responses, and multi-user presence
- **☁️ Google Drive Integration**: Seamless search and content extraction from Google Drive files
- **📅 Calendar & Task Management**: Integrated planning with AI-assisted scheduling and task management
- **🔧 MCP Protocol Support**: Extensible tool ecosystem with Model Context Protocol integration
- **🎨 Atomic Design System**: Comprehensive component library with consistent UI/UX patterns
- **⚡ High Performance**: Optimized for sub-100ms response times with intelligent caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun package manager
- Convex account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodebench-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   Create a `.env.local` file with your API keys:
   ```env
   # Convex
   CONVEX_DEPLOYMENT=<your-convex-deployment>

   # AI Providers
   OPENAI_API_KEY=<your-openai-key>
   GOOGLE_GENAI_API_KEY=<your-gemini-key>

   # Authentication
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>

   # Email (optional)
   RESEND_API_KEY=<your-resend-key>
   EMAIL_FROM=<your-email-from>
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

   This will start both the frontend (Vite) and backend (Convex) servers.

5. **Open your browser**

   Navigate to `http://localhost:5173` to access the application.

## 🏗️ Architecture

### Frontend (React + TypeScript)

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Convex for real-time data synchronization
- **UI Components**: Custom component library with atomic design principles
- **Routing**: React Router for navigation

### Backend (Convex)

- **Database**: Convex real-time database with 50+ data models
- **Authentication**: Convex Auth with Google OAuth
- **Real-time**: Live queries and mutations for collaborative features
- **AI Integration**: Multi-provider AI orchestration (OpenAI, Google Gemini)
- **File Storage**: Convex storage for document assets

### Key Components

#### Document Management
- Hierarchical document structure with folders
- Real-time collaborative editing with ProseMirror
- AI-powered content analysis and summarization
- File upload and processing (PDF, images, spreadsheets)

#### AI Agent System
- **Orchestrator Agent**: Coordinates complex multi-step tasks
- **Document Agent**: Handles document analysis and editing
- **Research Agent**: Performs web research and data gathering
- **Code Agent**: Generates and reviews code
- **Media Agent**: Processes images, videos, and multimedia content

#### Calendar & Planning
- Integrated calendar with AI-assisted scheduling
- Task management with priority and deadline tracking
- Meeting preparation and agenda generation
- Timeline visualization for project planning

#### Google Drive Integration
- Search across Google Drive files
- Content extraction from Docs, Sheets, and Slides
- Real-time synchronization
- Permission-aware access control

## 📁 Project Structure

```
nodebench-ai/
├── convex/                    # Backend functions and database schema
│   ├── agents/               # AI agent implementations
│   ├── orchestrator/         # Multi-agent coordination
│   ├── tools/                # MCP tools and integrations
│   ├── schema.ts             # Database schema (50+ tables)
│   └── router.ts             # HTTP routes and API endpoints
├── src/
│   ├── components/           # React components
│   │   ├── AIChatPanel/      # AI chat interface
│   │   ├── DocumentsHomeHub/ # Document management
│   │   ├── CalendarHomeHub/  # Calendar and planning
│   │   └── GoogleDriveSearch/# Drive integration
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   └── styles/               # CSS and design tokens
├── public/                   # Static assets
├── tests/                    # Test files
└── docs/                     # Documentation
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend and backend servers
npm run dev:frontend     # Start only frontend (Vite)
npm run dev:backend      # Start only backend (Convex)

# Building
npm run build           # Build for production
npm run lint            # TypeScript and ESLint checking
npm run lint:eslint     # ESLint only
npm run test            # Run tests with Vitest
npm run test:run        # Run tests once (CI)

# AI Evaluation
npm run eval            # Run AI evaluation suite
npm run eval:quick      # Quick evaluation tests
npm run eval:all        # Comprehensive evaluation

# Documentation
npm run storybook       # Start Storybook for component docs
```

### Testing

The project includes comprehensive testing:

```bash
# Unit tests
npm run test

# AI evaluation tests
npm run eval:docs       # Document tool evaluation
npm run eval:web        # Web search evaluation
npm run eval:workflow   # Workflow evaluation
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Code formatting
- **Vitest**: Unit testing framework
- **Storybook**: Component documentation

## 🤖 AI Features

### Multi-Agent Orchestration

NodeBench AI employs a sophisticated multi-agent system:

1. **Queen Agent**: High-level task planning and delegation
2. **Coordinator Agent**: Workflow management and progress tracking
3. **Specialized Agents**:
   - Document analysis and editing
   - Research and data gathering
   - Code generation and review
   - Media processing and analysis
   - Calendar and task management

### AI Providers

- **Google Gemini 3 Pro**: Complex reasoning and multimodal understanding
- **Google Gemini 2.5 Flash**: Fast responses and high-volume processing
- **OpenAI GPT-4**: Advanced language understanding
- **Custom Models**: Fine-tuned models for specific tasks

### Intelligent Features

- **Contextual Assistance**: AI understands document context and provides relevant suggestions
- **Automated Summarization**: AI generates concise summaries of long documents
- **Smart Search**: Cross-document and cross-format search capabilities
- **Content Generation**: AI-assisted writing and content creation
- **Quality Assurance**: AI-powered proofreading and fact-checking

## 🔌 Integrations

### Model Context Protocol (MCP)

NodeBench AI supports MCP for extensible tool integration:

- **Web Search**: Integration with search engines and APIs
- **Document Processing**: Advanced file analysis and conversion
- **API Integrations**: Connect with external services and databases
- **Custom Tools**: Build and integrate specialized tools

### Google Drive

- **Seamless Search**: Search across all Google Drive files
- **Content Extraction**: Automatic extraction from Google Workspace files
- **Real-time Sync**: Live synchronization with Google Drive
- **Permission Management**: Respectful of sharing permissions

### Calendar Integration

- **Google Calendar**: Bidirectional sync with Google Calendar
- **Meeting Preparation**: AI-generated agendas and materials
- **Smart Scheduling**: AI-assisted meeting scheduling and optimization

## 📊 Data Models

The application uses 50+ database tables supporting complex workflows:

- **Documents**: Hierarchical document structure with metadata
- **Nodes**: ProseMirror blocks for rich text editing
- **Tasks**: Task management with priorities and deadlines
- **Events**: Calendar events and scheduling
- **Agents**: AI agent configurations and runs
- **Files**: File storage and processing metadata
- **Users**: User profiles and preferences
- **Integrations**: OAuth tokens and API configurations

## 🚀 Deployment

### Convex Deployment

```bash
npx convex deploy
```

### Environment Variables

Production environment variables:

```env
# Convex
CONVEX_DEPLOYMENT=<production-deployment-id>

# AI Providers
OPENAI_API_KEY=<production-openai-key>
GOOGLE_GENAI_API_KEY=<production-gemini-key>

# Authentication
GOOGLE_CLIENT_ID=<production-google-client-id>
GOOGLE_CLIENT_SECRET=<production-google-client-secret>

# Email
RESEND_API_KEY=<production-resend-key>
EMAIL_FROM=<production-email-from>

# Optional: Analytics, Monitoring
ANALYTICS_KEY=<analytics-key>
SENTRY_DSN=<sentry-dsn>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Submit a pull request

### Development Guidelines

- Follow the atomic design principles for component creation
- Use TypeScript strictly with proper type definitions
- Write comprehensive tests for new features
- Follow the established code formatting and linting rules
- Document new features and API changes

## 📝 License

This project is proprietary software. See LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions for questions and feedback

## 🗺️ Roadmap

### Current Features (v1.0)
- ✅ Multi-agent AI orchestration
- ✅ Real-time collaborative editing
- ✅ Google Drive integration
- ✅ Advanced document intelligence
- ✅ Calendar and task management
- ✅ MCP protocol support

### Upcoming Features
- 🔄 Enhanced multimodal processing
- 🔄 Predictive AI assistance
- 🔄 Advanced analytics dashboard
- 🔄 Mobile application
- 🔄 Enterprise features (SSO, audit logs)

---

**NodeBench AI** - Where AI meets productivity in the most intelligent way possible.</content>
<parameter name="filePath">/Users/alias/Downloads/ara-bidstudio-collection/nodebench-ai/README.md