'use client';

import {
  Brain,
  Globe,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type GridSetting, SettingsGrid } from '@/components/ui/settings-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AI_MODELS } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  agentPrompt?: string; // Read-only agent prompt for display
  streamResponses: boolean;
  saveHistory: boolean;
  enableMemory: boolean;
  autoCreateTitles: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
  language: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  autoScroll: boolean;
}

interface ChatSettingsDialogProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

// Convert AI_MODELS to the format expected by SettingsGrid
const models = AI_MODELS.map((model) => ({
  value: model.id,
  label: model.name,
  badge: model.provider.charAt(0).toUpperCase() + model.provider.slice(1),
}));

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const responseFormats = [
  { value: 'text', label: 'Plain Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
];

const themeOptions = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const fontSizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

/**
 * ChatSettingsDialog component - Card-based settings interface
 * Similar to model and agent selectors but for chat configuration
 */
export function ChatSettingsDialog({
  settings,
  onSettingsChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  className,
}: ChatSettingsDialogProps) {
  // Use external control if provided, otherwise manage internally
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  // Sync local settings when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setOpen(false);
  };

  // All Settings combined into single array
  const allSettings: GridSetting[] = [
    {
      id: 'model',
      title: 'AI Model',
      description: 'Select the AI model to use for responses',
      type: 'select',
      value: localSettings.model,
      onChange: (value) => handleChange('model', value),
      options: models,
      icon: <Brain className="h-4 w-4" />,
      category: 'model',
    },
    {
      id: 'temperature',
      title: 'Temperature',
      description:
        'Controls randomness: Lower is more focused, higher is more creative',
      type: 'slider',
      value: localSettings.temperature,
      onChange: (value) => handleChange('temperature', value),
      min: 0,
      max: 2,
      step: 0.1,
      icon: <Zap className="h-4 w-4" />,
      category: 'model',
    },
    {
      id: 'maxTokens',
      title: 'Max Tokens',
      description: 'Maximum length of the response',
      type: 'slider',
      value: localSettings.maxTokens,
      onChange: (value) => handleChange('maxTokens', value),
      min: 100,
      max: 4000,
      step: 100,
      icon: <Brain className="h-4 w-4" />,
      category: 'model',
    },
    {
      id: 'topP',
      title: 'Top P',
      description: 'Nucleus sampling: Higher values = more diverse responses',
      type: 'slider',
      value: localSettings.topP,
      onChange: (value) => handleChange('topP', value),
      min: 0,
      max: 1,
      step: 0.1,
      icon: <Settings className="h-4 w-4" />,
      category: 'advanced',
    },
    {
      id: 'frequencyPenalty',
      title: 'Frequency Penalty',
      description: 'Reduce repetitive responses',
      type: 'slider',
      value: localSettings.frequencyPenalty,
      onChange: (value) => handleChange('frequencyPenalty', value),
      min: -2,
      max: 2,
      step: 0.1,
      icon: <Settings className="h-4 w-4" />,
      category: 'advanced',
    },
    {
      id: 'presencePenalty',
      title: 'Presence Penalty',
      description: 'Encourage talking about new topics',
      type: 'slider',
      value: localSettings.presencePenalty,
      onChange: (value) => handleChange('presencePenalty', value),
      min: -2,
      max: 2,
      step: 0.1,
      icon: <Settings className="h-4 w-4" />,
      category: 'advanced',
    },

    // Behavior Settings
    ...(localSettings.agentPrompt
      ? [
          {
            id: 'agentPrompt',
            title: 'Agent Base Prompt',
            description:
              "The selected agent's base personality and instructions (read-only)",
            type: 'textarea' as const,
            value: localSettings.agentPrompt,
            onChange: () => {
              /* read-only */
            },
            placeholder: 'No agent selected',
            rows: 4,
            icon: <Brain className="h-4 w-4" />,
            category: 'behavior' as const,
          },
        ]
      : []),
    {
      id: 'systemPrompt',
      title: 'Custom System Prompt',
      description:
        'Your personal instructions that will be combined with the agent prompt above',
      type: 'textarea',
      value: localSettings.systemPrompt,
      onChange: (value) => handleChange('systemPrompt', value),
      placeholder: 'Add your custom instructions here (optional)...',
      rows: 4,
      icon: <Settings className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'streamResponses',
      title: 'Stream Responses',
      description: "Show responses as they're generated",
      type: 'switch',
      value: localSettings.streamResponses,
      onChange: (value) => handleChange('streamResponses', value),
      icon: <Zap className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'enableMemory',
      title: 'Enable Memory',
      description: 'Remember context across conversations',
      type: 'switch',
      value: localSettings.enableMemory,
      onChange: (value) => handleChange('enableMemory', value),
      icon: <Brain className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'autoCreateTitles',
      title: 'Auto-Generate Titles',
      description: 'Automatically create descriptive titles for new chats',
      type: 'switch',
      value: localSettings.autoCreateTitles,
      onChange: (value) => handleChange('autoCreateTitles', value),
      icon: <Zap className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'contextWindow',
      title: 'Context Window',
      description: 'Number of previous messages to include in context',
      type: 'slider',
      value: localSettings.contextWindow,
      onChange: (value) => handleChange('contextWindow', value),
      min: 1,
      max: 50,
      step: 1,
      icon: <Brain className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'responseFormat',
      title: 'Response Format',
      description: 'Format for AI responses',
      type: 'select',
      value: localSettings.responseFormat,
      onChange: (value) => handleChange('responseFormat', value),
      options: responseFormats,
      icon: <Settings className="h-4 w-4" />,
      category: 'behavior',
    },

    // Interface Settings
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred color scheme',
      type: 'select',
      value: localSettings.theme,
      onChange: (value) => handleChange('theme', value),
      options: themeOptions,
      icon: <Palette className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'fontSize',
      title: 'Font Size',
      description: 'Choose the text size for chat messages',
      type: 'select',
      value: localSettings.fontSize,
      onChange: (value) => handleChange('fontSize', value),
      options: fontSizeOptions,
      icon: <Palette className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Select your preferred language',
      type: 'select',
      value: localSettings.language,
      onChange: (value) => handleChange('language', value),
      options: languages,
      icon: <Globe className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'soundEnabled',
      title: 'Sound Effects',
      description: 'Play sounds for notifications',
      type: 'switch',
      value: localSettings.soundEnabled,
      onChange: (value) => handleChange('soundEnabled', value),
      icon: <Volume2 className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'autoScroll',
      title: 'Auto-scroll',
      description: 'Automatically scroll to new messages',
      type: 'switch',
      value: localSettings.autoScroll,
      onChange: (value) => handleChange('autoScroll', value),
      icon: <Monitor className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'saveHistory',
      title: 'Save History',
      description: 'Store conversation history locally',
      type: 'switch',
      value: localSettings.saveHistory,
      onChange: (value) => handleChange('saveHistory', value),
      icon: <Settings className="h-4 w-4" />,
      category: 'interface',
    },
  ];

  // Create filtered arrays for tabs
  const modelSettings = allSettings.filter(
    (setting) => setting.category === 'model' || setting.category === 'advanced'
  );
  const behaviorSettings = allSettings.filter(
    (setting) => setting.category === 'behavior'
  );
  const filteredInterfaceSettings = allSettings.filter(
    (setting) => setting.category === 'interface'
  );

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button className="button-press" size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline-block">Settings</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-6xl overflow-hidden sm:w-[90vw]">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Configure AI model behavior and interface preferences
            </DialogDescription>
          </DialogHeader>

          {/* Tabbed Settings */}
          <div className="max-h-[65vh] overflow-hidden">
            <Tabs className="h-full" defaultValue="model">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger className="text-xs sm:text-sm" value="model">
                  Model
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="behavior">
                  Behavior
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm" value="interface">
                  Interface
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 max-h-[55vh] overflow-y-auto">
                <TabsContent className="mt-0" value="model">
                  <SettingsGrid
                    columns={4}
                    compact={true}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    settings={modelSettings}
                    showFilter={false}
                  />
                </TabsContent>

                <TabsContent className="mt-0" value="behavior">
                  <SettingsGrid
                    columns={4}
                    compact={true}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    settings={behaviorSettings}
                    showFilter={false}
                  />
                </TabsContent>

                <TabsContent className="mt-0" value="interface">
                  <SettingsGrid
                    columns={4}
                    compact={true}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    settings={filteredInterfaceSettings}
                    showFilter={false}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatSettingsDialog;
