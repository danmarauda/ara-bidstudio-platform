import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import Script from 'next/script';
import '../index.css';
import { Analytics } from '@vercel/analytics/next';
import BreadcrumbSchema from '@/components/breadcrumbSchema';
import { ErrorBoundary } from '@/components/error-boundary';
import { globalCommandPalette as GlobalCommandPalette } from '@/components/globalCommandPalette';
import Providers from '@/components/providers';
import SchemaMarkup from '@/components/schema-markup';
import ServiceWorkerManager from '@/components/service-worker-manager';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { WebVitals } from '@/components/web-vitals';
import { themeInitScript } from '@/lib/theme-script';

// PRD Typography: Inter for body, IBM Plex Mono for code
// Note: Satoshi Variable for headers will be loaded via CSS for better Bun runtime performance
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anubis.chat'),
  title:
    'ANUBIS AI Chat - Web3 AI Assistant | Solana-Native ChatGPT Alternative',
  description:
    'Advanced AI chat platform with premium models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini, plus free models: GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2. Solana wallet authentication, RAG capabilities, and Web3 integration. Better privacy and lower costs than traditional AI chat services.',
  keywords: [
    'AI chat platform',
    'ChatGPT alternative',
    'AI assistant',
    'Solana AI',
    'Web3 AI chat',
    'GPT-5',
    'Gemini 2.5',
    'blockchain AI',
    'crypto AI chat',
    'decentralized AI',
    'AI conversation',
    'multi-model AI',
    'wallet authentication',
    'RAG AI',
    'conversational AI',
    'AI chatbot',
    'artificial intelligence',
    'machine learning chat',
    'Solana dApp',
    'Web3 technology',
  ],
  authors: [{ name: 'anubis.chat Team' }],
  creator: 'anubis.chat',
  publisher: 'anubis.chat',
  openGraph: {
    title: 'ANUBIS AI Chat - Web3 AI Assistant | ChatGPT Alternative',
    description:
      'Advanced AI chat with GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini & free models. Solana wallet auth, Web3 integration. Better privacy & lower costs.',
    type: 'website',
    locale: 'en_US',
    url: 'https://anubis.chat',
    siteName: 'ANUBIS AI Chat',
    images: [
      {
        url: '/assets/hero-preview-dark.png',
        width: 1200,
        height: 630,
        alt: 'ANUBIS AI Chat – Web3 AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANUBIS AI Chat - Web3 AI Assistant',
    description:
      'Advanced AI chat with GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini & free models. Solana wallet auth, Web3 integration.',
    creator: '@anubischat',
    site: '@anubischat',
    images: ['/assets/hero-preview-light.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before hydration and is identical on server and client */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {/* Load Satoshi font stylesheet without client event handlers */}
        <link
          crossOrigin="anonymous"
          href="https://api.fontshare.com"
          rel="preconnect"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} bg-gradient-to-b from-primary/5 font-sans antialiased dark:from-primary/10`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <ErrorBoundary>
            <Providers>
              <WebVitals />
              <SchemaMarkup />
              <BreadcrumbSchema />
              <ServiceWorkerManager />
              <main className="min-h-screen w-full overflow-x-hidden">
                {children}
              </main>
              <GlobalCommandPalette />
              <Toaster />
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
