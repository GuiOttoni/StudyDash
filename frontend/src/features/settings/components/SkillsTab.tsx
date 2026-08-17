import { Section, Toggle, SaveButton } from "@/shared/components/ui/FormControls";
import type { StudydashConfigDto } from "@/domain/types";

interface Props {
  config: StudydashConfigDto;
  setConfig: (c: StudydashConfigDto) => void;
  saving: boolean;
  save: (patch: Record<string, unknown>) => Promise<void>;
}

const LABELS: Record<string, string> = {
  codeSnippet:  "Snippets de código — exemplos práticos comentados",
  comparison:   "Tabelas de comparação — prós e contras entre abordagens",
  quiz:         "Quiz de fixação — questões de múltipla escolha",
  explanation:  "Seções de explicação — contexto, conceitos e trade-offs",
  diagram:      "Diagramas — descrição textual de fluxos (experimental)",
};

export function SkillsTab({ config, setConfig, saving, save }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Skills da IA">
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Skills são as ferramentas que a IA pode invocar ao gerar um estudo.
          Desabilitar uma skill remove o tipo de conteúdo correspondente do estudo gerado.
        </p>

        <div className="flex flex-col gap-4 pt-2">
          {(Object.entries(config.ai.skills) as [keyof typeof config.ai.skills, boolean][]).map(([key, val]) => (
            <Toggle
              key={key}
              checked={val}
              label={LABELS[key] ?? key}
              onChange={(v) =>
                setConfig({ ...config, ai: { ...config.ai, skills: { ...config.ai.skills, [key]: v } } })
              }
            />
          ))}
        </div>

        <SaveButton saving={saving} onClick={() => save({ ai: { skills: config.ai.skills } })} />
      </Section>
    </div>
  );
}
