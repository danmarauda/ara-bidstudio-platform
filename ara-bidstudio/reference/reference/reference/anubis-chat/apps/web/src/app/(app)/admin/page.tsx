'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  CreditCard,
  Crown,
  Search,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AgentManagement } from '@/components/admin/agentManagement';
import { PaymentDashboard } from '@/components/admin/paymentDashboard';
import { TokenMetricsDashboard } from '@/components/admin/tokenMetricsDashboard';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
// removed unused Button import
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OverviewCardsProps = {
  subscriptionAnalytics?: {
    totalUsers?: number;
    totalRevenue?: number;
    activeUsers?: number;
  } | null;
  systemUsage?: { totalMessages?: number; totalChats?: number } | null;
};

function OverviewCards({
  subscriptionAnalytics,
  systemUsage,
}: OverviewCardsProps) {
  if (!(subscriptionAnalytics && systemUsage)) {
    return null;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Total Users</span>
        </div>
        <div className="mt-2">
          <div className="font-bold text-2xl">
            {subscriptionAnalytics?.totalUsers || 0}
          </div>
          <p className="text-muted-foreground text-xs">
            {subscriptionAnalytics?.activeUsers || 0} active
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Revenue</span>
        </div>
        <div className="mt-2">
          <div className="font-bold text-2xl">
            {subscriptionAnalytics?.totalRevenue || 0} SOL
          </div>
          <p className="text-muted-foreground text-xs">Monthly recurring</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Messages</span>
        </div>
        <div className="mt-2">
          <div className="font-bold text-2xl">
            {systemUsage?.totalMessages || 0}
          </div>
          <p className="text-muted-foreground text-xs">Total sent</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Chats</span>
        </div>
        <div className="mt-2">
          <div className="font-bold text-2xl">
            {systemUsage?.totalChats || 0}
          </div>
          <p className="text-muted-foreground text-xs">Conversations</p>
        </div>
      </Card>
    </div>
  );
}

type ListedUser = {
  _id: string;
  displayName?: string;
  walletAddress?: string;
  isActive: boolean;
  subscription?: {
    tier: 'free' | 'pro' | 'pro_plus';
    messagesUsed?: number;
    messagesLimit?: number;
    premiumMessagesUsed?: number;
    premiumMessagesLimit?: number;
  };
};

// Removed unused AdminListItem type per linter

