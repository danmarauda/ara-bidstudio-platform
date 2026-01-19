'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bot,
  Check,
  Clock,
  Download,
  Info,
  MessageSquare,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Upload,
  User,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  Agent,
  TestMessage as TestMessageType,
  TestScenario as TestScenarioType,
} from './types';

function getBubbleClasses(role: 'user' | 'agent' | 'system'): string {
  if (role === 'user') {
    return 'bg-primary text-primary-foreground';
  }
  if (role === 'agent') {
    return 'bg-muted';
  }
  return 'bg-yellow-100 dark:bg-yellow-900';
}

interface TestMessage extends Omit<TestMessageType, 'role'> {
  role: 'user' | 'agent' | 'system';
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    model?: string;
    tools?: string[];
  };
}

interface TestScenario extends TestScenarioType {
  expectedBehavior?: string;
}

interface AgentTestingPanelProps {
  agent: Agent;
}

const testScenarios: TestScenario[] = [
  {
    id: 'greeting',
    name: 'Basic Greeting',
    description: 'Test how the agent responds to greetings',
    messages: [
      {
        id: 'scenario_greeting_user_1',
        role: 'user',
        content: 'Hello! How are you today?',
        timestamp: new Date(0),
      },
    ],
    expectedBehavior: 'Agent should greet back politely and offer assistance',
  },
  {
    id: 'trading',
    name: 'Trading Request',
    description: 'Test trading capability responses',
    messages: [
      {
        id: 'scenario_trading_user_1',
        role: 'user',
        content: 'I want to swap 100 USDC for SOL',
        timestamp: new Date(0),
      },
    ],
    expectedBehavior:
      'Agent should explain the swap process and request confirmation',
  },
  {
    id: 'analysis',
    name: 'Market Analysis',
    description: 'Test analytical capabilities',
    messages: [
      {
        id: 'scenario_analysis_user_1',
        role: 'user',
        content: 'What do you think about the current SOL price action?',
        timestamp: new Date(0),
      },
    ],
    expectedBehavior:
      'Agent should provide market analysis based on available data',
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Test how agent handles errors',
    messages: [
      {
        id: 'scenario_error_user_1',
        role: 'user',
        content: 'Execute an invalid transaction: xyz123',
        timestamp: new Date(0),
      },
    ],
    expectedBehavior:
      'Agent should gracefully handle the error and explain the issue',
  },
  {
    id: 'multi-turn',
    name: 'Multi-turn Conversation',
    description: 'Test context retention across messages',
    messages: [
      {
        id: 'scenario_multiturn_user_1',
        role: 'user',
        content: 'I want to learn about DeFi',
        timestamp: new Date(0),
      },
      {
        id: 'scenario_multiturn_assistant_1',
        role: 'assistant',
        content:
          'I can help you understand DeFi. What aspect interests you most?',
        timestamp: new Date(0),
      },
      {
        id: 'scenario_multiturn_user_2',
        role: 'user',
        content: 'Tell me about yield farming',
        timestamp: new Date(0),
      },
    ],
    expectedBehavior:
      'Agent should maintain context and provide relevant information',
  },
];

