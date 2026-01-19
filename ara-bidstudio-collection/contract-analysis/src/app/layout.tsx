import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { AuthProvider } from '@/app/auth/context';
import { ConvexClientProvider } from './convex-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contract Analysis Platform",
  description: "Modern contract analysis with real-time collaboration and AI processing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <ConvexClientProvider>
          <AuthProvider>
          <nav className="bg-white shadow-sm p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Contract Analysis
              </Link>
              <div className="flex space-x-4">
                <Link href="/documents" className="text-gray-600 hover:text-gray-900">
                  Documents
                </Link>
                <Link href="/annotations" className="text-gray-600 hover:text-gray-900">
                  Annotations
                </Link>
                <Link href="/corpuses" className="text-gray-600 hover:text-gray-900">
                  Corpuses
                </Link>
                <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
              </div>
            </div>
          </nav>
          <main>
            {children}
          </main>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
