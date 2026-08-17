import { Link, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { useSections } from "@/shared/hooks/useSections";

export function SiteHeader() {
  const { sections } = useSections();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
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
    <header data-print-hide className="border-b border-[var(--border-default)] bg-[var(--bg-app)]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-lg tracking-tight text-[var(--text-primary)] hover:opacity-80 transition-opacity shrink-0"
        >
          <Icon name="BookOpen" size={20} strokeWidth={1.5} />
          <span className="font-mono">StudyDash</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 font-mono text-xs tracking-wide uppercase">

          {/* Categorias dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                activeSection
                  ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60"
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
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xl shadow-black/40 overflow-hidden normal-case font-sans">
                <div className="p-2 grid grid-cols-2 gap-1">
                  {sections.map((section) => {
                    const isActive =
                      section.slug === "padroes"
                        ? pathname === "/" || pathname.startsWith("/padroes") || pathname.startsWith("/patterns")
                        : pathname.startsWith(`/${section.slug}`);

                    return (
                      <Link
                        key={section.slug}
                        to={`/${section.slug}`}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-[var(--bg-control)] text-[var(--text-primary)]"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
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
            to="/roadmap"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              pathname === "/roadmap"
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60"
            }`}
          >
            <Icon name="Map" size={15} strokeWidth={1.5} />
            <span>Roadmap</span>
          </Link>

          {/* Admin */}
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60"
            }`}
          >
            <Icon name="Settings" size={15} strokeWidth={1.5} />
            <span>Admin</span>
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-violet-900/60 text-violet-300"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/60"
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
            className="p-2 rounded-lg bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-control)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
            aria-label="Alternar tema"
          >
            <Icon name={theme === "dark" ? "Sun" : "Moon"} size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
