/**
 * Custom hook for managing file upload limits based on subscription tier
 */

'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useAuthContext } from '@/components/providers/auth-provider';

// Tier limits that match the backend
export const TIER_FILE_LIMITS = {
  free: 0, // No file uploads for free tier
  pro: {
    maxFileSize: 1024 * 1024, // 1MB max per file
    totalStorageLimit: 100 * 1024 * 1024, // 100MB total storage
    maxFilesPerMonth: 50,
  },
  pro_plus: {
    maxFileSize: 5 * 1024 * 1024, // 5MB max per file
    totalStorageLimit: 1024 * 1024 * 1024, // 1GB total storage
    maxFilesPerMonth: 500,
  },
  admin: {
    maxFileSize: 50 * 1024 * 1024, // 50MB max per file
    totalStorageLimit: 10 * 1024 * 1024 * 1024, // 10GB total storage
    maxFilesPerMonth: Number.POSITIVE_INFINITY,
  },
} as const;

type SubscriptionTier = keyof typeof TIER_FILE_LIMITS;

export interface FileUploadLimits {
  canUpload: boolean;
  maxFileSize: number; // in bytes
  maxFiles: number;
  storageUsed: number;
  storageLimit: number;
  filesThisMonth: number;
  filesLimit: number;
  error?: string;
}

export function useFileUploadLimits(): FileUploadLimits {
  const { user, subscription } = useAuthContext();

  // Get current file statistics
  const fileStats = useQuery(
    api.files.getStats,
    user?.walletAddress ? { walletAddress: user.walletAddress } : 'skip'
  );

  const tier = (subscription?.tier || 'free') as SubscriptionTier;
  const tierLimits = TIER_FILE_LIMITS[tier];

  // Free tier cannot upload files
  if (tier === 'free') {
    return {
      canUpload: false,
      maxFileSize: 0,
      maxFiles: 0,
      storageUsed: 0,
      storageLimit: 0,
      filesThisMonth: 0,
      filesLimit: 0,
      error:
        'File uploads require Pro or Pro+ subscription. Please upgrade to upload documents.',
    };
  }

  // Invalid tier or no data yet
  if (typeof tierLimits !== 'object' || !fileStats) {
    return {
      canUpload: false,
      maxFileSize: 0,
      maxFiles: 0,
      storageUsed: 0,
      storageLimit: 0,
      filesThisMonth: 0,
      filesLimit: 0,
      error: 'Loading upload limits...',
    };
  }

  const storageUsed = fileStats.totalSize || 0;
  const filesThisMonth = fileStats.filesThisMonth || 0;

  // Check if user has reached limits
  const hasReachedStorageLimit = storageUsed >= tierLimits.totalStorageLimit;
  const hasReachedFileLimit = filesThisMonth >= tierLimits.maxFilesPerMonth;

  let error: string | undefined;
  if (hasReachedStorageLimit) {
    error = `Storage limit reached (${formatBytes(tierLimits.totalStorageLimit)}). Please delete some files or upgrade.`;
  } else if (hasReachedFileLimit) {
    error = `Monthly file limit reached (${tierLimits.maxFilesPerMonth}). Limit resets next month.`;
  }

  return {
    canUpload: !(hasReachedStorageLimit || hasReachedFileLimit),
    maxFileSize: tierLimits.maxFileSize,
    maxFiles: tierLimits.maxFilesPerMonth,
    storageUsed,
    storageLimit: tierLimits.totalStorageLimit,
    filesThisMonth,
    filesLimit: tierLimits.maxFilesPerMonth,
    error,
  };
}

/**
 * Validate a single file against tier limits
 */
export function validateFileUpload(
  file: File,
  limits: FileUploadLimits
): { valid: boolean; error?: string } {
  if (!limits.canUpload) {
    return { valid: false, error: limits.error };
  }

  // Check file size
  if (file.size > limits.maxFileSize) {
    return {
      valid: false,
      error: `File "${file.name}" (${formatBytes(file.size)}) exceeds your tier limit of ${formatBytes(limits.maxFileSize)}`,
    };
  }

  // Check if adding this file would exceed storage limit
  if (limits.storageUsed + file.size > limits.storageLimit) {
    const remaining = limits.storageLimit - limits.storageUsed;
    return {
      valid: false,
      error: `Adding "${file.name}" would exceed your storage limit. You have ${formatBytes(remaining)} remaining.`,
    };
  }

  return { valid: true };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Get upload recommendations based on tier
 */
export function getUploadRecommendations(tier: SubscriptionTier) {
  switch (tier) {
    case 'free':
      return {
        title: 'Upgrade to Upload Files',
        description: 'Pro tier includes 1MB file uploads and 100MB storage',
        action: 'Upgrade to Pro',
      };
    case 'pro':
      return {
        title: 'Pro File Uploads',
        description:
          'Up to 1MB per file, 100MB total storage, 50 files per month',
        action: 'Upgrade to Pro+ for 5MB files',
      };
    case 'pro_plus':
      return {
        title: 'Pro+ File Uploads',
        description:
          'Up to 5MB per file, 1GB total storage, 500 files per month',
        action: null,
      };
    case 'admin':
      return {
        title: 'Admin File Uploads',
        description: 'Up to 50MB per file, 10GB total storage, unlimited files',
        action: null,
      };
    default:
      return {
        title: 'File Uploads',
        description: 'Please upgrade to upload files',
        action: 'Upgrade',
      };
  }
}
