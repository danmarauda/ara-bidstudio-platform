---
category: frontend
subcategory: routing
tags: [nextjs, app-router, navigation, layouts, middleware]
cursor:
  context_window: 8192
  temperature: 0.6
  max_tokens: 4096
  model_preference: ["auto"]
relations:
  imports: ["./index.mdc", "./state-management.mdc"]
  exports: ["routing-patterns", "navigation-patterns", "layout-patterns"]
  references: ["./wallet-integration.mdc", "../backend/auth-patterns.mdc"]
---

# Next.js 15 App Router Patterns

## App Router Architecture

### File-Based Routing Structure

```
app/
├── (auth)/                    # Route groups (doesn't affect URL)
│   ├── login/
│   │   └── page.tsx          # /login
│   ├── register/
│   │   └── page.tsx          # /register
│   └── layout.tsx            # Layout for auth pages
├── (authenticated)/          # Protected routes
│   ├── chat/
│   │   ├── [chatId]/
│   │   │   ├── page.tsx      # /chat/[chatId]
│   │   │   └── loading.tsx   # Loading UI
│   │   ├── new/
│   │   │   └── page.tsx      # /chat/new
│   │   └── page.tsx          # /chat (chat list)
│   ├── settings/
│   │   ├── profile/
│   │   │   └── page.tsx      # /settings/profile
│   │   ├── billing/
│   │   │   └── page.tsx      # /settings/billing
│   │   └── page.tsx          # /settings
│   └── layout.tsx            # Layout for authenticated pages
├── api/                      # API routes
│   ├── auth/
│   │   └── route.ts          # /api/auth
│   ├── chat/
│   │   └── [chatId]/
│   │       └── route.ts      # /api/chat/[chatId]
│   └── webhook/
│       └── route.ts          # /api/webhook
├── globals.css
├── layout.tsx                # Root layout
├── page.tsx                  # Home page /
├── loading.tsx               # Global loading UI
├── error.tsx                 # Global error UI
├── not-found.tsx             # 404 page
└── sitemap.xml               # Generated sitemap
```

### Root Layout with Theme Support

```typescript
// app/layout.tsx - Root layout with providers
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'ANUBIS Chat - Solana AI Chat SaaS',
    template: '%s | ANUBIS Chat',
  },
  description: 'Intelligent AI chat interface built on Solana blockchain',
  keywords: ['AI', 'Chat', 'Solana', 'Web3', 'SaaS'],
  authors: [{ name: 'ANUBIS Chat Team' }],
  creator: 'ANUBIS Chat',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://anubis-chat.app',
    siteName: 'ANUBIS Chat',
    title: 'ANUBIS Chat - Solana AI Chat SaaS',
    description: 'Intelligent AI chat interface built on Solana blockchain',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ANUBIS Chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANUBIS Chat - Solana AI Chat SaaS',
    description: 'Intelligent AI chat interface built on Solana blockchain',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Providers Setup

```typescript
// app/providers.tsx - All context providers
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { WalletProvider } from '@/components/wallet/wallet-provider';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';

// Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            {children}
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </WalletProvider>
        </QueryClientProvider>
      </ConvexProvider>
    </ThemeProvider>
  );
}
```

## Route Protection and Middleware

### Authentication Middleware

```typescript
// middleware.ts - Route protection and redirects
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/api/auth/callback',
  '/api/webhook',
];

const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if it's a public route
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }
  
  // Verify authentication token
  let isAuthenticated = false;
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch (error) {
      // Token is invalid, remove it
      const response = NextResponse.next();
      response.cookies.delete('auth-token');
      return response;
    }
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

### Wallet Protection Guard

```typescript
// components/auth/wallet-guard.tsx - Wallet connection guard
'use client';

import { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireConnection?: boolean;
}

export function WalletGuard({ 
  children, 
  fallback,
  requireConnection = true 
}: WalletGuardProps) {
  const { connected, connecting } = useWallet();
  
  if (connecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Connecting wallet...</p>
        </div>
      </div>
    );
  }
  
  if (requireConnection && !connected) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Connect your Solana wallet to access ANUBIS Chat features
              </p>
            </div>
            
            <div className="space-y-4">
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
              
              <p className="text-xs text-muted-foreground">
                New to Solana wallets?{' '}
                <a 
                  href="https://phantom.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get Phantom Wallet
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    );
  }
  
  return <>{children}</>;
}
```

## Layouts and Page Structure

### Authenticated Layout

```typescript
// app/(authenticated)/layout.tsx - Layout for authenticated pages
import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { WalletGuard } from '@/components/auth/wallet-guard';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <Sidebar className="hidden lg:block" />
          
          {/* Main content */}
          <div className="flex flex-col">
            <Header />
            
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </WalletGuard>
  );
}
```

