/**
 * Component Types and Interfaces for anubis.chat UI Components
 * Comprehensive type definitions for all UI components
 */

import type { ReactNode } from 'react';
import type {
  AIModel,
  Chat,
  ChatMessage,
  Document,
  SearchResult,
  StreamingMessage,
  User,
} from './api';

// =============================================================================
// Base Component Props
// =============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
}

// =============================================================================
// Authentication Component Types
// =============================================================================

export interface AuthGuardProps extends BaseComponentProps {
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface UserProfileProps extends BaseComponentProps {
  user: User;
  onUpdate?: (updatedUser: Partial<User>) => void;
  editable?: boolean;
}

export interface UserSettingsProps extends BaseComponentProps {
  user: User;
  onSave?: (settings: User['preferences']) => void;
}

export interface SubscriptionStatusProps extends BaseComponentProps {
  subscription: User['subscription'];
  showUpgrade?: boolean;
}

// =============================================================================
// Chat Component Types
// =============================================================================

export interface ChatListProps extends BaseComponentProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
  onChatCreate?: () => void;
  onChatDelete?: (chatId: string) => void;
}

export interface ChatItemProps extends BaseComponentProps {
  chat: Chat;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => void;
}

export interface ChatHeaderProps extends BaseComponentProps {
  chat: Pick<
    Chat,
    | 'title'
    | 'model'
    | 'lastMessageAt'
    | 'updatedAt'
    | 'systemPrompt'
    | 'temperature'
    | 'tokenUsage'
  > & {
    _id: string;
    agentPrompt?: string;
    agentId?: string;
  };
  selectedAgent?: {
    _id: string;
    name: string;
    type: string;
    systemPrompt?: string;
  };
  onRename?: (newTitle: string) => void;
  onClearHistory?: () => void;
  onDelete?: () => void;
  onGenerateTitle?: () => void | Promise<void>;
  onSettingsClick?: () => void;
  onModelSelectorClick?: () => void;
  onAgentSelectorClick?: () => void;
}

export interface MessageListProps extends BaseComponentProps {
  messages: Array<ChatMessage | StreamingMessage | MinimalMessage>;
  loading?: boolean;
  onMessageRegenerate?: (messageId: string) => void;
  onArtifactClick?: (artifact: {
    id?: string;
    title: string;
    content?: string;
    code?: string;
    type: 'document' | 'code' | 'markdown';
    language?: string;
    framework?: string;
    description?: string;
  }) => void;
}

// Minimal message shape to support Convex docs in UI without tight coupling
export interface MinimalMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt?: number;
  rating?: {
    userRating: 'like' | 'dislike';
    ratedAt: number;
    ratedBy: string;
  };
  actions?: {
    copiedCount?: number;
    sharedCount?: number;
    regeneratedCount?: number;
    lastActionAt?: number;
  };
}

export interface MessageProps extends BaseComponentProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onCopy?: () => void;
  onEdit?: (newContent: string) => void;
  showActions?: boolean;
}

export interface MessageInputProps extends BaseComponentProps {
  onSend: (
    content: string,
    useReasoning?: boolean,
    attachments?: Array<{
      fileId: string;
      url?: string;
      mimeType: string;
      size: number;
      type: 'image' | 'file' | 'video';
    }>
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  reasoningEnabled?: boolean;
}

export interface TypingIndicatorProps extends BaseComponentProps {
  isTyping: boolean;
  userNames?: string[];
}

// =============================================================================
// Document Component Types
// =============================================================================

export interface DocumentUploadProps extends BaseComponentProps {
  onUpload: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number;
}

export interface DocumentListProps extends BaseComponentProps {
  documents: Document[];
  onDocumentSelect?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentUpdate?: (documentId: string, updates: Partial<Document>) => void;
}

export interface DocumentCardProps extends BaseComponentProps {
  document: Document;
  onSelect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export interface DocumentViewerProps extends BaseComponentProps {
  document: Document;
  onClose?: () => void;
}

export interface DocumentSearchProps extends BaseComponentProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  initialQuery?: string;
  loading?: boolean;
}

export interface SearchResultsProps extends BaseComponentProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

export interface SearchFilters {
  documentTypes?: Document['type'][];
  dateRange?: { start: Date; end: Date };
  categories?: string[];
}

// =============================================================================
// AI Component Types
// =============================================================================

export interface ModelSelectorProps extends BaseComponentProps {
  models: AIModel[];
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
}

export interface AISettingsPanelProps extends BaseComponentProps {
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
  onSettingsChange: (
    settings: Partial<AISettingsPanelProps['settings']>
  ) => void;
  models: AIModel[];
}

export interface StreamingResponseProps extends BaseComponentProps {
  content: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

export interface CitationDisplayProps extends BaseComponentProps {
  citations: string[];
  documents: Document[];
  onCitationClick?: (documentId: string) => void;
}

export interface UsageMeterProps extends BaseComponentProps {
  usage: {
    used: number;
    limit: number;
    period: string;
  };
  showDetails?: boolean;
}

// =============================================================================
// Layout Component Types
// =============================================================================

export interface AppSidebarProps extends BaseComponentProps {
  collapsed?: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
  user: User;
}

export interface TopNavigationProps extends BaseComponentProps {
  user: User;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export interface MobileNavProps extends BaseComponentProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  user: User;
}

export interface PageHeaderProps extends BaseComponentProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

// =============================================================================
// Data Display Component Types
// =============================================================================

export interface DataTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseComponentProps {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort: (column: string, order: 'asc' | 'desc') => void;
  };
}

export interface DataTableColumn<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface SearchBarProps extends BaseComponentProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  onFiltersChange?: (filters: SearchFilters) => void;
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
}

export interface LoadingStatesProps extends BaseComponentProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface EmptyStateProps extends BaseComponentProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorDisplayProps extends BaseComponentProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

// =============================================================================
// Form Component Types
// =============================================================================

export interface FormWrapperProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseComponentProps {
  onSubmit: (data: T) => void | Promise<void>;
  validationSchema?: unknown; // Zod schema - use unknown instead of any
  defaultValues?: T;
  resetOnSubmit?: boolean;
}

export interface ValidatedInputProps extends BaseComponentProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export interface ValidatedTextareaProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export interface FileUploadProps extends BaseComponentProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload?: (files: File[]) => void;
}

export interface FormActionsProps extends BaseComponentProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  submitDisabled?: boolean;
  loading?: boolean;
}

export interface FieldErrorProps extends BaseComponentProps {
  message?: string;
  show?: boolean;
}

// =============================================================================
// Specialized UI Component Types
// =============================================================================

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export interface TabsProps extends BaseComponentProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface CommandMenuProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Array<{
    id: string;
    label: string;
    description?: string;
    shortcut?: string;
    onExecute: () => void;
    disabled?: boolean;
  }>;
  placeholder?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error';
export type ComponentState = 'idle' | 'loading' | 'success' | 'error';

// Export all interfaces for easy importing
export type {
  AIModel,
  // Re-export from API types for convenience
  Chat,
  ChatMessage,
  Document,
  MessageMetadata,
  SearchResult,
  User,
} from './api';
