import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getAiStudy, updateAiStudy, updateRunnableCode } from "@/shared/lib/api-client";
import { Icon } from "@/shared/components/ui/Icon";
import { Section, Field, Input, Select, SaveButton } from "@/shared/components/ui/FormControls";
import { NotFoundPage } from "@/shared/components/ui/NotFoundPage";
import type { GeneratedStudyContent, ExplanationSection } from "@/domain/types";

const textarea = "w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-600 transition-colors resize-y font-mono";

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[var(--text-faint)] hover:text-red-400 text-xs transition-colors self-start">
      Remover
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="self-start px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors">
      + {label}
    </button>
  );
}

export function EditStudyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState<GeneratedStudyContent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getAiStudy(slug).then((data) => setContent(data.content)).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <NotFoundPage message="Estudo não encontrado." />;
  if (!content || !slug) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAiStudy(slug, content);
      if (content.runnableCode) await updateRunnableCode(slug, content.runnableCode.code);
      navigate(`/studies/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Editar estudo</h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            Corrija erros ou ajuste o conteúdo gerado pela IA — inclusive o código executável.
          </p>
        </div>
        <Link to={`/studies/${slug}`} className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          Cancelar
        </Link>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-md px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Metadata */}
      <Section title="Metadados">
        <Field label="Título">
          <Input value={content.metadata.title} onChange={(e) => setContent({ ...content, metadata: { ...content.metadata, title: e.target.value } })} />
        </Field>
        <Field label="Descrição">
          <textarea className={textarea} rows={2} value={content.metadata.description}
            onChange={(e) => setContent({ ...content, metadata: { ...content.metadata, description: e.target.value } })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <Input value={content.metadata.category} onChange={(e) => setContent({ ...content, metadata: { ...content.metadata, category: e.target.value } })} />
          </Field>
          <Field label="Ícone">
            <Input value={content.metadata.icon} onChange={(e) => setContent({ ...content, metadata: { ...content.metadata, icon: e.target.value } })} />
          </Field>
        </div>
      </Section>

      {/* Explanations */}
      <Section title="Explicações">
        {content.explanations.map((exp, i) => (
          <div key={i} className="flex flex-col gap-2 border border-[var(--border-strong)] rounded-md p-4">
            <Input value={exp.title} placeholder="Título" onChange={(e) => {
              const explanations = [...content.explanations];
              explanations[i] = { ...exp, title: e.target.value };
              setContent({ ...content, explanations });
            }} />
            <textarea className={textarea} rows={3} value={exp.content} placeholder="Conteúdo" onChange={(e) => {
              const explanations = [...content.explanations];
              explanations[i] = { ...exp, content: e.target.value };
              setContent({ ...content, explanations });
            }} />
            <Select value={exp.type} onChange={(v) => {
              const explanations = [...content.explanations];
              explanations[i] = { ...exp, type: v as ExplanationSection["type"] };
              setContent({ ...content, explanations });
            }}>
              <option value="text">Texto</option>
              <option value="tip">Dica</option>
              <option value="warning">Aviso</option>
            </Select>
            <RemoveButton onClick={() => setContent({ ...content, explanations: content.explanations.filter((_, idx) => idx !== i) })} />
          </div>
        ))}
        <AddButton label="Adicionar explicação" onClick={() => setContent({
          ...content, explanations: [...content.explanations, { title: "", content: "", type: "text" }],
        })} />
      </Section>

      {/* Code snippets */}
      <Section title="Exemplos de código">
        {content.codeSnippets.map((snippet, i) => (
          <div key={i} className="flex flex-col gap-2 border border-[var(--border-strong)] rounded-md p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input value={snippet.title} placeholder="Título" onChange={(e) => {
                const codeSnippets = [...content.codeSnippets];
                codeSnippets[i] = { ...snippet, title: e.target.value };
                setContent({ ...content, codeSnippets });
              }} />
              <Input value={snippet.language} placeholder="Linguagem" onChange={(e) => {
                const codeSnippets = [...content.codeSnippets];
                codeSnippets[i] = { ...snippet, language: e.target.value };
                setContent({ ...content, codeSnippets });
              }} />
            </div>
            <textarea className={textarea} rows={8} value={snippet.code} onChange={(e) => {
              const codeSnippets = [...content.codeSnippets];
              codeSnippets[i] = { ...snippet, code: e.target.value };
              setContent({ ...content, codeSnippets });
            }} />
            <RemoveButton onClick={() => setContent({ ...content, codeSnippets: content.codeSnippets.filter((_, idx) => idx !== i) })} />
          </div>
        ))}
        <AddButton label="Adicionar snippet" onClick={() => setContent({
          ...content, codeSnippets: [...content.codeSnippets, { language: "csharp", title: "", code: "" }],
        })} />
      </Section>

      {/* Comparisons */}
      <Section title="Comparações">
        {content.comparisons.map((table, i) => (
          <div key={i} className="flex flex-col gap-2 border border-[var(--border-strong)] rounded-md p-4">
            <Input value={table.title} placeholder="Título da comparação" onChange={(e) => {
              const comparisons = [...content.comparisons];
              comparisons[i] = { ...table, title: e.target.value };
              setContent({ ...content, comparisons });
            }} />
            {table.items.map((item, j) => (
              <div key={j} className="flex flex-col gap-1.5 bg-[var(--bg-surface-hover)]/40 rounded-lg p-3">
                <Input value={item.name} placeholder="Nome" onChange={(e) => {
                  const comparisons = [...content.comparisons];
                  const items = [...table.items];
                  items[j] = { ...item, name: e.target.value };
                  comparisons[i] = { ...table, items };
                  setContent({ ...content, comparisons });
                }} />
                <textarea className={textarea} rows={2} value={item.description} placeholder="Descrição" onChange={(e) => {
                  const comparisons = [...content.comparisons];
                  const items = [...table.items];
                  items[j] = { ...item, description: e.target.value };
                  comparisons[i] = { ...table, items };
                  setContent({ ...content, comparisons });
                }} />
                <textarea className={textarea} rows={2} value={(item.pros ?? []).join("\n")} placeholder="Prós (um por linha)" onChange={(e) => {
                  const comparisons = [...content.comparisons];
                  const items = [...table.items];
                  items[j] = { ...item, pros: e.target.value.split("\n").filter(Boolean) };
                  comparisons[i] = { ...table, items };
                  setContent({ ...content, comparisons });
                }} />
                <textarea className={textarea} rows={2} value={(item.cons ?? []).join("\n")} placeholder="Contras (um por linha)" onChange={(e) => {
                  const comparisons = [...content.comparisons];
                  const items = [...table.items];
                  items[j] = { ...item, cons: e.target.value.split("\n").filter(Boolean) };
                  comparisons[i] = { ...table, items };
                  setContent({ ...content, comparisons });
                }} />
                <RemoveButton onClick={() => {
                  const comparisons = [...content.comparisons];
                  comparisons[i] = { ...table, items: table.items.filter((_, idx) => idx !== j) };
                  setContent({ ...content, comparisons });
                }} />
              </div>
            ))}
            <div className="flex gap-2">
              <AddButton label="Item" onClick={() => {
                const comparisons = [...content.comparisons];
                comparisons[i] = { ...table, items: [...table.items, { name: "", description: "" }] };
                setContent({ ...content, comparisons });
              }} />
              <RemoveButton onClick={() => setContent({ ...content, comparisons: content.comparisons.filter((_, idx) => idx !== i) })} />
            </div>
          </div>
        ))}
        <AddButton label="Adicionar comparação" onClick={() => setContent({
          ...content, comparisons: [...content.comparisons, { title: "", items: [] }],
        })} />
      </Section>

      {/* Quiz */}
      <Section title="Quiz">
        {content.quiz.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 border border-[var(--border-strong)] rounded-md p-4">
            <textarea className={textarea} rows={2} value={q.question} placeholder="Pergunta" onChange={(e) => {
              const quiz = [...content.quiz];
              quiz[i] = { ...q, question: e.target.value };
              setContent({ ...content, quiz });
            }} />
            <textarea className={textarea} rows={4} value={q.options.join("\n")} placeholder="Opções (uma por linha)" onChange={(e) => {
              const quiz = [...content.quiz];
              quiz[i] = { ...q, options: e.target.value.split("\n") };
              setContent({ ...content, quiz });
            }} />
            <Field label="Índice da resposta correta (0-based)">
              <Input type="number" value={q.answerIndex} onChange={(e) => {
                const quiz = [...content.quiz];
                quiz[i] = { ...q, answerIndex: Number(e.target.value) };
                setContent({ ...content, quiz });
              }} />
            </Field>
            <textarea className={textarea} rows={2} value={q.explanation ?? ""} placeholder="Explicação (opcional)" onChange={(e) => {
              const quiz = [...content.quiz];
              quiz[i] = { ...q, explanation: e.target.value };
              setContent({ ...content, quiz });
            }} />
            <RemoveButton onClick={() => setContent({ ...content, quiz: content.quiz.filter((_, idx) => idx !== i) })} />
          </div>
        ))}
        <AddButton label="Adicionar questão" onClick={() => setContent({
          ...content, quiz: [...content.quiz, { question: "", options: ["", ""], answerIndex: 0 }],
        })} />
      </Section>

      {/* Runnable code */}
      {content.runnableCode && (
        <Section title="Código executável (Node.js)">
          <p className="text-[var(--text-muted)] text-sm leading-relaxed flex items-center gap-2">
            <Icon name="Terminal" size={14} /> {content.runnableCode.filename} — grava no arquivo real em <code>~/.studydash/code</code>.
          </p>
          <textarea className={textarea} rows={16} value={content.runnableCode.code} onChange={(e) => {
            setContent({ ...content, runnableCode: { ...content.runnableCode!, code: e.target.value } });
          }} />
        </Section>
      )}

      <div className="flex gap-3">
        <SaveButton saving={saving} onClick={save} />
        <Link to={`/studies/${slug}`} className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
