import Link from "next/link";
import { categoryColors, PatternCategory, sections } from "@/lib/patterns-data";
import { SourceLinks } from "./SourceLinks";
import { CodeSnippet } from "./CodeSnippet";

interface Complexity {
  label: string;
  value: string;
  note: string;
  color: string;
}

interface Source {
  label: string;
  url: string;
  icon: string;
}

interface Props {
  title: string;
  icon: string;
  category: PatternCategory;
  description: string;
  complexities?: Complexity[];
  steps?: string[];
  sources?: Source[];
  code: string;
  codeLang?: string;
  codeTitle?: string;
  codeDescription?: string;
  children: React.ReactNode;
}

export function AlgorithmLayout({
  title,
  icon,
  category,
  description,
  complexities,
  steps,
  sources,
  code,
  codeLang = "csharp",
  codeTitle = "Código de Exemplo",
  codeDescription,
  children
}: Props) {
  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        {(() => {
          const section = sections.find((s) => s.categories.includes(category));
          return section ? (
            <Link href={`/${section.slug}`} className="hover:text-zinc-300 transition-colors">
              {section.title}
            </Link>
          ) : (
            <Link href="/" className="hover:text-zinc-300 transition-colors">Início</Link>
          );
        })()}
        <span>/</span>
        <span className="text-zinc-300">{title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[category]}`}>
              {category}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="flex flex-col gap-4 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed">
            {description}
          </p>

          {complexities && complexities.length > 0 && (
            <>
              <h2 className="font-semibold text-white text-lg">Complexidade</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {complexities.map(({ label, value, note, color }) => (
                  <div key={label} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 text-center">
                    <p className="text-zinc-500 text-xs mb-1">{label}</p>
                    <p className={`font-mono font-bold text-lg ${color}`}>{value}</p>
                    <p className="text-zinc-600 text-xs">{note}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {steps && steps.length > 0 && (
            <>
              <h2 className="font-semibold text-white text-lg">Como funciona?</h2>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 leading-relaxed">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>

        {sources && sources.length > 0 && <SourceLinks sources={sources} />}
      </div>

      {/* Code */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">{codeTitle}</h2>
        {codeDescription && <p className="text-zinc-500 text-sm">{codeDescription}</p>}
        <CodeSnippet code={code} lang={codeLang} />
      </div>

      {/* Interactive */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Visualização Interativa</h2>
        {children}
      </div>
    </div>
  );
}
