'use client';

import { Bot, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ChatWelcomeProps {
  onCreateChat: () => void;
  isCreating?: boolean;
}

export function ChatWelcome({ onCreateChat, isCreating }: ChatWelcomeProps) {
  const features = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: 'Real-time Streaming',
      description: 'Get instant responses with live streaming',
    },
    {
      icon: <Bot className="h-5 w-5 text-blue-500" />,
      title: 'Multiple AI Models',
      description: 'Choose from 14+ cutting-edge AI models',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      title: 'Smart Context',
      description: 'Maintains conversation context intelligently',
    },
  ];

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 sm:mb-4 sm:h-16 sm:w-16">
            <MessageSquare className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
          </div>
          <h1 className="mb-2 font-bold text-2xl sm:text-3xl">
            Welcome to Anubis Chat
          </h1>
          <p className="px-4 text-muted-foreground text-sm sm:px-0 sm:text-base">
            Start a conversation with advanced AI models powered by real-time
            streaming
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {features.map((feature) => (
            <Card className="p-3 sm:p-4" key={feature.title}>
              <div className="mb-2">{feature.icon}</div>
              <h3 className="mb-1 font-medium text-xs sm:text-sm">
                {feature.title}
              </h3>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            className="button-press"
            disabled={isCreating}
            onClick={onCreateChat}
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating Chat...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Your First Chat
              </>
            )}
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
          <h3 className="mb-2 font-medium text-xs sm:text-sm">Quick Tips:</h3>
          <ul className="space-y-1 text-[11px] text-muted-foreground sm:text-xs">
            <li>• Select different AI models from the dropdown above</li>
            <li>• Use Shift+Enter for multiline messages</li>
            <li>• Your chat history is saved automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
