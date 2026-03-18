"use client";

import { useEffect, useRef, useState } from "react";

type SectionKey = "padroes" | "algoritmos" | "principios" | "memoria" | "concorrencia";
type FilterKey = "all" | "pending" | "done";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  section: SectionKey;
  completed: boolean;
}

const SECTIONS: { key: SectionKey; title: string; icon: string }[] = [
  { key: "padroes",      title: "Padrões",      icon: "🏛️" },
  { key: "algoritmos",   title: "Algoritmos",   icon: "📊" },
  { key: "principios",   title: "Princípios",   icon: "📐" },
  { key: "memoria",      title: "Memória",      icon: "🧠" },
  { key: "concorrencia", title: "Concorrência", icon: "⚡" },
];

const SEED_ITEMS: ChecklistItem[] = [
  // Padrões
  { id: "1",  section: "padroes",      completed: false, title: "Factory Method",          description: "INotification com Email/SMS/Push — factory centraliza criação" },
  { id: "2",  section: "padroes",      completed: false, title: "Abstract Factory",        description: "Famílias WindowsFactory/MacFactory com Button e Checkbox" },
  { id: "3",  section: "padroes",      completed: false, title: "Prototype",               description: "Document.Clone() — demonstra deep vs shallow copy" },
  { id: "4",  section: "padroes",      completed: false, title: "Object Pool",             description: "Pool de conexões reutilizáveis — evita custo de criação repetida" },
  { id: "5",  section: "padroes",      completed: false, title: "Decorator",               description: "Coffee com Milk/Sugar/WhippedCream — composição dinâmica" },
  { id: "6",  section: "padroes",      completed: false, title: "Adapter",                 description: "LegacyPaymentService adaptado para IPaymentGateway moderna" },
  { id: "7",  section: "padroes",      completed: false, title: "Facade",                  description: "HomeTheater com WatchMovie()/EndMovie() — interface simplificada" },
  { id: "8",  section: "padroes",      completed: false, title: "Composite",               description: "Estrutura de árvore onde folhas e galhos têm a mesma interface" },
  { id: "9",  section: "padroes",      completed: false, title: "Proxy",                   description: "Controle de acesso — lazy loading, cache, logging transparente" },
  { id: "10", section: "padroes",      completed: false, title: "Flyweight",               description: "Compartilhamento de estado intrínseco — redução de alocações em massa" },
  { id: "11", section: "padroes",      completed: false, title: "Observer",                description: "EventBus com EmailAlert, SmsAlert, DashboardLogger" },
  { id: "12", section: "padroes",      completed: false, title: "Strategy",                description: "ShippingCalculator com Standard/Express/Free — troca em runtime" },
  { id: "13", section: "padroes",      completed: false, title: "Command",                 description: "Editor com TypeCommand/DeleteCommand + histórico Undo/Redo" },
  { id: "14", section: "padroes",      completed: false, title: "Chain of Responsibility", description: "AuthHandler → AuthorizationHandler → RateLimitHandler" },
  { id: "15", section: "padroes",      completed: false, title: "Iterator",                description: "TreeNode com InOrder, PreOrder, PostOrder iterators" },
  { id: "16", section: "padroes",      completed: false, title: "State",                   description: "Máquina de estados — substitui switch/if com classes de estado" },
  { id: "17", section: "padroes",      completed: false, title: "Mediator",                description: "Componentes comunicam via mediador — desacoplamento total" },
  { id: "18", section: "padroes",      completed: false, title: "Template Method",         description: "Esqueleto fixo do algoritmo, passos customizáveis nas subclasses" },
  // Algoritmos
  { id: "19", section: "algoritmos",   completed: false, title: "Selection Sort",          description: "O(n²) sempre — mínimo de trocas, visualização de barras" },
  { id: "20", section: "algoritmos",   completed: false, title: "Insertion Sort",          description: "O(n) melhor caso — eficiente para arrays quase ordenados" },
  { id: "21", section: "algoritmos",   completed: false, title: "Quick Sort",              description: "O(n log n) médio — pivot destacado, partições coloridas" },
  { id: "22", section: "algoritmos",   completed: false, title: "Heap Sort",               description: "O(n log n) garantido — baseado em estrutura max-heap" },
  { id: "23", section: "algoritmos",   completed: false, title: "Binary Search",           description: "O(log n) — divide o espaço de busca pela metade a cada passo" },
  { id: "24", section: "algoritmos",   completed: false, title: "Linear Search",           description: "O(n) — varredura sequencial, contraste com Binary Search" },
  { id: "25", section: "algoritmos",   completed: false, title: "Stack",                   description: "Push/Pop/Peek — simula call stack de função recursiva (ex: fatorial)" },
  { id: "26", section: "algoritmos",   completed: false, title: "Queue",                   description: "FIFO — simula fila de impressão de documentos" },
  { id: "27", section: "algoritmos",   completed: false, title: "Linked List",             description: "SinglyLinkedList com Add, Remove, Find e travessia de ponteiros" },
  { id: "28", section: "algoritmos",   completed: false, title: "Binary Search Tree",      description: "Insert, Search, InOrder/PreOrder — visualização de nós" },
  { id: "29", section: "algoritmos",   completed: false, title: "Graph (DFS/BFS)",         description: "Grafos de cidades — busca em profundidade e em largura" },
  { id: "30", section: "algoritmos",   completed: false, title: "Hash Table",              description: "Colisões, load factor, open addressing vs chaining" },
  // Princípios
  { id: "31", section: "principios",   completed: false, title: "DRY",                     description: "Antes: lógica duplicada em 3 lugares. Depois: extração para método reutilizável" },
  { id: "32", section: "principios",   completed: false, title: "KISS",                    description: "Antes: over-engineered. Depois: solução direta e legível" },
  { id: "33", section: "principios",   completed: false, title: "YAGNI",                   description: "Features prematuras geram débito técnico desnecessário" },
  { id: "34", section: "principios",   completed: false, title: "Code Smells",             description: "Long Method, God Class, Feature Envy, Primitive Obsession — antes/depois" },
  { id: "35", section: "principios",   completed: false, title: "Tell Don't Ask",          description: "Objetos devem agir, não expor estado para decisões externas" },
  { id: "36", section: "principios",   completed: false, title: "Lei de Demeter",          description: "\"Fale apenas com seus amigos diretos\" — reduz acoplamento" },
  { id: "37", section: "principios",   completed: false, title: "Nomes Significativos",    description: "Variáveis, métodos e classes que se auto-documentam" },
  { id: "38", section: "principios",   completed: false, title: "Refactoring Patterns",    description: "Extract Method, Rename, Move, Replace Conditional with Polymorphism" },
  // Memória
  { id: "39", section: "memoria",      completed: false, title: "Span<T> e Memory<T>",     description: "Acesso a fatias de memória sem alocação — alternativa a substrings e arrays" },
  { id: "40", section: "memoria",      completed: false, title: "ArrayPool<T>",            description: "Pool de arrays reutilizáveis — reduz pressão de GC em hot paths" },
  { id: "41", section: "memoria",      completed: false, title: "IDisposable e using",     description: "Padrão de liberação de recursos não gerenciados — Dispose() correto" },
  { id: "42", section: "memoria",      completed: false, title: "Large Object Heap (LOH)", description: "Objetos >85 KB vão para LOH — fragmentação e impacto em GC Gen2" },
  { id: "43", section: "memoria",      completed: false, title: "Pinned Objects / GCHandle", description: "Objetos fixados na memória para interop com código não gerenciado" },
  // Concorrência
  { id: "44", section: "concorrencia", completed: false, title: "Producer-Consumer com Channel<T>", description: "System.Threading.Channels — back-pressure e async pipelines de alta performance" },
  { id: "45", section: "concorrencia", completed: false, title: "SemaphoreSlim",           description: "10 tasks competindo por 3 slots — controle de acesso a recurso limitado" },
  { id: "46", section: "concorrencia", completed: false, title: "async/await — Deadlocks", description: "ConfigureAwait(false), .Result/.Wait() — armadilhas comuns e como evitá-las" },
  { id: "47", section: "concorrencia", completed: false, title: "CancellationToken",       description: "Propagação correta de cancelamento em cadeia de operações async" },
  { id: "48", section: "concorrencia", completed: false, title: "IAsyncEnumerable",        description: "Streams assíncronos com await foreach — lazy evaluation" },
  { id: "49", section: "concorrencia", completed: false, title: "ReaderWriterLockSlim",    description: "Leituras concorrentes + escrita exclusiva — melhora throughput" },
  { id: "50", section: "concorrencia", completed: false, title: "Interlocked",             description: "Operações atômicas sem lock — Increment, CompareExchange" },
  { id: "51", section: "concorrencia", completed: false, title: "TPL Dataflow",            description: "Pipeline de transformação de dados — ActionBlock, TransformBlock" },
];

