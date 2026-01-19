'use client';

import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { User } from '@workos-inc/node';
import { Brain, Workflow, Database, Sparkles, BarChart3, MessageSquare, Shield, Activity, Zap } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ARAPS Platform
              </span>
            </div>
            {user && <UserMenu user={user} onSignOut={signOut} />}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Authenticated>
          <Dashboard />
        </Authenticated>
        <Unauthenticated>
          <HeroSection />
          <DemoSection />
        </Unauthenticated>
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="text-center space-y-8 py-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Powered by Mastra AI & Convex
        </div>

        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Next-Gen AI Platform
        </h1>

        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Experience the future of intelligent automation with our premium S-Tier platform. Build agents, orchestrate
          workflows, and unlock unprecedented productivity.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href="/sign-up">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            Get Started Free
          </button>
        </a>
        <a href="/sign-in">
          <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-8 py-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200">
            Sign In
          </button>
        </a>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <FeatureCard
          icon={Brain}
          title="Intelligent Agents"
          description="Advanced AI agents that learn and adapt to your needs"
        />
        <FeatureCard
          icon={Workflow}
          title="Workflow Automation"
          description="Seamlessly orchestrate complex multi-step processes"
        />
        <FeatureCard
          icon={Shield}
          title="Enterprise Security"
          description="Bank-grade security with end-to-end encryption"
        />
      </div>
    </div>
  );
}

function DemoSection() {
  return (
    <div className="space-y-16 py-16">
      {/* Live Demo Showcase */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Experience the Power
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          See what our S-Tier platform can do with interactive demos and live examples
        </p>
      </div>

      {/* Interactive Demo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DemoCard
          icon={Brain}
          title="AI Agent Demo"
          description="Watch our intelligent agents solve complex problems in real-time"
          demoType="agent"
          color="from-blue-500 to-cyan-500"
        />
        <DemoCard
          icon={Workflow}
          title="Workflow Builder"
          description="Create automated workflows with drag-and-drop simplicity"
          demoType="workflow"
          color="from-purple-500 to-pink-500"
        />
        <DemoCard
          icon={BarChart3}
          title="Analytics Dashboard"
          description="Real-time insights and performance monitoring"
          demoType="analytics"
          color="from-green-500 to-emerald-500"
        />
        <DemoCard
          icon={MessageSquare}
          title="Conversational AI"
          description="Natural language interactions with context awareness"
          demoType="chat"
          color="from-orange-500 to-red-500"
        />
        <DemoCard
          icon={Database}
          title="Data Processing"
          description="Advanced data querying and transformation"
          demoType="data"
          color="from-indigo-500 to-purple-500"
        />
        <DemoCard
          icon={Zap}
          title="Real-time Sync"
          description="Live updates across all connected devices"
          demoType="realtime"
          color="from-yellow-500 to-orange-500"
        />
      </div>

      {/* Platform Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8 text-white">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold">Built for Scale & Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">99.9%</div>
              <div className="text-sm text-slate-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">&lt;100ms</div>
              <div className="text-sm text-slate-300">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">10M+</div>
              <div className="text-sm text-slate-300">API Calls/Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">500+</div>
              <div className="text-sm text-slate-300">Enterprise Clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Powered by Cutting-Edge Technology</h3>
          <p className="text-slate-600 dark:text-slate-400">Built with the latest frameworks and AI technologies</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <TechBadge name="Next.js 15" icon="⚡" />
          <TechBadge name="TypeScript" icon="🔷" />
          <TechBadge name="Convex" icon="🟢" />
          <TechBadge name="Mastra AI" icon="🤖" />
          <TechBadge name="Tailwind CSS" icon="🎨" />
          <TechBadge name="WorkOS" icon="🔐" />
        </div>
      </div>
    </div>
  );
}

function DemoCard({
  icon: Icon,
  title,
  description,
  demoType,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  demoType: string;
  color: string;
}) {
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div
        className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{description}</p>
      <button
        className={`w-full bg-gradient-to-r ${color} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
      >
        Try Demo
      </button>
    </div>
  );
}

function TechBadge({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-center">{name}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function Dashboard() {
  const { numbers } = useQuery(api.myFunctions.listNumbers, { count: 10 }) ?? {};
  const agents = useQuery(api.myFunctions.listAgents) ?? [];

  const stats = [
    { label: 'Active Agents', value: agents.length, icon: Brain, color: 'text-blue-500' },
    { label: 'Conversations', value: '12', icon: MessageSquare, color: 'text-green-500' },
    { label: 'Workflows', value: '3', icon: Workflow, color: 'text-purple-500' },
    { label: 'Data Points', value: numbers?.length || 0, icon: Database, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome to ARAPS Platform
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Your premium AI-powered platform for intelligent automation, advanced analytics, and seamless workflow
          orchestration.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          icon={Brain}
          title="Create Agent"
          description="Build custom AI agents for specific tasks"
          color="from-blue-500 to-blue-600"
        />
        <QuickActionCard
          icon={Workflow}
          title="Design Workflow"
          description="Create automated multi-step processes"
          color="from-purple-500 to-purple-600"
        />
        <QuickActionCard
          icon={BarChart3}
          title="View Analytics"
          description="Analyze performance and insights"
          color="from-green-500 to-green-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          <ActivityItem
            icon={Sparkles}
            title="New agent created"
            description="Code Generation Agent is now active"
            time="2 minutes ago"
          />
          <ActivityItem
            icon={MessageSquare}
            title="Conversation started"
            description="User initiated chat with Data Analysis Agent"
            time="5 minutes ago"
          />
          <ActivityItem
            icon={Workflow}
            title="Workflow completed"
            description="Data processing workflow finished successfully"
            time="10 minutes ago"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white cursor-pointer group`}
    >
      <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <span className="text-xs text-slate-500">{time}</span>
    </div>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {user.profilePictureUrl && (
          <img
            src={user.profilePictureUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700"
          />
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.firstName || user.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
