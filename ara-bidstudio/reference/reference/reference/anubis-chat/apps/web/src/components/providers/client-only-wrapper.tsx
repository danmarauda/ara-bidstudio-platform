'use client';

import { type ReactNode, useEffect, useState } from 'react';

interface ClientOnlyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that only renders children on the client side
 * Prevents hydration mismatches for components that rely on browser APIs
 *
 * According to Next.js best practices, this approach ensures:
 * - No SSR for wallet-related components that depend on browser APIs
 * - Clean hydration without mismatches
 * - Proper handling of dynamic content
 */
export function ClientOnlyWrapper({
  children,
  fallback = null,
}: ClientOnlyWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Return null or fallback during SSR and initial client render
  // This prevents hydration mismatches
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  // Only render children after client-side mount
  return <>{children}</>;
}
