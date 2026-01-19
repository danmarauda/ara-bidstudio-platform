'use client';

import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormWrapper } from '@/components/forms/form-wrapper';
import { ValidatedInput } from '@/components/forms/validated-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGenerateAvatarUploadUrl,
  useSetAvatarFromStorage,
} from '@/hooks/convex/useUsers';
import type {
  SubscriptionStatus as SubscriptionData,
  SubscriptionLimits,
  UpgradePrompt,
} from '@/hooks/use-subscription';
import type { User } from '@/lib/types/api';
import type { UserProfileProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import {
  type CompatibleSubscription,
  SubscriptionStatus,
} from './subscriptionStatus';

// Initialize logger
const log = createModuleLogger('user-profile');

/**
 * UserProfile component - Display and edit user profile information
 * Includes wallet info, preferences, and subscription details
 */
interface ExtendedUserProfileProps extends UserProfileProps {
  subscription?: SubscriptionData | null;
  limits?: SubscriptionLimits | null;
  upgradePrompt?: UpgradePrompt;
}

export function UserProfile({
  user,
  onUpdate,
  editable = true,
  className,
  children,
  subscription,
  limits,
  upgradePrompt,
}: ExtendedUserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const { mutateAsync: generateUploadUrl } = useGenerateAvatarUploadUrl();
  const { mutateAsync: setAvatarFromStorage } = useSetAvatarFromStorage();

  useEffect(() => {
    setPendingName(user?.displayName ?? '');
  }, [user?.displayName]);

  const handleSaveName = async () => {
    const trimmed = (pendingName ?? '').trim();
    if (!trimmed || trimmed === user?.displayName) {
      setIsEditingName(false);
      return;
    }
    try {
      setSavingName(true);
      await handleProfileUpdate({ displayName: trimmed });
      setIsEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  // Image preprocessing: compress to WebP 256x256
  const compressImage = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file);
    const size = 256;
    const canvas = document.createElement('canvas');
    const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) {
      throw new Error('Canvas not supported');
    }
    ctx2d.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
        'image/webp',
        0.82
      );
    });
    return blob;
  };

  const onAvatarClick = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Please choose an image under 5MB.');
          return;
        }
        try {
          const compressed = await compressImage(file);
          const url: string = await generateUploadUrl({});
          const res = await fetch(url, { method: 'POST', body: compressed });
          if (!res.ok) {
            throw new Error('Upload failed');
          }
          const { storageId } = await res.json();
          await setAvatarFromStorage({ storageId });
          toast.success('Profile photo updated');
        } catch (_err) {
          toast.error('Failed to update photo');
        }
      };
      input.click();
    } catch (_e) {
      toast.error('Unable to start upload');
    }
  };

  const handleProfileUpdate = async (data: Partial<User>) => {
    try {
      await onUpdate?.(data);
      setIsEditing(false);
      log.info('Profile updated successfully', {
        operation: 'profile_update',
      });
    } catch (error) {
      log.error('Failed to update profile', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'profile_update',
      });
      // Handle error (show toast, etc.)
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier) {
      case 'pro_plus':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatTierLabel = (tier?: string) => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      default:
        return 'Free';
    }
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2">
            <Avatar
              className="h-12 w-12 cursor-pointer ring-1 ring-border transition hover:ring-primary/40 sm:h-14 sm:w-14"
              onClick={onAvatarClick}
            >
              <AvatarImage alt="avatar" src={user?.avatar} />
              <AvatarFallback>{user?.displayName?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      className="h-8 w-48"
                      onChange={(e) => setPendingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveName();
                        }
                        if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setPendingName(user?.displayName ?? '');
                        }
                      }}
                      placeholder="Enter name"
                      value={pendingName}
                    />
                    <Button
                      className="h-8"
                      disabled={savingName}
                      onClick={handleSaveName}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      className="h-8"
                      onClick={() => {
                        setIsEditingName(false);
                        setPendingName(user?.displayName ?? '');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    className="cursor-pointer rounded-md bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text px-2 py-1 font-semibold text-[18px] text-transparent transition hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-xl"
                    onClick={() => editable && setIsEditingName(true)}
                    type="button"
                  >
                    {user?.displayName ?? 'Anonymous User'}
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {user?.walletAddress
                  ? formatWalletAddress(user.walletAddress)
                  : 'No wallet connected'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  size="sm"
                  variant={user?.isActive ? 'success' : 'default'}
                >
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  className={getSubscriptionTierColor(
                    subscription?.tier || user?.subscription?.tier || 'free'
                  )}
                  size="sm"
                >
                  {formatTierLabel(
                    subscription?.tier || user?.subscription?.tier || 'free'
                  )}
                </Badge>
              </div>
            </div>
            {editable && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
              >
                <Settings className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
          <div className="border-border/60 border-b" />

          {isEditing ? (
            <FormWrapper
              defaultValues={{
                displayName: user?.displayName ?? '',
                avatar: user?.avatar ?? '',
              }}
              onSubmit={handleProfileUpdate}
            >
              <div className="space-y-4">
                <ValidatedInput
                  label="Display Name"
                  name="displayName"
                  placeholder="Enter your display name"
                />
                <ValidatedInput
                  label="Avatar URL"
                  name="avatar"
                  placeholder="https://example.com/avatar.png"
                  type="url"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </FormWrapper>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge className="text-[10px]" variant="outline">
                      Wallet
                    </Badge>
                    {user?.walletAddress && (
                      <Badge className="text-[10px]" variant="secondary">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-foreground">
                    Wallet Address
                  </h4>
                  <p className="font-mono text-muted-foreground text-sm">
                    {user?.walletAddress || 'Not available'}
                  </p>
                </div>
              </Card>

              <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge className="text-[10px]" variant="outline">
                      Account
                    </Badge>
                  </div>
                  <h4 className="font-medium text-foreground">
                    Account Created
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge className="text-[10px]" variant="outline">
                    Interface
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground">Theme</h4>
                <p className="text-muted-foreground text-sm">
                  {user.preferences?.theme
                    ? user.preferences.theme.charAt(0).toUpperCase() +
                      user.preferences.theme.slice(1)
                    : 'System default'}
                </p>
              </div>
            </Card>

            <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge className="text-[10px]" variant="outline">
                    Chat
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground">Font Size</h4>
                <p className="text-muted-foreground text-sm">
                  {user.preferences?.fontSize
                    ? user.preferences.fontSize.charAt(0).toUpperCase() +
                      user.preferences.fontSize.slice(1)
                    : 'Medium'}
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge className="text-[10px]" variant="outline">
                    AI
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground">
                  Default AI Model
                </h4>
                <p className="text-muted-foreground text-sm">
                  {user.preferences?.defaultModel || 'GPT-OSS-20B (Free)'}
                </p>
              </div>
            </Card>

            <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge className="text-[10px]" variant="outline">
                    Behavior
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground">
                  Stream Responses
                </h4>
                <p className="text-muted-foreground text-sm">
                  {user.preferences?.streamResponses !== false
                    ? 'Enabled'
                    : 'Disabled'}
                </p>
              </div>
            </Card>
          </div>

          <Card className="border border-border/60 bg-gradient-to-b from-primary/5 p-3 hover:ring-1 hover:ring-primary/20 sm:p-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge className="text-[10px]" variant="outline">
                  Privacy
                </Badge>
              </div>
              <h4 className="mb-1 font-medium text-foreground">Chat History</h4>
              <p className="mb-2 text-muted-foreground text-sm">
                {user.preferences?.saveHistory !== false
                  ? 'Saved'
                  : 'Not saved'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Memory:</span>
                  <span className="ml-1">
                    {user.preferences?.enableMemory !== false
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Auto-scroll:</span>
                  <span className="ml-1">
                    {user.preferences?.autoScroll !== false
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'subscription',
      label: 'Subscription',
      content: (
        <SubscriptionStatus
          limits={limits}
          showUpgrade={
            (subscription?.tier || user?.subscription?.tier) === 'free'
          }
          subscription={subscription as CompatibleSubscription | undefined}
          upgradePrompt={upgradePrompt}
        />
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
      {children}
    </div>
  );
}

export default UserProfile;
