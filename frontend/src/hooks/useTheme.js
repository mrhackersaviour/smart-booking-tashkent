import { useState, useEffect, useCallback } from 'react';

/**
 * useTheme — dark/light mode toggle with localStorage persistence.
 *
 * On mount:
 *  1. Check localStorage('theme')
 *  2. If absent, check system preference (prefers-color-scheme)
 *  3. Apply 'dark' class to <html>
 *
 * Returns: { theme, toggle, isDark }
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle, isDark: theme === 'dark' };
}
