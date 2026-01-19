import {
  toBeDisabled,
  toBeVisible,
  toHaveTextContent,
} from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, expect, vi } from 'vitest';
import {
  mockNextNavigation,
  mockSolanaWalletAdapter,
  setupWindowMock,
} from './test-utils/mocks';

expect.extend({ toBeDisabled, toBeVisible, toHaveTextContent });

// Setup environment variables before all tests
beforeAll(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex.cloud';
  process.env.JWT_SECRET = 'test-secret';
  // NODE_ENV is read-only in some environments
  // process.env.NODE_ENV = 'test'
});

afterEach(() => {
  cleanup();
});

// Setup global window and localStorage for jsdom using shared utilities
setupWindowMock();

// Add additional window properties needed for testing
Object.defineProperty(window, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    userAgent: 'test-user-agent',
  },
  writable: true,
});

// Mock Next.js navigation using shared utilities
mockNextNavigation();

// Mock Solana wallet adapters using shared utilities
mockSolanaWalletAdapter();
