import { useEffect } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  key: string;
  onTrigger: () => void;
  preventDefault?: boolean;
}

/**
 * Custom hook for keyboard shortcuts
 * Supports modifier keys: Ctrl, Shift, Alt
 *
 * @example
 * useKeyboardShortcut({
 *   ctrl: true,
 *   key: 'k',
 *   onTrigger: () => openSearch(),
 * });
 */
export function useKeyboardShortcut({
  ctrl = false,
  shift = false,
  alt = false,
  key,
  onTrigger,
  preventDefault = true,
}: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if modifiers match
      const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        onTrigger();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ctrl, shift, alt, key, onTrigger, preventDefault]);
}

/**
 * Hook for Escape key specifically
 * Commonly used to close modals/dialogs
 */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscape]);
}
