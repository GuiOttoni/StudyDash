"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

type FilterKey = "all" | "pending" | "done";

interface RoadmapTask {
  id: number;
  title: string;
  description: string;
  section: string;
  completed: boolean;
  createdAt: string;
}

interface SectionMeta {
  key: string;
  title: string;
  icon: string;
}

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapTask[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    try {
      const [tasksRes, sectionsRes] = await Promise.all([
        fetch(`${API_URL}/api/roadmap/tasks`),
        fetch(`${API_URL}/api/sections`),
      ]);
      const tasks: RoadmapTask[] = await tasksRes.json();
      const navSections: { slug: string; title: string; icon: string }[] = await sectionsRes.json();
      setItems(tasks);
      setSections(navSections.map((s) => ({ key: s.slug, title: s.title, icon: s.icon })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editingId !== null && titleInputRef.current) titleInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (addingSection && addInputRef.current) addInputRef.current.focus();
  }, [addingSection]);

  const toggle = async (item: RoadmapTask) => {
    const updated = { ...item, completed: !item.completed };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await fetch(`${API_URL}/api/roadmap/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${API_URL}/api/roadmap/tasks/${id}`, { method: "DELETE" });
  };

  const startEdit = (item: RoadmapTask) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const saveEdit = async (item: RoadmapTask) => {
    if (!editTitle.trim()) return;
    const updated = { ...item, title: editTitle.trim(), description: editDesc.trim() };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    setEditingId(null);
    await fetch(`${API_URL}/api/roadmap/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const cancelEdit = () => setEditingId(null);

  const startAdd = (section: string) => {
    setAddingSection(section);
    setNewTitle("");
    setNewDesc("");
  };

  const saveAdd = async () => {
    if (!newTitle.trim() || !addingSection) return;
    const payload = { title: newTitle.trim(), description: newDesc.trim(), section: addingSection, completed: false };
    setAddingSection(null);
    const res = await fetch(`${API_URL}/api/roadmap/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created: RoadmapTask = await res.json();
    setItems((prev) => [...prev, created]);
  };

  const cancelAdd = () => setAddingSection(null);

  const resetToSeed = async () => {
    if (!confirm("Resetar para os itens originais? Todos os seus itens personalizados serão perdidos.")) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/api/roadmap/tasks/reset`, { method: "POST" });
    const data: RoadmapTask[] = await res.json();
    setItems(data);
    setLoading(false);
  };

  const totalDone = items.filter((i) => i.completed).length;
  const totalAll = items.length;
  const progressPct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const filtered = (section: string) =>
    items.filter((i) => {
      if (i.section !== section) return false;
      if (filter === "pending") return !i.completed;
      if (filter === "done") return i.completed;
      return true;
    });

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-white">🗺️ Roadmap</h1>
          <div className="text-zinc-500 text-sm animate-pulse">Carregando tarefas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">🗺️ Roadmap</h1>
            <p className="text-zinc-400 text-lg mt-1">
              Próximas implementações do repositório — adicione, edite e acompanhe o progresso.
            </p>
          </div>
          <button
            onClick={resetToSeed}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 shrink-0 mt-1"
          >
            Resetar
          </button>
        </div>

        {/* Global progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Progresso total</span>
            <span className="font-mono font-bold text-white">
              {totalDone}/{totalAll}{" "}
              <span className="text-zinc-500 font-normal">({progressPct}%)</span>
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "pending", "done"] as FilterKey[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Concluídos"}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ key, title, icon }) => {
        const sectionItems = filtered(key);
        const totalSection = items.filter((i) => i.section === key).length;
        const doneSection = items.filter((i) => i.section === key && i.completed).length;

        return (
          <div key={key} className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={icon} size={22} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <span className="text-xs text-zinc-500 font-mono bg-zinc-800 px-2 py-0.5 rounded-full">
                  {doneSection}/{totalSection}
                </span>
              </div>
              <button
                onClick={() => startAdd(key)}
                className="text-sm text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <span>+</span> Adicionar
              </button>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              {sectionItems.length === 0 && filter !== "all" && (
                <p className="text-zinc-600 text-sm italic px-1">
                  Nenhum item {filter === "pending" ? "pendente" : "concluído"}.
                </p>
              )}

              {sectionItems.map((item) => (
                <div
                  key={item.id}
                  className={`group bg-zinc-900 border rounded-xl px-4 py-3 flex gap-3 transition-colors ${
                    item.completed ? "border-zinc-800/50 opacity-60" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(item)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.completed
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-zinc-600 hover:border-indigo-400"
                    }`}
                    aria-label="Marcar como concluído"
                  >
                    {item.completed && <span className="text-xs leading-none">✓</span>}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={titleInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                          placeholder="Título"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                          rows={2}
                          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-indigo-500 resize-none"
                          placeholder="Descrição (opcional)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`font-medium text-sm ${item.completed ? "line-through text-zinc-500" : "text-white"}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== item.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-xs"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors text-xs"
                        aria-label="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add form */}
              {addingSection === key && (
                <div className="bg-zinc-900 border border-indigo-500/40 rounded-xl px-4 py-3 flex flex-col gap-2">
                  <input
                    ref={addInputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveAdd();
                      if (e.key === "Escape") cancelAdd();
                    }}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="Título do novo item *"
                  />
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") cancelAdd(); }}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-indigo-500 resize-none"
                    placeholder="Descrição (opcional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveAdd}
                      disabled={!newTitle.trim()}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={cancelAdd}
                      className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
