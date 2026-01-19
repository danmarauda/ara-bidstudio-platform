'use client';

import ActivityFooter from '@/components/activityFooter';
import { AuthGuard } from '@/components/auth/authGuard';
import Sidebar from '@/components/sidebar';
import { useReferralTracking } from '@/hooks/use-referral-tracking';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Initialize referral tracking on app load
  useReferralTracking();

  return (
    <AuthGuard>
      <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden overscroll-contain">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </main>
      </div>
      {/* Persistent authenticated activity footer */}
      <ActivityFooter />
    </AuthGuard>
  );
}
