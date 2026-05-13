import { createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContext
 * ─────────────────────────────────────────────────────────────
 * Provides { isDark, toggleTheme } to every component in the tree.
 *
 * Priority order for the initial theme value:
 *   1. Explicit choice the user saved in localStorage ('theme' key)
 *   2. OS / browser preference via the prefers-color-scheme media query
 *   3. Fallback → light mode
 *
 * Applying the theme:
 *   The provider sets `data-theme="dark"` on <html>.  All CSS custom-property
 *   overrides live under the [data-theme="dark"] selector in globals.css, so
 *   changing this attribute instantly re-themes the entire app.
 */

// Default context value — used only when a component is rendered outside the
// provider (shouldn't happen in normal usage, but guards against crashes).
const ThemeContext = createContext({
  isDark:      false,
  toggleTheme: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }) {
  // Lazy initialiser runs once on mount — avoids a flash of the wrong theme.
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark')  return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Keep <html data-theme> in sync whenever isDark changes.
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  // Follow OS-level changes only when the user has NOT set a manual preference.
  // If they have, their explicit choice always wins.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = (e) => {
      if (!localStorage.getItem('theme')) setIsDark(e.matches);
    };
    mq.addEventListener('change', handleOsChange);
    return () => mq.removeEventListener('change', handleOsChange);
  }, []);

  // Called by the Navbar toggle — saves the explicit choice to localStorage
  // so it survives across page reloads.
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

// Import and call useTheme() inside any component instead of the verbose
// useContext(ThemeContext) pattern.
export const useTheme = () => useContext(ThemeContext);
