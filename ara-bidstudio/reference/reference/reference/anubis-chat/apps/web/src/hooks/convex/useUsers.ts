/**
 * User-related Convex hooks with Result pattern and real-time updates
 */

import { api } from '@convex/_generated/api';
import { useCallback } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';
import type { Result } from '@/lib/utils/result';
import { success } from '@/lib/utils/result';

const log = createModuleLogger('hooks/convex/useUsers');

import {
  useConvexMutation,
  useConvexQuery,
  useOptimisticMutation,
} from './useConvexResult';

// =============================================================================
// User Queries
// =============================================================================

/**
 * Get user by wallet address with real-time updates
 */
export function useUser(walletAddress: string) {
  return useConvexQuery(api.users.getUserByWallet, { walletAddress });
}

/**
 * Get user usage statistics with real-time updates
 */
export function useUserUsage() {
  return useConvexQuery(api.users.getUsage, {});
}

// =============================================================================
// User Mutations
// =============================================================================

/**
 * Create or update user profile with optimistic updates
 * Note: Backend 'upsert' function not implemented - use updateProfile instead
 */
// export function useUpsertUser() {
//   return useOptimisticMutation(api.users.upsert, {
//     rollbackOnError: true,
//     onOptimisticSuccess: (user: any) => {
//       log.info('User profile updated successfully', { userId: user?._id });
//     },
//     onRollbackError: (error: Error) => {
//       log.error('Failed to update user profile', { error: error.message });
//     },
//   });
// }

/**
 * Update user preferences with optimistic updates
 */
export function useUpdateUserPreferences() {
  return useOptimisticMutation(api.users.updatePreferences, {
    rollbackOnError: true,
    onOptimisticSuccess: (user: any) => {
      log.info('User preferences updated successfully', { userId: user?._id });
    },
    onRollbackError: (error: Error) => {
      log.error('Failed to update user preferences', { error: error.message });
    },
  });
}

/**
 * Update user profile information with optimistic updates
 */
export function useUpdateUserProfile() {
  return useOptimisticMutation(api.users.updateProfile, {
    rollbackOnError: true,
    onOptimisticSuccess: (user: any) => {
      log.info('User profile updated successfully', { userId: user?._id });
    },
    onRollbackError: (error: Error) => {
      log.error('Failed to update user profile', { error: error.message });
    },
  });
}

/**
 * Generate presigned upload URL for avatar
 */
export function useGenerateAvatarUploadUrl() {
  return useConvexMutation(api.users.generateAvatarUploadUrl);
}

/**
 * Save avatar from storageId (resolve to URL and patch user)
 */
export function useSetAvatarFromStorage() {
  return useConvexMutation(api.users.setAvatarFromStorage);
}

/**
 * Track user usage
 */
export function useTrackUsage() {
  return useConvexMutation(api.users.trackUsage);
}

/**
 * Deactivate user account
 */
export function useDeactivateUser() {
  return useConvexMutation(api.users.deactivateAccount);
}

// =============================================================================
// Composite User Operations
// =============================================================================

/**
 * Complete user setup flow (create user + set preferences)
 * Note: Disabled as useUpsertUser is not available - use individual functions instead
 */
// export function useUserSetup() {
//   const { mutate: upsertUser } = useUpsertUser();
//   const { mutate: updatePreferences } = useUpdateUserPreferences();

//   return useCallback(
//     async (userData: {
//       walletAddress: string;
//       publicKey: string;
//       displayName?: string;
//       avatar?: string;
//       preferences?: {
//         theme: 'light' | 'dark';
//         aiModel: string;
//         notifications: boolean;
//       };
//     }): Promise<Result<any, Error>> => {
//       // Step 1: Create/update user
//       const userResult = await upsertUser({
//         walletAddress: userData.walletAddress,
//         publicKey: userData.publicKey,
//         displayName: userData.displayName,
//         avatar: userData.avatar,
//         preferences: userData.preferences,
//       });

//       if (!userResult.success) {
//         return userResult;
//       }

//       // Step 2: Update preferences if provided and different from defaults
//       if (userData.preferences) {
//         const preferencesResult = await updatePreferences({
//           walletAddress: userData.walletAddress,
//           preferences: userData.preferences,
//         });

//         if (!preferencesResult.success) {
//           return preferencesResult;
//         }

//         return success({
//           user: userResult.data,
//           preferences: preferencesResult.data,
//         });
//       }

//       return success({ user: userResult.data });
//     },
//     [upsertUser, updatePreferences]
//   );
// }

/**
 * Batch update user profile and preferences
 */
export function useBatchUserUpdate() {
  const { mutate: updateProfile } = useUpdateUserProfile();
  const { mutate: updatePreferences } = useUpdateUserPreferences();

  return useCallback(
    async (updates: {
      walletAddress: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
      preferences?: {
        theme: 'light' | 'dark';
        aiModel: string;
        notifications: boolean;
      };
    }): Promise<Result<any, Error>> => {
      const results: any[] = [];

      // Update profile if provided
      if (updates.profile) {
        const profileResult = await updateProfile({
          walletAddress: updates.walletAddress,
          ...updates.profile,
        });

        if (!profileResult.success) {
          return profileResult;
        }

        results.push({ type: 'profile', data: profileResult.data });
      }

      // Update preferences if provided
      if (updates.preferences) {
        const preferencesResult = await updatePreferences({
          walletAddress: updates.walletAddress,
          preferences: updates.preferences,
        });

        if (!preferencesResult.success) {
          return preferencesResult;
        }

        results.push({ type: 'preferences', data: preferencesResult.data });
      }

      return success(results);
    },
    [updateProfile, updatePreferences]
  );
}

// =============================================================================
// Real-time User State Management
// =============================================================================

/**
 * Subscribe to user changes with automatic error handling
 */
export function useUserState(walletAddress: string) {
  const userQuery = useUser(walletAddress);
  const usageQuery = useUserUsage();

  return {
    user: userQuery,
    usage: usageQuery,
    isLoading: userQuery.isLoading || usageQuery.isLoading,
    hasError: !!(userQuery.error || usageQuery.error),
    error: userQuery.error || usageQuery.error,
  };
}
