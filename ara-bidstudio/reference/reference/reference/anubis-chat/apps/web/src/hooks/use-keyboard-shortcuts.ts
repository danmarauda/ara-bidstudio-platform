import { useEffect, useMemo } from 'react';

// Canonical modifier order for consistent normalization
const MODIFIER_ORDER = ['mod', 'shift', 'alt'] as const;

// Modifier aliases mapping
const MODIFIER_ALIASES: Record<string, string> = {
  cmd: 'mod',
  command: 'mod',
  ctrl: 'mod',
  control: 'mod',
  meta: 'mod',
  opt: 'alt',
  option: 'alt',
};

// Key aliases mapping
const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ins: 'insert',
  pageup: 'pageup',
  pagedown: 'pagedown',
  arrow: '', // Remove 'arrow' prefix
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
};

/**
 * Normalizes a keyboard shortcut string to a canonical form
 * @param shortcut - The shortcut string to normalize (e.g., "shift+cmd+k", "ctrl+shift+a")
 * @returns The normalized shortcut string with consistent modifier order and aliases resolved
 */
function normalizeShortcut(shortcut: string): string {
  if (!shortcut) {
    return '';
  }

  // Lowercase and split by '+'
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());

  // Separate modifiers from key
  const modifiers: string[] = [];
  let mainKey = '';

  for (const part of parts) {
    // Map aliases
    const normalized = MODIFIER_ALIASES[part] || part;

    // Check if it's a modifier
    if (
      MODIFIER_ORDER.includes(normalized as any) ||
      normalized in MODIFIER_ALIASES
    ) {
      if (!modifiers.includes(MODIFIER_ALIASES[normalized] || normalized)) {
        modifiers.push(MODIFIER_ALIASES[normalized] || normalized);
      }
    } else {
      // It's the main key - apply key aliases
      mainKey = KEY_ALIASES[part] || part;
    }
  }

  // Sort modifiers according to canonical order
  modifiers.sort((a, b) => {
    const aIndex = MODIFIER_ORDER.indexOf(a as any);
    const bIndex = MODIFIER_ORDER.indexOf(b as any);
    // If not found in order, put at end
    const aOrder = aIndex === -1 ? MODIFIER_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? MODIFIER_ORDER.length : bIndex;
    return aOrder - bOrder;
  });

  // Reconstruct the normalized shortcut
  return modifiers.length > 0 ? `${modifiers.join('+')}+${mainKey}` : mainKey;
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>
) {
  // Normalize all registered shortcuts once
  const normalizedShortcuts = useMemo(() => {
    const normalized: Record<string, (event: KeyboardEvent) => void> = {};
    for (const [shortcut, handler] of Object.entries(shortcuts)) {
      normalized[normalizeShortcut(shortcut)] = handler;
    }
    return normalized;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event target is an editable element
      const target = e.target as HTMLElement;
      const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true' ||
        target.contentEditable === 'plaintext-only';

      // Check if any modifier keys are pressed
      const hasModifiers = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;

      // Early return if typing in an editable element without modifiers
      // This allows normal typing and standard shortcuts (like Ctrl+C) to work
      if (isEditableElement && !hasModifiers) {
        return;
      }

      // Build the event shortcut string
      const key = e.key.toLowerCase();
      const modifiers: string[] = [];

      // Use 'mod' for cross-platform compatibility
      if (e.ctrlKey || e.metaKey) {
        modifiers.push('mod');
      }
      if (e.shiftKey) {
        modifiers.push('shift');
      }
      if (e.altKey) {
        modifiers.push('alt');
      }

      // Apply key aliases to the event key
      const normalizedKey = KEY_ALIASES[key] || key;

      // Build and normalize the event shortcut
      const eventShortcut =
        modifiers.length > 0
          ? `${modifiers.join('+')}+${normalizedKey}`
          : normalizedKey;
      const normalizedEventShortcut = normalizeShortcut(eventShortcut);

      // Check if we have a handler for this normalized shortcut
      if (normalizedShortcuts[normalizedEventShortcut]) {
        // Pass the event to the handler, allowing it to decide whether to preventDefault
        normalizedShortcuts[normalizedEventShortcut](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [normalizedShortcuts]);
}
