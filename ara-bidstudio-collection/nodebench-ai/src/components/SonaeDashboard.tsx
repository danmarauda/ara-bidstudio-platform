import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BeamsBackground } from '@/components/kokonutui/beams-background';
import { GlitchText } from '@/components/kokonutui/glitch-text';
import { MatrixText } from '@/components/kokonutui/matrix-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Bot, 
  FileText, 
  TrendingUp, 
  Users, 
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';

const SonaeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for dashboard
  const stats = [
    {
      title: "AI Agents Active",
      value: "12",
      change: "+2",
      trend: "up",
      icon: <Bot className="w-5 h-5" />,
      color: "text-blue-600"
    },
    {
      title: "Documents Processed",
      value: "3,847",
      change: "+523",
      trend: "up", 
      icon: <FileText className="w-5 h-5" />,
      color: "text-green-600"
    },
    {
      title: "API Calls Today",
      value: "45.2K",
      change: "-2.1K",
      trend: "down",
      icon: <Activity className="w-5 h-5" />,
      color: "text-purple-600"
    },
    {
      title: "Team Members",
      value: "28",
      change: "+4",
      trend: "up",
      icon: <Users className="w-5 h-5" />,
      color: "text-orange-600"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "agent",
      title: "Document Analysis Agent",
      description: "Completed analysis of 15 documents",
      time: "2 minutes ago",
      status: "success"
    },
    {
      id: 2,
      type: "api",
      title: "API Integration",
      description: "Connected new CRM system",
      time: "15 minutes ago", 
      status: "success"
    },
    {
      id: 3,
      type: "user",
      title: "Team Invitation",
      description: "Sarah joined the workspace",
      time: "1 hour ago",
      status: "success"
    },
    {
      id: 4,
      type: "system",
      title: "System Update",
      description: "AI models updated to latest version",
      time: "2 hours ago",
      status: "info"
    }
  ];

  const agentPerformance = [
    {
      name: "Document Analyzer",
      usage: 85,
      status: "active",
      lastRun: "2 min ago"
    },
    {
      name: "Chat Assistant",
      usage: 92,
      status: "active", 
      lastRun: "1 min ago"
    },
    {
      name: "Data Processor",
      usage: 67,
      status: "idle",
      lastRun: "15 min ago"
    },
    {
      name: "Report Generator",
      usage: 45,
      status: "idle",
      lastRun: "1 hour ago"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GlitchText 
                text="Sonae Dashboard"
                size="lg"
                color="blue"
                glitchIntensity="light"
                isStatic={true}
              />
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Last sync: 30s ago
              </Button>
              <Button size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Quick Actions
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-neutral-200 dark:border-neutral-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        {stat.title}
                      </CardTitle>
                      <div className={stat.color}>
                        {stat.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                        {stat.trend === "up" ? (
                          <ArrowUp className="w-3 h-3 mr-1 text-green-500" />
                        ) : (
                          <ArrowDown className="w-3 h-3 mr-1 text-red-500" />
                        )}
                        {stat.change} from last week
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card className="border-neutral-200 dark:border-neutral-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>
                      AI agent activity and system performance over the last 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <MatrixText 
                        text="Chart Visualization"
                        initialDelay={800}
                        letterInterval={40}
                        className="text-lg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="border-neutral-200 dark:border-neutral-700">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest system events and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.slice(0, 4).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1">
                          {activity.status === "success" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-neutral-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-neutral-200 dark:border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI Agent Performance
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage your AI agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {agentPerformance.map((agent, index) => (
                      <motion.div
                        key={agent.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{agent.name}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Last run: {agent.lastRun}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={agent.status === "active" ? "default" : "secondary"}
                              className={agent.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                            >
                              {agent.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={agent.usage} className="h-2" />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {agent.usage}% usage capacity
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-neutral-200 dark:border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Deep insights into your AI workspace performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <div className="text-center">
                      <GlitchText 
                        text="Advanced Analytics"
                        size="2xl"
                        color="purple"
                        glitchIntensity="medium"
                        className="mb-4"
                      />
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Comprehensive analytics and reporting coming soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-neutral-200 dark:border-neutral-700">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Complete history of all system activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="mt-1">
                          {activity.status === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {activity.description}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {activity.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SonaeDashboard;