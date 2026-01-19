'use client';

import React, { type PropsWithChildren } from 'react';

// Minimal no-op shim for framer-motion APIs used in the project
// Provides motion.div, motion.span, etc., and AnimatePresence that just renders children

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };

function passthrough<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
  const Component = (props: AnyProps) =>
    React.createElement(tag, props, props.children);
  Component.displayName = `motion.${String(tag)}`;
  return Component as unknown as React.ComponentType<AnyProps>;
}

export const motion: Record<string, React.ComponentType<AnyProps>> = new Proxy(
  {},
  {
    get: (_target, prop: string) =>
      passthrough(prop as keyof React.JSX.IntrinsicElements),
  }
);

export function AnimatePresence({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export default { motion, AnimatePresence };
