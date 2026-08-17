import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAiStudy } from "@/shared/lib/api-client";
import { getCategoryColor } from "@/domain/category-colors";
import { Icon } from "@/shared/components/ui/Icon";
import { NotFoundPage } from "@/shared/components/ui/NotFoundPage";
import { useSections } from "@/shared/hooks/useSections";
import type { AiStudyDto } from "@/domain/types";
import { RunCode } from "../components/RunCode";
import { CodeSnippet } from "../components/CodeSnippet";
import { studyToMarkdown, downloadTextFile } from "../lib/exportMarkdown";

export function StudyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { sections } = useSections();
  const [data, setData]       = useState<AiStudyDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setNotFound(false);
    getAiStudy(slug)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <NotFoundPage message="Estudo não encontrado." />;
  if (!data) return null;

  const { metadata, explanations, codeSnippets, comparisons, quiz } = data.content;
  const parentSection = sections.find((s) => s.categories.includes(metadata.category));
  const badgeClass    = getCategoryColor(metadata.category);

  return (
    <div className="flex flex-col gap-10 max-w-4xl" data-print-area>

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
        <span className="text-[var(--text-secondary)]">{metadata.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name={metadata.icon} size={40} strokeWidth={1.5} className="text-[var(--text-secondary)] shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{metadata.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                  {metadata.category}
                </span>
                <span className="text-xs text-[var(--text-faint)]">gerado por IA · {data.generatedBy}</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div data-print-hide className="flex items-center gap-2 shrink-0">
            <Link
              to={`/studies/${slug}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
            >
              <Icon name="Wrench" size={13} /> Editar
            </Link>
            <button
              onClick={() => downloadTextFile(`${slug}.md`, studyToMarkdown(data), "text/markdown")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
            >
              <Icon name="BookOpen" size={13} /> Exportar .md
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
            >
              <Icon name="Package" size={13} /> Exportar PDF
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="bg-[var(--bg-surface)] rounded-md border border-[var(--border-default)] p-6">
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-3">O que é?</h2>
          <p className="text-[var(--text-tertiary)] leading-relaxed">{metadata.description}</p>
        </div>
      </div>

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="flex flex-col gap-4">
          {explanations.map((section, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 rounded-md border p-5 ${
                section.type === "tip"     ? "bg-emerald-950/30 border-emerald-900"
                : section.type === "warning" ? "bg-amber-950/30 border-amber-900"
                : "bg-[var(--bg-surface)] border-[var(--border-default)]"
              }`}
            >
              <h3 className="font-semibold text-[var(--text-primary)]">{section.title}</h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">{section.content}</p>
              {section.items && section.items.length > 0 && (
                <ul className="space-y-1.5 text-[var(--text-tertiary)] text-sm">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-[var(--text-faint)] shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code Snippets */}
      {codeSnippets.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Exemplos de Código</h2>
          {codeSnippets.map((snippet, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">{snippet.title}</h3>
                {snippet.description && (
                  <p className="text-[var(--text-muted)] text-sm mt-0.5">{snippet.description}</p>
                )}
              </div>
              <CodeSnippet code={snippet.code} lang={snippet.language} />
            </div>
          ))}
        </div>
      )}

      {/* Comparisons */}
      {comparisons.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Comparações</h2>
          {comparisons.map((table, i) => (
            <div key={i} className="flex flex-col gap-3">
              <h3 className="font-medium text-[var(--text-primary)]">{table.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {table.items.map((item, j) => (
                  <div key={j} className="flex flex-col gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4 text-sm">
                    <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                    <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">{item.description}</p>
                    {item.pros && item.pros.length > 0 && (
                      <ul className="space-y-1 text-xs">
                        {item.pros.map((p, k) => (
                          <li key={k} className="flex gap-1.5 text-emerald-400"><span>✓</span>{p}</li>
                        ))}
                      </ul>
                    )}
                    {item.cons && item.cons.length > 0 && (
                      <ul className="space-y-1 text-xs">
                        {item.cons.map((c, k) => (
                          <li key={k} className="flex gap-1.5 text-red-400"><span>✗</span>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz */}
      {quiz.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Quiz de Fixação</h2>
          <div className="flex flex-col gap-4">
            {quiz.map((q, i) => (
              <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-5 flex flex-col gap-3">
                <p className="text-[var(--text-primary)] font-medium text-sm">{i + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                        j === q.answerIndex
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                          : "bg-[var(--bg-surface-hover)] border-[var(--border-strong)] text-[var(--text-tertiary)]"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        j === q.answerIndex ? "bg-emerald-700 text-[var(--text-primary)]" : "bg-[var(--bg-control)] text-[var(--text-tertiary)]"
                      }`}>
                        {String.fromCharCode(65 + j)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed border-t border-[var(--border-default)] pt-3">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runnable Code */}
      {data.content.runnableCode && slug && (
        <RunCode
          slug={slug}
          code={data.content.runnableCode.code}
          description={data.content.runnableCode.description}
        />
      )}

      {/* Prompt usado */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
        <p className="text-[var(--text-faint)] text-xs">
          <span className="text-[var(--text-muted)] font-medium">Prompt original:</span> {data.prompt}
        </p>
      </div>

    </div>
  );
}
