import { notFound }    from "next/navigation";
import { getAiStudy }  from "@/lib/api";
import { getSections } from "@/lib/api";
import { getCategoryColor } from "@/lib/category-colors";
import { CodeSnippet }  from "@/components/patterns/CodeSnippet";
import { SourceLinks }  from "@/components/patterns/SourceLinks";
import { Icon }         from "@/components/ui/Icon";
import Link             from "next/link";
import type { GeneratedStudyContent } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AiStudyPage({ params }: Props) {
  const { slug }  = await params;
  const sections  = await getSections();

  let data: { content: GeneratedStudyContent; generatedBy: string; prompt: string } | null = null;

  try {
    const res = await getAiStudy(slug);
    data = res;
  } catch {
    notFound();
  }

  const { metadata, explanations, codeSnippets, comparisons, quiz } = data.content;
  const parentSection = sections.find((s) => s.categories.includes(metadata.category));
  const badgeClass    = getCategoryColor(metadata.category);

  return (
    <div className="flex flex-col gap-10 max-w-4xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        {parentSection ? (
          <Link href={`/${parentSection.slug}`} className="hover:text-zinc-300 transition-colors">
            {parentSection.title}
          </Link>
        ) : (
          <Link href="/" className="hover:text-zinc-300 transition-colors">Início</Link>
        )}
        <span>/</span>
        <span className="text-zinc-300">{metadata.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icon name={metadata.icon} size={40} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-white">{metadata.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                {metadata.category}
              </span>
              <span className="text-xs text-zinc-600">gerado por IA · {data.generatedBy}</span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg mb-3">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed">{metadata.description}</p>
        </div>
      </div>

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="flex flex-col gap-4">
          {explanations.map((section, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 rounded-xl border p-5 ${
                section.type === "tip"     ? "bg-emerald-950/30 border-emerald-900"
                : section.type === "warning" ? "bg-amber-950/30 border-amber-900"
                : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <h3 className="font-semibold text-white">{section.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{section.content}</p>
              {section.items && section.items.length > 0 && (
                <ul className="space-y-1.5 text-zinc-400 text-sm">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-zinc-600 shrink-0">·</span>
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
          <h2 className="font-semibold text-white text-xl">Exemplos de Código</h2>
          {codeSnippets.map((snippet, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div>
                <h3 className="font-medium text-zinc-200">{snippet.title}</h3>
                {snippet.description && (
                  <p className="text-zinc-500 text-sm mt-0.5">{snippet.description}</p>
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
          <h2 className="font-semibold text-white text-xl">Comparações</h2>
          {comparisons.map((table, i) => (
            <div key={i} className="flex flex-col gap-3">
              <h3 className="font-medium text-zinc-200">{table.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {table.items.map((item, j) => (
                  <div key={j} className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
                    <span className="font-semibold text-white">{item.name}</span>
                    <p className="text-zinc-400 text-xs leading-relaxed">{item.description}</p>
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
          <h2 className="font-semibold text-white text-xl">Quiz de Fixação</h2>
          <div className="flex flex-col gap-4">
            {quiz.map((q, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
                <p className="text-white font-medium text-sm">{i + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                        j === q.answerIndex
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        j === q.answerIndex ? "bg-emerald-700 text-white" : "bg-zinc-700 text-zinc-400"
                      }`}>
                        {String.fromCharCode(65 + j)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-zinc-500 text-xs leading-relaxed border-t border-zinc-800 pt-3">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt usado */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-600 text-xs">
          <span className="text-zinc-500 font-medium">Prompt original:</span> {data.prompt}
        </p>
      </div>

    </div>
  );
}
