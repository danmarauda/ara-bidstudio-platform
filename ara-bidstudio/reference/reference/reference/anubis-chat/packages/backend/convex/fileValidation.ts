/**
 * File Upload Security and Validation Module
 * Provides comprehensive file validation, virus scanning simulation, and security checks
 */

import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('fileValidation');

// Base file size limits by type (in bytes) - used as maximum caps
const BASE_FILE_SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 50 * 1024 * 1024, // 50MB for documents
  pdf: 50 * 1024 * 1024, // 50MB for PDFs
  text: 5 * 1024 * 1024, // 5MB for text files
  default: 25 * 1024 * 1024, // 25MB default
};

// Subscription tier file size limits (in bytes)
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

// Allowed MIME types with strict validation
const ALLOWED_MIME_TYPES: Record<
  string,
  { extensions: string[]; magic: string | null }
> = {
  // Images
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], magic: 'FFD8FF' },
  'image/png': { extensions: ['.png'], magic: '89504E47' },
  'image/gif': { extensions: ['.gif'], magic: '474946' },
  'image/webp': { extensions: ['.webp'], magic: '52494646' },

  // Documents
  'application/pdf': { extensions: ['.pdf'], magic: '25504446' },
  'text/plain': { extensions: ['.txt'], magic: null },
  'text/markdown': { extensions: ['.md'], magic: null },
  'application/json': { extensions: ['.json'], magic: null },

  // Office documents (be careful with these)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    magic: '504B0304',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extensions: ['.xlsx'],
    magic: '504B0304',
  },
};

// Dangerous patterns to check in file content
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i, // JavaScript in HTML
  /javascript:/i, // JavaScript protocol
  /on\w+\s*=/i, // Event handlers
  /<iframe/i, // Iframes
  /<embed/i, // Embedded content
  /<object/i, // Object tags
  /\.exe$/i, // Executable files
  /\.dll$/i, // DLL files
  /\.bat$/i, // Batch files
  /\.cmd$/i, // Command files
  /\.sh$/i, // Shell scripts
  /\.ps1$/i, // PowerShell scripts
];

// File validation result interface
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  sanitized?: boolean;
  metadata?: {
    size: number;
    mimeType: string;
    extension: string;
    hash: string;
  };
}

/**
 * Validate file before processing with subscription tier limits
 * Performs comprehensive security checks and tier-based size validation
 */
export async function validateFile(
  file: Blob | ArrayBuffer,
  fileName: string,
  declaredMimeType?: string,
  userTier?: keyof typeof TIER_FILE_LIMITS
): Promise<FileValidationResult> {
  const warnings: string[] = [];

  try {
    // Convert to ArrayBuffer if needed
    const buffer = file instanceof Blob ? await file.arrayBuffer() : file;
    const bytes = new Uint8Array(buffer);

    // 1. Check subscription tier file limits first
    const size = bytes.length;

    if (userTier !== undefined) {
      const tierLimit = TIER_FILE_LIMITS[userTier];

      // Free tier cannot upload files
      if (userTier === 'free') {
        return {
          valid: false,
          error:
            'File uploads require Pro or Pro+ subscription. Please upgrade to upload documents.',
        };
      }

      // Check tier-specific file size limit
      if (typeof tierLimit === 'object' && size > tierLimit.maxFileSize) {
        return {
          valid: false,
          error: `File size ${formatBytes(size)} exceeds your ${userTier.toUpperCase()} tier limit of ${formatBytes(tierLimit.maxFileSize)}`,
        };
      }
    }

    // 2. Check base file type limits (as fallback/cap)
    const fileType = getFileType(declaredMimeType || '');
    const baseSizeLimit =
      BASE_FILE_SIZE_LIMITS[fileType] || BASE_FILE_SIZE_LIMITS.default;

    if (size > baseSizeLimit) {
      return {
        valid: false,
        error: `File size ${formatBytes(size)} exceeds system limit of ${formatBytes(baseSizeLimit)}`,
      };
    }

    if (size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // 2. Validate MIME type
    const extension = getFileExtension(fileName);
    const mimeValidation = validateMimeType(
      declaredMimeType || '',
      extension,
      bytes
    );

    if (!mimeValidation.valid) {
      return {
        valid: false,
        error: mimeValidation.error,
      };
    }

    // 3. Check for dangerous content patterns
    const contentCheck = await checkDangerousContent(
      bytes,
      declaredMimeType || ''
    );
    if (!contentCheck.safe) {
      return {
        valid: false,
        error: contentCheck.error,
        warnings: contentCheck.warnings,
      };
    }

    // 4. Check for compression bombs
    const compressionCheck = checkCompressionBomb(bytes, size);
    if (!compressionCheck.safe) {
      return {
        valid: false,
        error: compressionCheck.error,
      };
    }

    // 5. Generate file hash for deduplication
    const hash = await generateFileHash(bytes);

    // 6. Additional checks for specific file types
    if (declaredMimeType?.startsWith('image/')) {
      const imageCheck = validateImageFile(bytes, declaredMimeType);
      if (!imageCheck.valid) {
        warnings.push(imageCheck.warning || 'Image validation warning');
      }
    }

    logger.info('File validation successful', {
      fileName,
      size,
      mimeType: declaredMimeType,
      hash,
    });

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        size,
        mimeType: declaredMimeType || 'application/octet-stream',
        extension,
        hash,
      },
    };
  } catch (error) {
    logger.error('File validation error', error);
    return {
      valid: false,
      error: 'File validation failed',
    };
  }
}

