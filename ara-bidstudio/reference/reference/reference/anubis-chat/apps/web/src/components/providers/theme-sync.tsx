'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useAuthContext } from './auth-provider';

/**
 * ThemeSync Component
 * Syncs theme preference from database to next-themes
 * Uses cookies to prevent flash of unstyled content
 */
export function ThemeSync() {
  const { isAuthenticated } = useAuthContext();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hasInitialized = useRef(false);
  const lastSyncedTheme = useRef<string | null>(null);

  // Get user preferences from database
  const userPreferences = useQuery(
    api.userPreferences.getUserPreferencesWithDefaults,
    isAuthenticated ? {} : 'skip'
  );

  // Sync theme from database to next-themes
  useEffect(() => {
    if (!userPreferences) {
      return;
    }

    const dbTheme = userPreferences.theme;

    // Skip if already synced to prevent loops
    if (lastSyncedTheme.current === dbTheme) {
      return;
    }

    // Skip if theme is already correct
    if (theme === dbTheme) {
      lastSyncedTheme.current = dbTheme || null;
      return;
    }

    // Set theme and track it
    if (dbTheme) {
      setTheme(dbTheme);
      lastSyncedTheme.current = dbTheme;
    }

    // Store in cookie for next page load
    if (typeof window !== 'undefined' && dbTheme) {
      document.cookie = `theme=${dbTheme};path=/;max-age=31536000;samesite=strict`;
    }
  }, [userPreferences?.theme, theme, setTheme, userPreferences]);

  // Set initial theme from cookie on mount
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // Check for theme cookie
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const themeCookie = cookies.find((c) => c.trim().startsWith('theme='));

      if (themeCookie) {
        const cookieTheme = themeCookie.split('=')[1];
        if (cookieTheme && ['light', 'dark', 'system'].includes(cookieTheme)) {
          // Apply theme immediately to prevent flash
          setTheme(cookieTheme);
          lastSyncedTheme.current = cookieTheme;
        }
      }
    }
  }, [setTheme]);

  // Sync font size preference
  useEffect(() => {
    if (!userPreferences?.fontSize) {
      return;
    }

    // Apply font size class to root element
    const root = document.documentElement;
    const fontSizeClasses = [
      'font-size-small',
      'font-size-medium',
      'font-size-large',
    ];

    // Remove existing font size classes
    fontSizeClasses.forEach((cls) => root.classList.remove(cls));

    // Add new font size class
    root.classList.add(`font-size-${userPreferences.fontSize}`);

    // Store in cookie for next page load
    if (typeof window !== 'undefined') {
      document.cookie = `fontSize=${userPreferences.fontSize};path=/;max-age=31536000;samesite=strict`;
    }
  }, [userPreferences?.fontSize]);

  return null;
}
