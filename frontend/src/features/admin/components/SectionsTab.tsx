import { useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { createSection, updateSection, deleteSection, resetSections, type SectionPayload } from "@/shared/lib/api-client";
import type { SectionDto } from "@/domain/types";
import { SectionFormModal } from "./SectionFormModal";

const blankSection = (): SectionPayload => ({
  slug: "", title: "", icon: "", description: "", categories: [], order: 0,
});

interface Props {
  sections: SectionDto[];
  onSaved: () => void;
  onError: (e: unknown) => void;
}

export function SectionsTab({ sections, onSaved, onError }: Props) {
  const [form, setForm] = useState<SectionPayload | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditId(null); setForm(blankSection()); };
  const openEdit   = (s: SectionDto) => { setEditId(s.id); setForm({ slug: s.slug, title: s.title, icon: s.icon, description: s.description, categories: s.categories, order: s.order }); };
  const closeForm  = () => { setForm(null); setEditId(null); };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      if (editId !== null) await updateSection(editId, form);
      else                  await createSection(form);
      closeForm();
      onSaved();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSection(id);
      setConfirmDelete(null);
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Isso vai apagar todas as seções e restaurar o seed padrão. Continuar?")) return;
    try {
      await resetSections();
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-tertiary)] text-sm">{sections.length} seções</span>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Resetar seed
          </button>
          <button onClick={openCreate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-control)] text-[var(--text-primary)] hover:bg-[var(--bg-control-hover)] transition-colors">
            + Nova seção
          </button>
        </div>
      </div>

      <div className="rounded-md border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Icon</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Título</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Categorias</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Ordem</th>
              <th className="px-4 py-3 text-right text-[var(--text-tertiary)] font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {sections.map((s) => (
              <tr key={s.id} className="bg-[var(--bg-app)] hover:bg-[var(--bg-surface)]/50 transition-colors">
                <td className="px-4 py-3 text-[var(--text-secondary)]"><Icon name={s.icon} size={20} strokeWidth={1.5} /></td>
                <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{s.slug}</td>
                <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{s.title}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{s.categories.join(", ")}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{s.order}</td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === s.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-[var(--text-tertiary)] text-xs">Confirmar?</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-200 font-medium">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Não</button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(s)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-[var(--text-faint)] hover:text-red-400 transition-colors text-xs">Excluir</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <SectionFormModal form={form} editId={editId} saving={saving} onChange={setForm} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  );
}
