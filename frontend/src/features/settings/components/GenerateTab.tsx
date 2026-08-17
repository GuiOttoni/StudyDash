import { useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { Section, Field } from "@/shared/components/ui/FormControls";
import { TerminalView } from "@/shared/components/ui/Terminal";
import type { StudydashConfigDto } from "@/domain/types";
import { useGenerateStudy } from "../hooks/useGenerateStudy";

const EXAMPLE_PROMPT =
  "Crie um estudo completo sobre o padrão Observer: explique o problema que ele resolve, " +
  "compare com Pub/Sub e Mediator, gere um exemplo de código em C# e um quiz de fixação.";

interface Props {
  config: StudydashConfigDto | null;
}

export function GenerateTab({ config }: Props) {
  const [prompt, setPrompt] = useState("");
  const { jobId, lines, loading, result, error, generate } = useGenerateStudy();

  const canGenerate = !!(config?.ai.provider === "cli" || config?.ai.hasApiKey) && !!config?.codePath;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Gerar estudo com IA">
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Descreva o tópico que você quer aprender. A IA vai usar as skills habilitadas
          para gerar um estudo completo com código, comparações e quiz.
        </p>

        {!canGenerate && (
          <div className="bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 text-amber-300 text-sm">
            Configure sua API key (ou selecione o provider <strong>Claude Code CLI local</strong>) na aba{" "}
            <strong>Inteligência Artificial</strong> antes de gerar.
          </div>
        )}

        <Field label="Descreva o tópico">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ex: Crie um estudo sobre Observer Pattern em C#, com comparação com Event-Driven Architecture"
            className="bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-violet-600 transition-colors resize-none"
          />
          <button
            type="button"
            onClick={() => setPrompt(EXAMPLE_PROMPT)}
            className="self-start text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Usar prompt de exemplo
          </button>
        </Field>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-950 border border-emerald-800 rounded-lg px-4 py-3 text-emerald-300 text-sm">
            ✓ {result}
          </div>
        )}

        <button
          onClick={() => generate(prompt)}
          disabled={loading || !prompt.trim() || !canGenerate}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-[var(--text-primary)] text-sm font-medium transition-colors"
        >
          <Icon name="Wand2" size={14} />
          {loading ? "Gerando…" : "Gerar estudo"}
        </button>

        {(loading || lines.length > 0) && (
          <TerminalView lines={lines} sessionKey={jobId ?? undefined} />
        )}
      </Section>
    </div>
  );
}
