import { useCallback, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "lumina-theme";

export function useTheme() {
  const query = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return query?.matches ? "dark" : "light";
  });

  const applyDom = useCallback((next: ThemeMode) => {
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  useEffect(() => applyDom(mode), [applyDom, mode]);

  useEffect(() => {
    const listener = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return;
      setMode(query?.matches ? "dark" : "light");
    };
    query?.addEventListener("change", listener);
    return () => query?.removeEventListener("change", listener);
  }, [query]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const accent = useMemo(
    () => (mode === "dark" ? "from-sky-400/65 via-purple-400/45 to-orange-400/55" : "from-sky-500/85 via-purple-400/70 to-orange-400/65"),
    [mode],
  );

  return { mode, accent, toggle, setMode };
}