export function AgentTestingPanel({ agent }: AgentTestingPanelProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    successRate: 100,
  });
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      return;
    }

    const userMessage: TestMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsRunning(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: TestMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: `This is a simulated response from ${agent.name}. In production, this would be the actual agent response.`,
        timestamp: new Date(),
        metadata: {
          tokensUsed: Math.floor(Math.random() * 100) + 50,
          responseTime: Math.floor(Math.random() * 2000) + 500,
          model: 'gpt-4o',
          tools: agent.tools?.slice(0, 2).map((t) => t.name),
        },
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsRunning(false);

      // Update metrics
      setMetrics((prev) => ({
        totalMessages: prev.totalMessages + 2,
        avgResponseTime:
          prev.totalMessages === 0
            ? agentMessage.metadata?.responseTime || 0
            : (prev.avgResponseTime * prev.totalMessages +
                (agentMessage.metadata?.responseTime || 0)) /
              (prev.totalMessages + 1),
        totalTokens:
          prev.totalTokens + (agentMessage.metadata?.tokensUsed || 0),
        successRate: 100,
      }));
    }, 1500);
  };

  const runScenario = async (scenario: TestScenario) => {
    setSelectedScenario(scenario.id);
    setMessages([]);
    setIsRunning(true);

    // Process all messages and collect delays for parallel processing
    const delays: Promise<void>[] = [];
    let accumulatedDelay = 0;

    for (const message of scenario.messages) {
      const currentDelay = accumulatedDelay;
      delays.push(
        new Promise<void>((resolve) => {
          setTimeout(() => {
            const testMessage: TestMessage = {
              id: `msg_${Date.now()}_${message.role}`,
              role: message.role === 'user' ? 'user' : 'agent',
              content: message.content,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, testMessage]);

            if (message.role === 'user') {
              // Add agent response after user message
              setTimeout(() => {
                const agentResponse: TestMessage = {
                  id: `msg_${Date.now()}_agent`,
                  role: 'agent',
                  content: `[Test Response] Processing: "${message.content}"`,
                  timestamp: new Date(),
                  metadata: {
                    tokensUsed: Math.floor(Math.random() * 100) + 50,
                    responseTime: Math.floor(Math.random() * 2000) + 500,
                  },
                };
                setMessages((prev) => [...prev, agentResponse]);
              }, 1000);
            }
            resolve();
          }, currentDelay);
        })
      );
      accumulatedDelay += message.role === 'user' ? 1500 : 500; // 1000ms + 500ms for user messages, 500ms for others
    }

    // Wait for all messages to be processed
    await Promise.all(delays);
    // Add final delay before finishing
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsRunning(false);
    setTestResults((prev) => ({ ...prev, [scenario.id]: true }));
  };

  const resetTests = () => {
    setMessages([]);
    setMetrics({
      totalMessages: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      successRate: 100,
    });
    setTestResults({});
    setSelectedScenario(null);
  };

  const exportTestResults = () => {
    const results = {
      agent: {
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
      },
      messages,
      metrics,
      testResults,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-test-${agent.name}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Environment</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Ready'}
              </Badge>
              <Button
                disabled={isRunning}
                onClick={resetTests}
                size="icon"
                variant="ghost"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                disabled={messages.length === 0}
                onClick={exportTestResults}
                size="icon"
                variant="ghost"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Test {agent.name}'s capabilities in a sandboxed environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs className="w-full" defaultValue="chat">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Interactive Chat</TabsTrigger>
              <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="chat">
              {/* Chat Messages */}
              <ScrollArea className="h-[400px] rounded-lg border bg-muted/20 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="font-medium text-sm">No messages yet</h3>
                      <p className="mt-2 text-muted-foreground text-sm">
                        Start a conversation to test your agent
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <MessageItem
                          index={index}
                          key={message.id}
                          message={message}
                        />
                      ))}
                    </AnimatePresence>
                  )}

                  {isRunning && (
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                      initial={{ opacity: 0 }}
                    >
                      <div className="rounded-lg bg-muted px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              className="h-2 w-2 rounded-full bg-primary"
                              transition={{
                                duration: 1.5,
                                repeat: Number.POSITIVE_INFINITY,
                              }}
                            />
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              className="h-2 w-2 rounded-full bg-primary"
                              transition={{
                                duration: 1.5,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: 0.2,
                              }}
                            />
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              className="h-2 w-2 rounded-full bg-primary"
                              transition={{
                                duration: 1.5,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: 0.4,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  disabled={isRunning}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message to test your agent..."
                  value={inputMessage}
                />
                <Button disabled={isRunning} onClick={handleSendMessage}>
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent className="space-y-4" value="scenarios">
              <div className="grid gap-3">
                {testScenarios.map((scenario) => {
                  const isCompleted = testResults[scenario.id];
                  const isSelected = selectedScenario === scenario.id;

                  return (
                    <Card
                      className={cn(
                        'cursor-pointer transition-all',
                        isSelected && 'border-primary',
                        isCompleted && 'bg-green-50 dark:bg-green-950/20'
                      )}
                      key={scenario.id}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm">
                                {scenario.name}
                              </h4>
                              {isCompleted && (
                                <Badge className="text-xs" variant="default">
                                  <Check className="mr-1 h-3 w-3" />
                                  Passed
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-muted-foreground text-xs">
                              {scenario.description}
                            </p>
                            {scenario.expectedBehavior && (
                              <div className="mt-2 flex items-start space-x-1">
                                <Info className="mt-0.5 h-3 w-3 text-muted-foreground" />
                                <p className="text-muted-foreground text-xs">
                                  Expected: {scenario.expectedBehavior}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            disabled={isRunning}
                            onClick={() => runScenario(scenario)}
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                          >
                            {isRunning && isSelected ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Running
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-3 w-3" />
                                Run
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-6">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Test Suite
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="space-y-4" value="metrics">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Total Messages</p>
                        <p className="font-bold text-2xl">
                          {metrics.totalMessages}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Avg Response Time</p>
                        <p className="font-bold text-2xl">
                          {metrics.avgResponseTime}ms
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Tokens Used</p>
                        <p className="font-bold text-2xl">
                          {metrics.totalTokens}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Success Rate</p>
                        <p className="font-bold text-2xl">
                          {metrics.successRate}%
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm">Response Quality</span>
                        <span className="text-muted-foreground text-sm">
                          95%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: '95%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm">Context Retention</span>
                        <span className="text-muted-foreground text-sm">
                          88%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: '88%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm">Tool Usage Efficiency</span>
                        <span className="text-muted-foreground text-sm">
                          92%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: '92%' }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentTestingPanel;
function MessageItem({
  message,
  index,
}: {
  message: TestMessage;
  index: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          getBubbleClasses(message.role)
        )}
      >
        <div className="flex items-start space-x-2">
          {message.role === 'agent' && (
            <Bot className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          {message.role === 'user' && (
            <User className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm">{message.content}</p>
            {message.metadata && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.metadata.tokensUsed && (
                  <Badge className="text-xs" variant="secondary">
                    {message.metadata.tokensUsed} tokens
                  </Badge>
                )}
                {message.metadata.responseTime && (
                  <Badge className="text-xs" variant="secondary">
                    {message.metadata.responseTime}ms
                  </Badge>
                )}
                {message.metadata.tools &&
                  message.metadata.tools.length > 0 && (
                    <Badge className="text-xs" variant="secondary">
                      {message.metadata.tools.length} tools used
                    </Badge>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
