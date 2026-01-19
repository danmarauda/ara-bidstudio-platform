import { vi } from 'vitest';

/**
 * Mock Next.js navigation functions
 */
export function mockNextNavigation() {
  // Mock next/navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
  }));
}

/**
 * Mock Solana wallet adapter
 */
export function mockSolanaWalletAdapter() {
  // Mock @solana/wallet-adapter-react
  vi.mock('@solana/wallet-adapter-react', () => ({
    useConnection: () => ({
      connection: {
        getBalance: vi.fn().mockResolvedValue(0),
        getAccountInfo: vi.fn().mockResolvedValue(null),
      },
    }),
    useWallet: () => ({
      wallet: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      select: vi.fn(),
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
    }),
    WalletProvider: ({ children }: { children: React.ReactNode }) => children,
    ConnectionProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  }));

  // Mock @solana/wallet-adapter-wallets
  vi.mock('@solana/wallet-adapter-wallets', () => ({
    PhantomWalletAdapter: vi.fn(),
    SolflareWalletAdapter: vi.fn(),
  }));
}

/**
 * Setup window mock with localStorage and other browser APIs
 */
export function setupWindowMock() {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  })();

  // Mock sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  })();

  // Define properties on global object
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock window.location
  Object.defineProperty(global, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });

  // Mock window.history
  Object.defineProperty(global, 'history', {
    value: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      length: 1,
      state: null,
    },
    writable: true,
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(global, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });
}
