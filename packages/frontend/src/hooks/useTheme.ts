/**
 * useTheme Hook
 * Manages dark/light theme with localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: "light" | "dark";
  rawTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "taskflow-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

export function useTheme(): UseThemeReturn {
  const [rawTheme, setRawTheme] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    rawTheme === "system" ? getSystemTheme() : rawTheme,
  );

  // Apply theme to document
  useEffect(() => {
    const theme = rawTheme === "system" ? getSystemTheme() : rawTheme;
    setResolvedTheme(theme);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // Also set color-scheme for native elements
    root.style.colorScheme = theme;
  }, [rawTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (rawTheme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light");
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [rawTheme]);

  const setTheme = useCallback((theme: Theme) => {
    setRawTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme: resolvedTheme,
    rawTheme,
    setTheme,
    toggleTheme,
  };
}
