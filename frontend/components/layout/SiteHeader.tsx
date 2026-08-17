"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import type { SectionDto } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

interface Props {
  sections: SectionDto[];
}

export function SiteHeader({ sections }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Close dropdown on navigation
  useEffect(() => setOpen(false), [pathname]);

  const activeSection = sections.find((s) => {
    if (s.slug === "padroes") return pathname === "/" || pathname.startsWith("/padroes") || pathname.startsWith("/patterns");
    return pathname.startsWith(`/${s.slug}`);
  });

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-white hover:opacity-80 transition-opacity shrink-0"
        >
          <span className="text-2xl">📚</span>
          <span>StudyDash</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">

          {/* Categorias dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              {activeSection ? (
                <>
                  <Icon name={activeSection.icon} size={16} strokeWidth={1.5} />
                  <span>{activeSection.title}</span>
                </>
              ) : (
                <span>Categorias</span>
              )}
              <svg
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 overflow-hidden">
                <div className="p-2 grid grid-cols-2 gap-1">
                  {sections.map((section) => {
                    const isActive =
                      section.slug === "padroes"
                        ? pathname === "/" || pathname.startsWith("/padroes") || pathname.startsWith("/patterns")
                        : pathname.startsWith(`/${section.slug}`);

                    return (
                      <Link
                        key={section.slug}
                        href={`/${section.slug}`}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        <Icon name={section.icon} size={18} strokeWidth={1.5} />
                        <span className="font-medium">{section.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Roadmap */}
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

          {/* Admin */}
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-base leading-none">⚙️</span>
            <span>Admin</span>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-violet-900/60 text-violet-300"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <Icon name="Sparkles" size={15} strokeWidth={1.5} />
            <span>IA</span>
          </Link>
        </nav>

        {/* Theme toggle */}
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
