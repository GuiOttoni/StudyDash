import type { ReactNode } from "react";
import { Link } from "react-router";
import { useSections } from "@/shared/hooks/useSections";
import { getCategoryColor } from "@/domain/category-colors";
import { SourceLinks } from "@/features/study-detail/components/SourceLinks";
import { CodeSnippet } from "@/features/study-detail/components/CodeSnippet";
import { Icon } from "@/shared/components/ui/Icon";

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
  category: string;
  description: string;
  complexities?: Complexity[];
  steps?: string[];
  sources?: Source[];
  code: string;
  codeLang?: string;
  codeTitle?: string;
  codeDescription?: string;
  children: ReactNode;
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
  children,
}: Props) {
  const { sections } = useSections();
  const parentSection = sections.find((s) => s.categories.includes(category));
  const badgeClass = getCategoryColor(category);

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        {parentSection ? (
          <Link to={`/${parentSection.slug}`} className="hover:text-[var(--text-secondary)] transition-colors">
            {parentSection.title}
          </Link>
        ) : (
          <Link to="/" className="hover:text-[var(--text-secondary)] transition-colors">Início</Link>
        )}
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icon name={icon} size={40} strokeWidth={1.5} className="text-[var(--text-secondary)] shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
              {category}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="flex flex-col gap-4 bg-[var(--bg-surface)] rounded-md border border-[var(--border-default)] p-6">
          <h2 className="font-semibold text-[var(--text-primary)] text-lg">O que é?</h2>
          <p className="text-[var(--text-tertiary)] leading-relaxed">{description}</p>

          {complexities && complexities.length > 0 && (
            <>
              <h2 className="font-semibold text-[var(--text-primary)] text-lg">Complexidade</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {complexities.map(({ label, value, note, color }) => (
                  <div key={label} className="bg-[var(--bg-surface-hover)] rounded-lg p-3 border border-[var(--border-strong)] text-center">
                    <p className="text-[var(--text-muted)] text-xs mb-1">{label}</p>
                    <p className={`font-mono font-bold text-lg ${color}`}>{value}</p>
                    <p className="text-[var(--text-faint)] text-xs">{note}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {steps && steps.length > 0 && (
            <>
              <h2 className="font-semibold text-[var(--text-primary)] text-lg">Como funciona?</h2>
              <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-tertiary)] leading-relaxed">
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
        <h2 className="font-semibold text-[var(--text-primary)] text-xl">{codeTitle}</h2>
        {codeDescription && <p className="text-[var(--text-muted)] text-sm">{codeDescription}</p>}
        <CodeSnippet code={code} lang={codeLang} />
      </div>

      {/* Interactive */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-[var(--text-primary)] text-xl">Visualização Interativa</h2>
        {children}
      </div>
    </div>
  );
}
