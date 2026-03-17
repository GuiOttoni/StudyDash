import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/layout/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyDash — Design Patterns & Algoritmos",
  description: "Dashboard interativo para aprender Design Patterns, Algoritmos, Clean Code e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950 text-zinc-100`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SiteHeader />
          <main className="max-w-7xl mx-auto px-4 py-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
