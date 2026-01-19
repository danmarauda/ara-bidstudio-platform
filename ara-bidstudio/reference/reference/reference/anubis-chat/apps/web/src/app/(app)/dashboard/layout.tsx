import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | ANUBIS AI Chat',
  description:
    'Personal usage statistics and settings for your ANUBIS account.',
  alternates: { canonical: '/dashboard' },
  openGraph: {
    url: 'https://anubis.chat/dashboard',
    title: 'Dashboard | ANUBIS AI Chat',
    description: 'Manage your account and usage.',
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
