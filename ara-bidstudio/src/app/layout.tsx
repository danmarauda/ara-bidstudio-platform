import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { CopilotKit } from "@copilotkit/react-core";
// Clerk provider scaffold (install @clerk/nextjs to enable)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARA Bid Studio - Property Services Tender Management",
  description: "AI-powered bid and tender management platform for ARA Property Services facility management contracts.",
  keywords: "facility management, tender, bid, proposal, property services, ARA",
  authors: [{ name: "ARA Property Services" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <CopilotKit runtimeUrl="/api/copilotkit" agent="bidAgent" showDevConsole={false}>
            {children}
          </CopilotKit>
        </ClerkProvider>
      </body>
    </html>
  );
}