/**
 * Validate MIME type against extension and magic bytes
 */
function validateMimeType(
  mimeType: string,
  extension: string,
  bytes: Uint8Array
): { valid: boolean; error?: string } {
  // Check if MIME type is allowed
  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return {
      valid: false,
      error: `File type '${mimeType}' is not allowed`,
    };
  }

  const typeConfig = ALLOWED_MIME_TYPES[mimeType];

  // Check extension matches
  if (!typeConfig.extensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `File extension '${extension}' doesn't match MIME type '${mimeType}'`,
    };
  }

  // Check magic bytes if available
  if (typeConfig.magic && bytes.length >= 4) {
    const magicBytes = Array.from(bytes.slice(0, 4))
      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
      .join('');

    if (!magicBytes.startsWith(typeConfig.magic)) {
      return {
        valid: false,
        error:
          "File content doesn't match declared type (magic bytes mismatch)",
      };
    }
  }

  return { valid: true };
}

/**
 * Check for dangerous content patterns
 */
async function checkDangerousContent(
  bytes: Uint8Array,
  mimeType: string
): Promise<{ safe: boolean; error?: string; warnings?: string[] }> {
  const warnings: string[] = [];

  // For text-based files, check content
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          error: `Dangerous content pattern detected: ${pattern.source}`,
        };
      }
    }

    // Check for excessive null bytes (could indicate binary content)
    const nullCount = Array.from(bytes).filter((b) => b === 0).length;
    if (nullCount > bytes.length * 0.1) {
      warnings.push('File contains excessive null bytes');
    }
  }

  // Check for embedded executables in all files
  const exeSignatures = [
    [0x4d, 0x5a], // MZ header (DOS/Windows executable)
    [0x7f, 0x45, 0x4c, 0x46], // ELF header (Linux executable)
    [0xcf, 0xfa, 0xed, 0xfe], // Mach-O header (macOS executable)
  ];

  for (const signature of exeSignatures) {
    if (bytes.length >= signature.length) {
      const match = signature.every((byte, index) => bytes[index] === byte);
      if (match) {
        return {
          safe: false,
          error: 'File contains executable code',
        };
      }
    }
  }

  return { safe: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Check for compression bombs (zip bombs, etc.)
 */
function checkCompressionBomb(
  bytes: Uint8Array,
  size: number
): { safe: boolean; error?: string } {
  // Check for suspicious compression ratios in ZIP files
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // PK header (ZIP)
    // Simple heuristic: if file is small but claims large uncompressed size
    // This is a simplified check - production should use proper ZIP parsing
    if (size < 1024 * 1024) {
      // Less than 1MB
      // Look for suspicious patterns
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (text.includes('42.zip') || text.includes('bomb')) {
        return {
          safe: false,
          error: 'Suspicious compression detected - possible zip bomb',
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Validate image files for additional security
 */
function validateImageFile(
  bytes: Uint8Array,
  mimeType: string
): { valid: boolean; warning?: string } {
  // Check for EXIF data that might contain malicious scripts
  // This is a simplified check - use a proper EXIF parser in production

  if (mimeType === 'image/jpeg') {
    // Look for EXIF marker (0xFFE1)
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
        // Found EXIF data - check for suspicious content
        const exifData = bytes.slice(i, Math.min(i + 1000, bytes.length));
        const exifText = new TextDecoder('utf-8', { fatal: false }).decode(
          exifData
        );

        if (/<script/i.test(exifText) || /javascript:/i.test(exifText)) {
          return {
            valid: false,
            warning: 'Image contains suspicious EXIF data',
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Generate SHA-256 hash of file content using Web Crypto API
 */
async function generateFileHash(bytes: Uint8Array): Promise<string> {
  // Create a new ArrayBuffer from the Uint8Array to ensure compatibility
  const buffer = new Uint8Array(bytes).buffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Get file type category from MIME type
 */
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType.startsWith('text/')) {
    return 'text';
  }
  if (mimeType.includes('document')) {
    return 'document';
  }
  return 'default';
}

/**
 * Extract file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.slice(lastDot) : '';
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(fileName: string): string {
  // Remove path traversal patterns
  let sanitized = fileName
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '_')
    .replace(/^\./, '_');

  // Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    sanitized = sanitized.slice(0, 255 - extension.length) + extension;
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/**
 * Check if user can upload more files based on tier limits and current usage
 */
export async function checkUploadLimits(
  ctx: any,
  walletAddress: string,
  userTier: keyof typeof TIER_FILE_LIMITS,
  fileSize: number
): Promise<{
  canUpload: boolean;
  error?: string;
  storageUsed?: number;
  filesThisMonth?: number;
}> {
  // Free tier cannot upload
  if (userTier === 'free') {
    return {
      canUpload: false,
      error:
        'File uploads require Pro or Pro+ subscription. Please upgrade to upload documents.',
    };
  }

  const tierLimit = TIER_FILE_LIMITS[userTier];
  if (typeof tierLimit !== 'object') {
    return { canUpload: false, error: 'Invalid subscription tier' };
  }

  // Get current file statistics
  const files = await ctx.db
    .query('files')
    .withIndex('by_wallet', (q: any) => q.eq('walletAddress', walletAddress))
    .collect();

  // Calculate current storage usage
  const currentStorageUsed = files.reduce(
    (total: number, file: any) => total + file.size,
    0
  );

  // Check if adding this file would exceed storage limit
  if (currentStorageUsed + fileSize > tierLimit.totalStorageLimit) {
    return {
      canUpload: false,
      error: `Adding this file would exceed your ${userTier.toUpperCase()} storage limit of ${formatBytes(tierLimit.totalStorageLimit)}. Current usage: ${formatBytes(currentStorageUsed)}`,
      storageUsed: currentStorageUsed,
    };
  }

  // Check monthly file upload limit
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filesThisMonth = files.filter(
    (file: any) => file.createdAt > thirtyDaysAgo
  ).length;

  if (filesThisMonth >= tierLimit.maxFilesPerMonth) {
    return {
      canUpload: false,
      error: `You have reached your ${userTier.toUpperCase()} monthly limit of ${tierLimit.maxFilesPerMonth} files. Limit resets in ${Math.ceil((thirtyDaysAgo + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))} days.`,
      filesThisMonth,
    };
  }

  return {
    canUpload: true,
    storageUsed: currentStorageUsed,
    filesThisMonth,
  };
}

/**
 * Get user's current file upload statistics and limits
 */
export async function getUserFileStats(
  ctx: any,
  walletAddress: string,
  userTier: keyof typeof TIER_FILE_LIMITS
): Promise<{
  tier: string;
  limits: (typeof TIER_FILE_LIMITS)[keyof typeof TIER_FILE_LIMITS];
  usage: {
    storageUsed: number;
    filesThisMonth: number;
    totalFiles: number;
  };
  remaining: {
    storage: number;
    filesThisMonth: number;
  };
}> {
  const tierLimit = TIER_FILE_LIMITS[userTier];

  if (userTier === 'free') {
    return {
      tier: userTier,
      limits: 0,
      usage: { storageUsed: 0, filesThisMonth: 0, totalFiles: 0 },
      remaining: { storage: 0, filesThisMonth: 0 },
    };
  }

  if (typeof tierLimit !== 'object') {
    throw new Error('Invalid subscription tier');
  }

  // Get user's files
  const files = await ctx.db
    .query('files')
    .withIndex('by_wallet', (q: any) => q.eq('walletAddress', walletAddress))
    .collect();

  const currentStorageUsed = files.reduce(
    (total: number, file: any) => total + file.size,
    0
  );
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filesThisMonth = files.filter(
    (file: any) => file.createdAt > thirtyDaysAgo
  ).length;

  return {
    tier: userTier,
    limits: tierLimit,
    usage: {
      storageUsed: currentStorageUsed,
      filesThisMonth,
      totalFiles: files.length,
    },
    remaining: {
      storage: Math.max(0, tierLimit.totalStorageLimit - currentStorageUsed),
      filesThisMonth: Math.max(0, tierLimit.maxFilesPerMonth - filesThisMonth),
    },
  };
}

/**
 * Create a quarantine record for suspicious files
 */
export interface QuarantineRecord {
  fileId: string;
  fileName: string;
  reason: string;
  threat: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metadata: Record<string, any>;
}

export function createQuarantineRecord(
  fileId: string,
  fileName: string,
  reason: string,
  threat: QuarantineRecord['threat'],
  metadata?: Record<string, any>
): QuarantineRecord {
  return {
    fileId,
    fileName,
    reason,
    threat,
    timestamp: Date.now(),
    metadata: metadata || {},
  };
}