function UserRow({
  listedUser,
  onUpdate,
}: {
  listedUser: ListedUser;
  onUpdate: (wallet: string, tier: 'free' | 'pro' | 'pro_plus') => void;
}) {
  const tierLabel = (() => {
    const tier = listedUser.subscription?.tier;
    if (tier === 'pro_plus') {
      return 'Pro+';
    }
    if (tier === 'pro') {
      return 'Pro';
    }
    return 'Free';
  })();
  return (
    <TableRow key={listedUser._id}>
      <TableCell>
        <div>
          <div className="font-medium">
            {listedUser.displayName || 'Anonymous'}
          </div>
          {listedUser.walletAddress && (
            <div className="text-muted-foreground text-sm">
              {listedUser.walletAddress.slice(0, 8)}...
              {listedUser.walletAddress.slice(-4)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {listedUser.subscription && (
          <Badge
            variant={
              listedUser.subscription.tier === 'free' ? 'secondary' : 'default'
            }
          >
            {tierLabel}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {listedUser.subscription && (
          <div className="text-sm">
            <div>
              {listedUser.subscription.messagesUsed || 0}/
              {listedUser.subscription.messagesLimit || 0} messages
            </div>
            <div className="text-muted-foreground">
              {listedUser.subscription.premiumMessagesUsed || 0}/
              {listedUser.subscription.premiumMessagesLimit || 0} premium
            </div>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={listedUser.isActive ? 'default' : 'secondary'}>
          {listedUser.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        {listedUser.walletAddress && listedUser.subscription && (
          <div className="flex gap-2">
            <Select
              onValueChange={(v: string) =>
                onUpdate(
                  listedUser.walletAddress as string,
                  v as 'free' | 'pro' | 'pro_plus'
                )
              }
              value={listedUser.subscription.tier}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="pro_plus">Pro+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function UsersTable({
  users,
  onUpdate,
}: {
  users?: ListedUser[] | null;
  onUpdate: (wallet: string, tier: 'free' | 'pro' | 'pro_plus') => void;
}) {
  if (!users) {
    return null;
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <UserRow key={u._id} listedUser={u} onUpdate={onUpdate} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function AdminDashboardContent() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<
    'all' | 'free' | 'pro' | 'pro_plus'
  >('all');

  // Check if user is admin (for display purposes - auth is handled by AdminGuard)
  const adminStatus = useQuery(api.adminAuth.checkCurrentUserAdminStatus);

  // Get admin data
  const allUsers = useQuery(api.adminAuth.getAllUsers, {
    limit: 100,
    filterTier: tierFilter === 'all' ? undefined : tierFilter,
    search: searchQuery.trim() || undefined,
  });

  const subscriptionAnalytics = useQuery(
    api.adminAuth.getSubscriptionAnalytics
  );
  const systemUsage = useQuery(api.adminAuth.getSystemUsage);
  const admins = useQuery(api.adminAuth.getAllAdmins);

  // Mutations
  const updateUserSubscription = useMutation(
    api.adminAuth.updateUserSubscription
  );
  const _syncAdminsFromEnv = useMutation(api.adminAuth.syncAdminWallets);
  // removed unused promoteToAdmin, selectedUser/showUserModal, and handleInitializeAdmins

  // Handle user subscription update
  const handleUpdateSubscription = async (
    walletAddress: string,
    tier: 'free' | 'pro' | 'pro_plus'
  ) => {
    try {
      await updateUserSubscription({
        walletAddress,
        tier,
        reason: `Admin update by ${user?.walletAddress}`,
      });
      toast.success('User subscription updated successfully');
    } catch (error) {
      toast.error(`Failed to update subscription: ${(error as Error).message}`);
    }
  };

  // Note: OverviewCards component is defined at top-level and used below

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <h1 className="font-semibold text-2xl">Admin Dashboard</h1>
            <Badge className="gap-1" variant="outline">
              <Crown className="h-3 w-3" />
              {adminStatus?.adminInfo?.role}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          System administration and user management
        </p>
      </div>

      {/* Overview Cards */}
      <OverviewCards
        subscriptionAnalytics={subscriptionAnalytics}
        systemUsage={systemUsage}
      />

      {/* Main Content */}
      <Tabs className="space-y-4" defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Token Metrics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Token Metrics Tab */}
        <TabsContent className="space-y-4" value="metrics">
          <TokenMetricsDashboard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent className="space-y-4" value="users">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by wallet address or name..."
                value={searchQuery}
              />
            </div>
            <Select
              onValueChange={(v: string) =>
                setTierFilter(v as 'all' | 'free' | 'pro' | 'pro_plus')
              }
              value={tierFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="pro_plus">Pro+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <UsersTable
            onUpdate={handleUpdateSubscription}
            users={allUsers as unknown as ListedUser[] | null}
          />
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent className="space-y-4" value="agents">
          <AgentManagement />
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent className="space-y-4" value="subscriptions">
          {subscriptionAnalytics?.tierCounts && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Free Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.free || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Pro Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.pro || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Pro+ Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.pro_plus || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent className="space-y-4" value="payments">
          <PaymentDashboard />
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent className="space-y-4" value="admins">
          {admins && (
            <Card>
              <div className="border-b p-6">
                <h3 className="font-medium">System Administrators</h3>
                <p className="text-muted-foreground text-sm">
                  Manage admin access and permissions
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    admins as Array<{
                      _id: string;
                      walletAddress?: string;
                      role?: 'moderator' | 'admin' | 'super_admin' | string;
                      permissions?: string[];
                      createdAt?: number;
                    }>
                  )
                    .filter(
                      (admin) =>
                        Boolean(admin.role) &&
                        ['moderator', 'admin', 'super_admin'].includes(
                          admin.role as 'moderator' | 'admin' | 'super_admin'
                        )
                    )
                    .map((admin) => (
                      <TableRow key={admin._id}>
                        <TableCell>
                          {admin.walletAddress ? (
                            <div className="font-medium">
                              {admin.walletAddress.slice(0, 8)}...
                              {admin.walletAddress.slice(-4)}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              admin.role === 'super_admin'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {admin.permissions?.length ?? 0} permissions
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent className="space-y-4" value="system">
          {systemUsage && (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="mb-4 font-medium">System Statistics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Users
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalUsers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Active Users
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.activeUsers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Chats
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalChats || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Messages
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalMessages || 0}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-2 font-medium">Environment Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Admin Wallets:
                    </span>
                    <span>
                      {process.env.NEXT_PUBLIC_ADMIN_WALLETS?.split(',')
                        ?.length ?? 0}{' '}
                      configured
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Current Admin:
                    </span>
                    <span>
                      {adminStatus?.adminInfo?.walletAddress?.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