function loadFromStorage(): ChecklistItem[] {
  if (typeof window === "undefined") return SEED_ITEMS;
  try {
    const raw = localStorage.getItem("studydash-roadmap");
    if (!raw) return SEED_ITEMS;
    return JSON.parse(raw) as ChecklistItem[];
  } catch {
    return SEED_ITEMS;
  }
}

export default function RoadmapPage() {
  const [items, setItems] = useState<ChecklistItem[]>(loadFromStorage);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("studydash-roadmap", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (editingId && titleInputRef.current) titleInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (addingSection && addInputRef.current) addInputRef.current.focus();
  }, [addingSection]);

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, title: editTitle.trim(), description: editDesc.trim() } : i))
    );
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const startAdd = (section: SectionKey) => {
    setAddingSection(section);
    setNewTitle("");
    setNewDesc("");
  };

  const saveAdd = () => {
    if (!newTitle.trim() || !addingSection) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      section: addingSection,
      completed: false,
    };
    setItems((prev) => [...prev, item]);
    setAddingSection(null);
  };

  const cancelAdd = () => setAddingSection(null);

  const resetToSeed = () => {
    if (confirm("Resetar para os itens originais? Todos os seus itens personalizados serão perdidos.")) {
      setItems(SEED_ITEMS);
    }
  };

  const totalDone = items.filter((i) => i.completed).length;
  const totalAll = items.length;
  const progressPct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const filtered = (section: SectionKey) =>
    items.filter((i) => {
      if (i.section !== section) return false;
      if (filter === "pending") return !i.completed;
      if (filter === "done") return i.completed;
      return true;
    });

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
            <span className="font-mono font-bold text-white">{totalDone}/{totalAll} <span className="text-zinc-500 font-normal">({progressPct}%)</span></span>
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
      {SECTIONS.map(({ key, title, icon }) => {
        const sectionItems = filtered(key);
        const totalSection = items.filter((i) => i.section === key).length;
        const doneSection = items.filter((i) => i.section === key && i.completed).length;

        return (
          <div key={key} className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
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
                <p className="text-zinc-600 text-sm italic px-1">Nenhum item {filter === "pending" ? "pendente" : "concluído"}.</p>
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
                    onClick={() => toggle(item.id)}
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
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") cancelEdit(); }}
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
                          <button onClick={() => saveEdit(item.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors">Salvar</button>
                          <button onClick={cancelEdit} className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg transition-colors">Cancelar</button>
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
                    onKeyDown={(e) => { if (e.key === "Enter") saveAdd(); if (e.key === "Escape") cancelAdd(); }}
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
                    <button onClick={saveAdd} disabled={!newTitle.trim()} className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg transition-colors">Adicionar</button>
                    <button onClick={cancelAdd} className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg transition-colors">Cancelar</button>
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
