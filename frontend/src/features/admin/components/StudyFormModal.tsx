import { Icon, ICON_NAMES } from "@/shared/components/ui/Icon";
import { AdminField } from "./AdminField";
import type { StudyPayload } from "@/shared/lib/api-client";

interface Props {
  form: StudyPayload;
  editId: number | null;
  saving: boolean;
  categories: string[];
  onChange: (f: StudyPayload) => void;
  onSave: () => void;
  onClose: () => void;
}

export function StudyFormModal({ form, editId, saving, categories, onChange, onSave, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-md w-full max-w-lg flex flex-col gap-5 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--text-primary)] font-semibold text-lg">
            {editId !== null ? "Editar Estudo" : "Novo Estudo"}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Slug" value={form.slug} onChange={(v) => onChange({ ...form, slug: v })} placeholder="ex: bubble-sort" />
            <AdminField label="Título" value={form.title} onChange={(v) => onChange({ ...form, title: v })} placeholder="ex: Bubble Sort" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] font-medium block mb-1">Ícone</label>
              <select
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-emphasis)]"
                value={form.icon}
                onChange={(e) => onChange({ ...form, icon: e.target.value })}
              >
                <option value="">Selecione...</option>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-tertiary)] font-medium">Preview</span>
              <div className="flex items-center justify-center flex-1 bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg min-h-[40px]">
                {form.icon ? <Icon name={form.icon} size={24} strokeWidth={1.5} className="text-[var(--text-secondary)]" /> : <span className="text-[var(--text-faint)] text-xs">—</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] font-medium block mb-1">Categoria</label>
              <select
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-emphasis)]"
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value })}
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <AdminField label="Ordem" type="number" value={String(form.order)} onChange={(v) => onChange({ ...form, order: Number(v) })} placeholder="ex: 7" />
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => onChange({ ...form, available: e.target.checked })}
                  className="w-4 h-4 accent-zinc-400"
                />
                Disponível
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-tertiary)] font-medium block mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-emphasis)] resize-none"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Descrição do estudo"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[var(--bg-control)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-control-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
