// Lightweight theme controller — light / dark / system, persisted.
// No provider; just a hook backed by localStorage and a class on <html>.

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "cruise-ai-theme";

function resolved(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const r = resolved(mode);
  root.classList.toggle("dark", r === "dark");
  root.style.colorScheme = r;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(KEY) as ThemeMode) || "dark";
  });

  useEffect(() => {
    apply(mode);
    try { localStorage.setItem(KEY, mode); } catch { /* quota */ }
  }, [mode]);

  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const cycle = useCallback(() => {
    setModeState((m) => (m === "dark" ? "light" : m === "light" ? "system" : "dark"));
  }, []);

  return { mode, setMode, cycle, resolved: resolved(mode) };
}
