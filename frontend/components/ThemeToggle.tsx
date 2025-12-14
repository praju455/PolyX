"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-500/20 transition-all"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      <span className="text-lg">{theme === "dark" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}