### Chat Layout with Parallel Routes

```typescript
// app/(authenticated)/chat/layout.tsx - Chat-specific layout
import { ReactNode } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';

export default function ChatLayout({
  children,
  modal, // Parallel route for modals
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
      {/* Chat sidebar */}
      <div className="border-r bg-muted/10 hidden lg:block">
        <ChatSidebar />
      </div>
      
      {/* Chat content */}
      <div className="relative">
        {children}
        {modal}
      </div>
    </div>
  );
}
```

### Intercepting Routes for Modals

```typescript
// app/(authenticated)/chat/@modal/(.)settings/page.tsx - Modal interceptor
import { Modal } from '@/components/ui/modal';
import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsModal() {
  return (
    <Modal>
      <Modal.Content className="max-w-2xl">
        <Modal.Header>
          <Modal.Title>Chat Settings</Modal.Title>
          <Modal.Description>
            Customize your chat experience
          </Modal.Description>
        </Modal.Header>
        
        <Modal.Body>
          <SettingsForm />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
```

## Dynamic Routing and Params

### Chat Page with Dynamic Segments

```typescript
// app/(authenticated)/chat/[chatId]/page.tsx - Dynamic chat page
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatHistory } from '@/components/chat/chat-history';
import { ChatInputSkeleton } from '@/components/chat/chat-skeleton';

interface ChatPageProps {
  params: { chatId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { chatId } = params;
  
  // Validate chat ID format
  if (!chatId || typeof chatId !== 'string') {
    notFound();
  }
  
  // Check if chat exists (Server Component)
  const chatExists = await checkChatExists(chatId);
  
  if (!chatExists) {
    notFound();
  }
  
  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<div>Loading chat history...</div>}>
        <ChatHistory chatId={chatId} />
      </Suspense>
      
      <Suspense fallback={<ChatInputSkeleton />}>
        <ChatInterface chatId={chatId} />
      </Suspense>
    </div>
  );
}

// Generate metadata dynamically
export async function generateMetadata({ params }: ChatPageProps) {
  const chat = await getChatById(params.chatId);
  
  return {
    title: chat ? `${chat.title} - ANUBIS Chat` : 'Chat - ANUBIS Chat',
    description: chat?.description || 'AI chat conversation',
  };
}
```

### Search Params Handling

```typescript
// app/(authenticated)/chat/page.tsx - Chat list with search
import { Suspense } from 'react';
import { ChatList } from '@/components/chat/chat-list';
import { SearchInput } from '@/components/ui/search-input';

interface ChatListPageProps {
  searchParams: {
    q?: string;
    sort?: 'recent' | 'name' | 'created';
    filter?: 'all' | 'active' | 'archived';
  };
}

export default function ChatListPage({ searchParams }: ChatListPageProps) {
  const { q: query, sort = 'recent', filter = 'all' } = searchParams;
  
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-semibold">Your Chats</h1>
        
        <div className="flex gap-4">
          <SearchInput
            placeholder="Search chats..."
            defaultValue={query}
            className="flex-1"
          />
          
          <SortSelect defaultValue={sort} />
          <FilterSelect defaultValue={filter} />
        </div>
      </div>
      
      <Suspense 
        fallback={<ChatListSkeleton />}
        key={`${query}-${sort}-${filter}`} // Key for re-suspending on params change
      >
        <ChatList query={query} sort={sort} filter={filter} />
      </Suspense>
    </div>
  );
}
```

## Navigation Patterns

### Programmatic Navigation

```typescript
// hooks/use-navigation.ts - Navigation utilities
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Navigate to chat
  const navigateToChat = useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
  }, [router]);
  
  // Create new chat
  const createNewChat = useCallback(() => {
    router.push('/chat/new');
  }, [router]);
  
  // Update search params
  const updateSearchParams = useCallback((params: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    router.replace(`${pathname}${query}`);
  }, [router, pathname, searchParams]);
  
  // Go back with fallback
  const goBack = useCallback((fallback: string = '/') => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router]);
  
  return {
    navigateToChat,
    createNewChat,
    updateSearchParams,
    goBack,
    currentPath: pathname,
    searchParams,
  };
}

// Usage in components
function ChatListItem({ chat }: { chat: Chat }) {
  const { navigateToChat } = useNavigation();
  
  return (
    <div
      onClick={() => navigateToChat(chat.id)}
      className="cursor-pointer hover:bg-accent rounded p-3"
    >
      <h3>{chat.title}</h3>
      <p className="text-muted-foreground text-sm">{chat.lastMessage}</p>
    </div>
  );
}
```

