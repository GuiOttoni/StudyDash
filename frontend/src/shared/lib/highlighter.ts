import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";

// Restringe as linguagens carregadas pelo shiki às que o app realmente usa
// (páginas estáticas + o que o system prompt da IA pede em SKILL_ADD_CODE) —
// o pacote `shiki` tem ~200 linguagens; `codeToHtml` sem essa lista carrega
// todas elas no bundle.
const SUPPORTED_LANGS = [
  "csharp", "typescript", "javascript", "python", "java", "go", "rust", "json", "sql",
] as const satisfies readonly BundledLanguage[];

type SupportedLang = (typeof SUPPORTED_LANGS)[number];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: ["github-dark"], langs: [...SUPPORTED_LANGS] });
  }
  return highlighterPromise;
}

function resolveLang(lang: string): SupportedLang | "text" {
  return (SUPPORTED_LANGS as readonly string[]).includes(lang) ? (lang as SupportedLang) : "text";
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, { lang: resolveLang(lang), theme: "github-dark" });
}
