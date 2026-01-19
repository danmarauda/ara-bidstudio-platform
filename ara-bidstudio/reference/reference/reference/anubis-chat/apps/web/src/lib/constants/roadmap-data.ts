import {
  Brain,
  CheckCircle2,
  Clock,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';

export type RoadmapFeature = {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  progress: number;
  category: 'MCP' | 'Memories' | 'Workflows' | 'General';
  quarter: string;
  estimatedDate?: string;
  details?: string[];
  links?: Array<{ label: string; href: string }>;
  icon: React.ComponentType<{ className?: string }>;
};

export const roadmapData: RoadmapFeature[] = [
  // Q3 2025
  {
    id: 'social-creation',
    title: 'Social Creation',
    description: 'Establish official social presence and community channels.',
    status: 'completed',
    progress: 100,
    category: 'General',
    quarter: 'Q3 2025',
    estimatedDate: 'Completed',
    icon: Users,
  },
  {
    id: 'platform-creation',
    title: 'Platform Creation',
    description: 'Core platform architecture and foundations built.',
    status: 'completed',
    progress: 100,
    category: 'General',
    quarter: 'Q3 2025',
    estimatedDate: 'Completed',
    icon: Settings2,
  },
  {
    id: 'platform-launch',
    title: 'Platform Launch',
    description: 'Public launch of the ANUBIS platform.',
    status: 'completed',
    progress: 100,
    category: 'General',
    quarter: 'Q3 2025',
    estimatedDate: 'Completed',
    icon: Rocket,
  },
  {
    id: 'first-agent-launch-anubis',
    title: 'First Agent Launch (Anubis)',
    description: 'Release the first production agent: Anubis.',
    status: 'in-progress',
    progress: 60,
    category: 'General',
    quarter: 'Q3 2025',
    icon: Brain,
  },
  {
    id: 'first-agent-token-anubis',
    title: 'First Agent Token ($ANUBIS)',
    description: 'Launch the $ANUBIS token aligned with the first agent.',
    status: 'in-progress',
    progress: 50,
    category: 'General',
    quarter: 'Q3 2025',
    icon: Sparkles,
  },
  {
    id: 'memory-management',
    title: 'Memory Management',
    description: 'Long-term memory storage and retrieval for agents.',
    status: 'in-progress',
    progress: 40,
    category: 'Memories',
    quarter: 'Q3 2025',
    icon: Upload,
  },
  {
    id: 'mobile-application-build',
    title: 'Mobile Application Build',
    description: 'Begin development of the native mobile application.',
    status: 'in-progress',
    progress: 35,
    category: 'General',
    quarter: 'Q3 2025',
    icon: Settings2,
  },
  {
    id: 'social-forum',
    title: 'Social Forum',
    description: 'Community forum for discussions, support, and updates.',
    status: 'in-progress',
    progress: 45,
    category: 'General',
    quarter: 'Q3 2025',
    icon: Users,
  },
  {
    id: 'tooling-integration',
    title: 'Tooling Integration',
    description:
      'Integrate key tools and services to enhance agent capabilities.',
    status: 'in-progress',
    progress: 55,
    category: 'MCP',
    quarter: 'Q3 2025',
    icon: Settings2,
  },
  {
    id: 'more-models',
    title: 'MORE MODELS',
    description: 'Expand supported AI models and switching capabilities.',
    status: 'in-progress',
    progress: 50,
    category: 'General',
    quarter: 'Q3 2025',
    icon: Brain,
  },

  // Q4 2025
  {
    id: 'whitepaper-release',
    title: 'Whitepaper Release',
    description: 'Publish the ANUBIS whitepaper.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Upload,
  },
  {
    id: 'second-agent',
    title: 'Second Agent',
    description: 'Develop and prepare the second production agent.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Brain,
  },
  {
    id: 'second-agent-token',
    title: 'Second Agent Token',
    description: 'Token launch aligned with the second agent.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Sparkles,
  },
  {
    id: 'mobile-application-launch',
    title: 'Mobile Application Launch',
    description: 'Launch the native mobile application.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Rocket,
  },
  {
    id: 'prompt-library-book-of-the-dead',
    title: 'Prompt Library (Book of the Dead)',
    description: 'Curated prompt library for power users and teams.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Upload,
  },
  {
    id: 'mcp-integration-beta-private',
    title: 'MCP Integration (Beta-Private)',
    description: 'Private beta for Model Context Protocol integrations.',
    status: 'upcoming',
    progress: 0,
    category: 'MCP',
    quarter: 'Q4 2025',
    icon: Sparkles,
  },
  {
    id: 'even-more-models',
    title: 'EVEN MORE MODELS',
    description: 'Further expand model support and capabilities.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Brain,
  },
  {
    id: 'api-access-beta-private',
    title: 'API Access (Beta-Private)',
    description: 'Private beta for external API access.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: 'Q4 2025',
    icon: Settings2,
  },

  // 2026
  {
    id: 'audits',
    title: 'Audits',
    description: 'Security and smart contract audits where applicable.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: '2026',
    icon: CheckCircle2,
  },
  {
    id: 'api-access-alpha',
    title: 'API Access (Alpha)',
    description: 'Early access API for developers and partners.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: '2026',
    icon: Settings2,
  },
  {
    id: 'enterprise-solutions',
    title: 'Enterprise Solutions',
    description: 'Enterprise features, support, and deployment options.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: '2026',
    icon: Users,
  },
  {
    id: 'global-expansion',
    title: 'Global Expansion',
    description: 'Expand availability and partnerships internationally.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: '2026',
    icon: Rocket,
  },
  {
    id: 'more-agents',
    title: 'More Agents',
    description: 'Introduce additional specialized agents.',
    status: 'upcoming',
    progress: 0,
    category: 'General',
    quarter: '2026',
    icon: Brain,
  },
];

export const statusConfig = {
  completed: {
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: Rocket,
  },
  upcoming: {
    label: 'Upcoming',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Clock,
  },
} as const;

export const categoryColors = {
  MCP: 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  Memories:
    'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Workflows:
    'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
  General: 'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400',
} as const;