### Link Components with Active States

```typescript
// components/ui/nav-link.tsx - Enhanced navigation link
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  disabled?: boolean;
}

export function NavLink({
  href,
  children,
  className,
  activeClassName = 'bg-primary text-primary-foreground',
  exact = false,
  disabled = false,
}: NavLinkProps) {
  const pathname = usePathname();
  
  const isActive = exact 
    ? pathname === href
    : pathname.startsWith(href);
  
  if (disabled) {
    return (
      <span className={cn(
        className,
        'opacity-50 cursor-not-allowed'
      )}>
        {children}
      </span>
    );
  }
  
  return (
    <Link
      href={href}
      className={cn(
        className,
        isActive && activeClassName,
        'transition-colors duration-200'
      )}
    >
      {children}
    </Link>
  );
}

// Usage in navigation
function Navigation() {
  return (
    <nav className="space-y-2">
      <NavLink
        href="/chat"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
        exact={false}
      >
        <MessageSquareIcon className="h-4 w-4" />
        Chats
      </NavLink>
      
      <NavLink
        href="/settings"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
      >
        <SettingsIcon className="h-4 w-4" />
        Settings
      </NavLink>
    </nav>
  );
}
```

## Loading States and Error Handling

### Route-Level Loading UI

```typescript
// app/(authenticated)/chat/loading.tsx - Loading UI for chat routes
export default function ChatLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Chat header skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Input skeleton */}
      <div className="border-t p-4">
        <div className="h-12 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
```

### Error Boundaries

```typescript
// app/(authenticated)/chat/error.tsx - Error boundary for chat routes
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ChatErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ChatErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Chat route error:', error);
  }, [error]);
  
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-destructive">
            Something went wrong!
          </h2>
          <p className="text-muted-foreground">
            We encountered an error while loading your chat. Please try again.
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs bg-muted p-4 rounded">
            <summary className="cursor-pointer mb-2 font-medium">
              Error Details
            </summary>
            <pre className="overflow-x-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/chat'}>
            Go to Chat List
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Not Found Pages

```typescript
// app/(authenticated)/chat/[chatId]/not-found.tsx - Chat-specific 404
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ChatNotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-xl font-semibold">Chat Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The chat you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link href="/chat">View All Chats</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/chat/new">Create New Chat</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Route Groups and Organization

### Feature-Based Route Groups

```typescript
// Route group organization strategy
app/
├── (marketing)/              # Public marketing pages
│   ├── about/
│   ├── pricing/
│   └── layout.tsx
├── (auth)/                   # Authentication pages
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (authenticated)/          # Protected app pages
│   ├── (chat)/              # Chat-related pages
│   │   ├── chat/
│   │   └── history/
│   ├── (settings)/          # Settings-related pages
│   │   ├── profile/
│   │   └── billing/
│   └── layout.tsx
└── (admin)/                 # Admin pages
    ├── users/
    ├── analytics/
    └── layout.tsx
```

## API Routes

### RESTful API Structure

```typescript
// app/api/chat/[chatId]/route.ts - Chat API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const chat = await db.chat.findFirst({
      where: {
        id: params.chatId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await db.chat.deleteMany({
      where: {
        id: params.chatId,
        userId: user.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## SEO and Metadata

### Dynamic Metadata Generation

```typescript
// app/(authenticated)/chat/[chatId]/page.tsx - SEO metadata
import type { Metadata } from 'next';

interface ChatPageProps {
  params: { chatId: string };
}

export async function generateMetadata(
  { params }: ChatPageProps
): Promise<Metadata> {
  const chat = await getChatById(params.chatId);
  
  if (!chat) {
    return {
      title: 'Chat Not Found - ANUBIS Chat',
      description: 'The requested chat could not be found.',
    };
  }
  
  return {
    title: `${chat.title} - ANUBIS Chat`,
    description: chat.description || `AI conversation: ${chat.title}`,
    openGraph: {
      title: `${chat.title} - ANUBIS Chat`,
      description: chat.description || `AI conversation: ${chat.title}`,
      type: 'article',
      publishedTime: chat.createdAt.toISOString(),
      modifiedTime: chat.updatedAt.toISOString(),
    },
    robots: {
      index: false, // Don't index private chats
      follow: false,
    },
  };
}
```

## Related Files

- [State Management](./state-management.mdc) - Route-level state patterns
- [Component Architecture](./components.mdc) - Navigation components
- [Wallet Integration](./wallet-integration.mdc) - Wallet-protected routes
- [Authentication Patterns](../backend/auth-patterns.mdc) - Backend auth integration