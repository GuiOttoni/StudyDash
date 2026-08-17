import { Outlet } from "react-router";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/shared/components/layout/SiteHeader";

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] antialiased">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-10">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}
