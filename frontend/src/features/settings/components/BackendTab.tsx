import { Section, Field, Input, SaveButton } from "@/shared/components/ui/FormControls";
import type { StudydashConfigDto } from "@/domain/types";

interface Props {
  config: StudydashConfigDto;
  setConfig: (c: StudydashConfigDto) => void;
  saving: boolean;
  save: (patch: Record<string, unknown>) => Promise<void>;
}

export function BackendTab({ config, setConfig, saving, save }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Endereço do servidor">
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Porta única usada pelo StudyDash (API e dashboard são servidos pelo mesmo processo).
        </p>
        <Field label="Porta" hint="Padrão: 5055">
          <Input
            type="number"
            value={config.server.port}
            onChange={(e) =>
              setConfig({ ...config, server: { ...config.server, port: Number(e.target.value) } })
            }
          />
        </Field>
        <SaveButton saving={saving} onClick={() => save({ server: config.server })} />
      </Section>

      <Section title="Código Gerado">
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Todo dado gerado pelo StudyDash (banco SQLite e os arquivos JavaScript executáveis
          criados pela IA) fica dentro da pasta de dados do StudyDash — nunca em um local
          escolhido manualmente.
        </p>
        <Field label="Pasta de código">
          <div className="bg-[var(--bg-surface-hover)]/60 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-tertiary)] font-mono">
            {config.codePath}
          </div>
        </Field>
      </Section>
    </div>
  );
}
