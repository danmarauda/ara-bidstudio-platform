'use client';

import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
  Settings,
  User,
  Wallet as WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const dashboardItems = [
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: User,
    description: 'Manage your profile information',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configure your preferences',
  },
  {
    label: 'Wallet',
    href: '/wallet',
    icon: WalletIcon,
    description: 'Manage your connected wallet',
  },
  {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: Activity,
    description: 'View your activity history',
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Manage subscriptions and payments',
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    description: 'Notification preferences',
  },
  {
    label: 'API Keys',
    href: '/dashboard/api-keys',
    icon: FileText,
    description: 'Manage your API keys',
  },
  {
    label: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle,
    description: 'Get help and support',
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <h2 className="font-semibold text-lg">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Manage your account</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1 pb-4">
          {dashboardItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={cn(
                  'flex items-start gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
