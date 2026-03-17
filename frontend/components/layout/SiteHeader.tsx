"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white hover:opacity-80 transition-opacity">
          <span className="text-2xl">📚</span>
          <span>StudyDash</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Padrões
          </Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
