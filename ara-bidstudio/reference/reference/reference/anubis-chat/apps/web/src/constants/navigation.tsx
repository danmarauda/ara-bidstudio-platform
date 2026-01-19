import {
  Bot,
  Brain,
  Home,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Users,
  Workflow,
} from 'lucide-react';
import type { ElementType } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: ElementType;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
  inHeader?: boolean;
  inSidebar?: boolean;
  devOnly?: boolean;
  adminOnly?: boolean; // Admin-only navigation items
}

const allItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
    hideWhenAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Agents',
    href: '/agents',
    icon: Bot,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Memories',
    href: '/memories',
    icon: Brain,
    requiresAuth: true,
    adminOnly: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Prompt Library',
    href: '/book-of-the-dead',
    icon: Workflow,
    requiresAuth: true,
    adminOnly: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Referrals',
    href: '/referrals',
    icon: Users,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    requiresAuth: true,
    adminOnly: true,
    inHeader: true,
    inSidebar: true,
  },
  // {
  //   label: 'MCP',
  //   href: '/mcp',
  //   icon: Server,
  //   requiresAuth: true,
  //   inHeader: true,
  //   inSidebar: true,
  // },
  {
    label: 'Admin',
    href: '/admin',
    icon: Shield,
    requiresAuth: true,
    adminOnly: true,
    inHeader: true,
    inSidebar: true,
  },
  // Tailwind Test removed
];

export function getHeaderNav(
  isAuthenticated: boolean,
  isDev: boolean,
  isAdmin?: boolean
): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter(
    (item) =>
      (item.inHeader ?? true) &&
      (!item.devOnly || isDev) &&
      (!item.requiresAuth || isAuthenticated) &&
      !(item.hideWhenAuth && isAuthenticated) &&
      (!item.adminOnly || isAdmin)
  );
}

export function getSidebarNav(
  isAuthenticated: boolean,
  isDev: boolean,
  isAdmin?: boolean
): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter(
    (item) =>
      (item.inSidebar ?? true) &&
      (!item.devOnly || isDev) &&
      (!item.requiresAuth || isAuthenticated) &&
      !(item.hideWhenAuth && isAuthenticated) &&
      (!item.adminOnly || isAdmin)
  );
}
