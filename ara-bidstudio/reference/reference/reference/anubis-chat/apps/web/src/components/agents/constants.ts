import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Code,
  Database,
  DollarSign,
  Eye,
  Globe,
  Image,
  Zap as Lightning,
  Link,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  Mic,
  PieChart,
  RefreshCw,
  Send,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Vote,
  Wallet,
} from 'lucide-react';

interface Capability {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  premium?: boolean;
  beta?: boolean;
  dependencies?: string[];
  incompatible?: string[];
}

export const capabilities: Capability[] = [
  // Blockchain & Trading
  {
    id: 'trading',
    name: 'Token Trading',
    description: 'Execute swaps and trades on DEXs',
    category: 'Trading',
    icon: TrendingUp,
  },
  {
    id: 'defi',
    name: 'DeFi Operations',
    description: 'Interact with lending, staking, and yield protocols',
    category: 'DeFi',
    icon: DollarSign,
  },
  {
    id: 'nft',
    name: 'NFT Management',
    description: 'Create, buy, sell, and manage NFTs',
    category: 'NFT',
    icon: Image,
  },
  {
    id: 'dao',
    name: 'DAO Governance',
    description: 'Participate in DAO voting and proposals',
    category: 'Governance',
    icon: Vote,
  },
  {
    id: 'portfolio',
    name: 'Portfolio Analytics',
    description: 'Track and analyze portfolio performance',
    category: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'wallet',
    name: 'Wallet Management',
    description: 'Manage multiple wallets and accounts',
    category: 'Wallet',
    icon: Wallet,
  },
  {
    id: 'price-alerts',
    name: 'Price Alerts',
    description: 'Monitor and alert on price movements',
    category: 'Monitoring',
    icon: Activity,
    beta: true,
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage Detection',
    description: 'Identify arbitrage opportunities',
    category: 'Trading',
    icon: RefreshCw,
    premium: true,
  },

  // Data & Analytics
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Analyze market trends and patterns',
    category: 'Analytics',
    icon: PieChart,
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze social media and news sentiment',
    category: 'Analytics',
    icon: MessageSquare,
    beta: true,
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Perform technical chart analysis',
    category: 'Analytics',
    icon: TrendingDown,
  },
  {
    id: 'on-chain-data',
    name: 'On-chain Analytics',
    description: 'Access and analyze blockchain data',
    category: 'Analytics',
    icon: Database,
  },

  // Development & Automation
  {
    id: 'smart-contracts',
    name: 'Smart Contract Interaction',
    description: 'Read and write to smart contracts',
    category: 'Development',
    icon: Code,
  },
  {
    id: 'automation',
    name: 'Task Automation',
    description: 'Automate repetitive tasks and workflows',
    category: 'Automation',
    icon: Lightning,
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Connect to external APIs and services',
    category: 'Integration',
    icon: Link,
  },
  {
    id: 'webhooks',
    name: 'Webhook Support',
    description: 'Send and receive webhook events',
    category: 'Integration',
    icon: Globe,
    beta: true,
  },

  // Security & Privacy
  {
    id: 'security-audit',
    name: 'Security Auditing',
    description: 'Audit smart contracts and transactions',
    category: 'Security',
    icon: Shield,
    premium: true,
  },
  {
    id: 'privacy',
    name: 'Privacy Features',
    description: 'Enhanced privacy and anonymity features',
    category: 'Security',
    icon: Lock,
  },
  {
    id: 'multi-sig',
    name: 'Multi-signature',
    description: 'Support for multi-signature operations',
    category: 'Security',
    icon: Users,
    premium: true,
  },

  // Communication
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Send alerts and notifications',
    category: 'Communication',
    icon: Bell,
  },
  {
    id: 'email',
    name: 'Email Integration',
    description: 'Send and receive emails',
    category: 'Communication',
    icon: Mail,
  },
  {
    id: 'discord',
    name: 'Discord Integration',
    description: 'Integrate with Discord servers',
    category: 'Communication',
    icon: MessageSquare,
    beta: true,
  },
  {
    id: 'telegram',
    name: 'Telegram Integration',
    description: 'Connect to Telegram bots and channels',
    category: 'Communication',
    icon: Send,
    beta: true,
  },

  // Advanced Features
  {
    id: 'ai-predictions',
    name: 'AI Predictions',
    description: 'Machine learning price predictions',
    category: 'AI',
    icon: Brain,
    premium: true,
  },
  {
    id: 'natural-language',
    name: 'Natural Language Processing',
    description: 'Advanced NLP capabilities',
    category: 'AI',
    icon: MessageSquare,
  },
  {
    id: 'computer-vision',
    name: 'Image Analysis',
    description: 'Analyze charts and images',
    category: 'AI',
    icon: Eye,
    premium: true,
  },
  {
    id: 'voice-commands',
    name: 'Voice Commands',
    description: 'Support for voice interactions',
    category: 'AI',
    icon: Mic,
    beta: true,
  },
];

export const categories = [
  'All',
  'Trading',
  'DeFi',
  'NFT',
  'Analytics',
  'Development',
  'Security',
  'Communication',
  'AI',
  'Automation',
  'Integration',
  'Governance',
  'Wallet',
  'Monitoring',
];
