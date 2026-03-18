"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { sections } from "@/lib/patterns-data";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const isActive = (slug: string) => {
    if (slug === "padroes") return pathname === "/" || pathname.startsWith("/padroes");
    return pathname.startsWith(`/${slug}`);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-white hover:opacity-80 transition-opacity shrink-0"
        >
          <span className="text-2xl">📚</span>
          <span>StudyDash</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {sections.map((section) => (
            <Link
              key={section.slug}
              href={`/${section.slug}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(section.slug)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <span className="text-base leading-none">{section.icon}</span>
              <span>{section.title}</span>
            </Link>
          ))}
          <Link
            href="/roadmap"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              pathname === "/roadmap"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-base leading-none">🗺️</span>
            <span>Roadmap</span>
          </Link>
        </nav>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white shrink-0"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        )}
      </div>
    </header>
  );
}
