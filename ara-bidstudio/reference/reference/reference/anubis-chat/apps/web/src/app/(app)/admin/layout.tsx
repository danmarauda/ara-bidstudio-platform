'use client';

import { Shield } from 'lucide-react';
import { AdminGuard } from '@/components/auth/adminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard
      fallback={
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="mt-4 font-bold text-2xl">Access Denied</h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              This area is restricted to system administrators only. If you
              believe you should have access, please contact your system
              administrator.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-full bg-background">
        {/* Admin-specific header or context could go here */}
        <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3">
          <Shield className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-muted-foreground text-sm">
            Administrator Area
          </span>
        </div>
        {children}
      </div>
    </AdminGuard>
  );
}
