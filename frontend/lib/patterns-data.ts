export type PatternCategory =
  | "Criacional"
  | "Estrutural"
  | "Comportamental"
  | "Algoritmo"
  | "Clean Code"
  | "Memória"
  | "Concorrência";

export interface SectionMeta {
  slug: string;
  title: string;
  icon: string;
  description: string;
  categories: PatternCategory[];
}

export const sections: SectionMeta[] = [
  {
    slug: "padroes",
    title: "Padrões",
    icon: "🏛️",
    description: "Padrões de design criacionais, estruturais e comportamentais — soluções reutilizáveis para problemas recorrentes de software.",
    categories: ["Criacional", "Estrutural", "Comportamental"],
  },
  {
    slug: "algoritmos",
    title: "Algoritmos",
    icon: "📊",
    description: "Algoritmos clássicos de ordenação e busca com visualização em tempo real.",
    categories: ["Algoritmo"],
  },
  {
    slug: "principios",
    title: "Princípios",
    icon: "📐",
    description: "Princípios de design de software e boas práticas de Clean Code para código manutenível.",
    categories: ["Clean Code"],
  },
  {
    slug: "memoria",
    title: "Memória",
    icon: "🧠",
    description: "Gerenciamento de memória no .NET — heap, stack, Garbage Collector e tipos de dados.",
    categories: ["Memória"],
  },
  {
    slug: "concorrencia",
    title: "Concorrência",
    icon: "⚡",
    description: "Programação concorrente e paralela — Threads, Tasks e paralelismo no .NET.",
    categories: ["Concorrência"],
  },
];

export interface PatternMeta {
  slug: string;
  title: string;
  category: PatternCategory;
  description: string;
  available: boolean;
  icon: string;
}

export const patterns: PatternMeta[] = [
  {
    slug: "builder",
    title: "Builder",
    category: "Criacional",
    description:
      "Separa a construção de um objeto complexo de sua representação, permitindo criar diferentes representações com o mesmo processo.",
    available: true,
    icon: "🏗️",
  },
  {
    slug: "singleton",
    title: "Singleton",
    category: "Criacional",
    description:
      "Garante que uma classe tenha apenas uma instância e fornece um ponto de acesso global a ela.",
    available: true,
    icon: "🔒",
  },
  {
    slug: "factory-method",
    title: "Factory Method",
    category: "Criacional",
    description:
      "Define uma interface para criar objetos, mas deixa as subclasses decidirem qual classe instanciar.",
    available: false,
    icon: "🏭",
  },
  {
    slug: "observer",
    title: "Observer",
    category: "Comportamental",
    description:
      "Define uma dependência um-para-muitos entre objetos, notificando automaticamente os dependentes quando um objeto muda de estado.",
    available: false,
    icon: "👁️",
  },
  {
    slug: "strategy",
    title: "Strategy",
    category: "Comportamental",
    description:
      "Define uma família de algoritmos, encapsula cada um deles e os torna intercambiáveis.",
    available: false,
    icon: "♟️",
  },
  {
    slug: "decorator",
    title: "Decorator",
    category: "Estrutural",
    description:
      "Anexa responsabilidades adicionais a um objeto dinamicamente, fornecendo uma alternativa flexível à herança.",
    available: false,
    icon: "🎨",
  },
  {
    slug: "bubble-sort",
    title: "Bubble Sort",
    category: "Algoritmo",
    description:
      "Algoritmo de ordenação que compara pares adjacentes e troca os que estão fora de ordem — visualização em tempo real com gráfico de barras.",
    available: true,
    icon: "🫧",
  },
  {
    slug: "merge-sort",
    title: "Merge Sort",
    category: "Algoritmo",
    description:
      "Algoritmo de ordenação por divisão e conquista que divide a lista em metades, ordena cada uma e as mescla recorrentemente.",
    available: true,
    icon: "🧩",
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    category: "Algoritmo",
    description:
      "Algoritmo eficiente de busca que divide o espaço de busca pela metade a cada iteração — O(log n).",
    available: false,
    icon: "🔍",
  },
  {
    slug: "solid",
    title: "Princípios SOLID",
    category: "Clean Code",
    description:
      "Os cinco princípios fundamentais do design orientado a objetos para código limpo e manutenível.",
    available: true,
    icon: "🧱",
  },
  {
    slug: "di-lifetimes",
    title: "DI Lifetimes",
    category: "Clean Code",
    description:
      "Entenda as diferenças cruciais entre os ciclos de vida Transient, Scoped e Singleton no .NET.",
    available: true,
    icon: "💉",
  },
  {
    slug: "heap-stack",
    title: "Heap vs Stack",
    category: "Memória",
    description:
      "Entenda onde o .NET aloca tipos de valor (stack) e tipos de referência (heap), o custo de boxing/unboxing e como medir tamanhos reais de tipos com Unsafe.SizeOf<T>().",
    available: true,
    icon: "🧠",
  },
  {
    slug: "garbage-collection",
    title: "Garbage Collection",
    category: "Memória",
    description:
      "Veja o GC em ação: gerações Gen0/Gen1/Gen2, GC.Collect() forçado, contadores de coleta e comportamento de WeakReference.",
    available: true,
    icon: "♻️",
  },
  {
    slug: "record-class-struct",
    title: "Record vs Class vs Struct",
    category: "Memória",
    description:
      "Compare semântica de igualdade, cópia e alocação de memória entre os três tipos principais do C# — com medição real via GC.GetTotalMemory().",
    available: true,
    icon: "📦",
  },
  {
    slug: "thread-task",
    title: "Thread vs Task",
    category: "Concorrência",
    description:
      "Compare Thread manual e Task.Run — veja ManagedThreadId, timing e por que Task é a escolha preferida em código .NET moderno.",
    available: true,
    icon: "⚙️",
  },
  {
    slug: "parallel-tasks",
    title: "Parallel Tasks",
    category: "Concorrência",
    description:
      "Parallel.For, Parallel.ForEach e Task.WhenAll em ação — com baseline sequencial, speedup calculado e IDs de thread do pool.",
    available: true,
    icon: "⚡",
  },
];

export const categoryColors: Record<PatternCategory, string> = {
  Criacional: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Estrutural: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Comportamental: "bg-green-500/20 text-green-300 border-green-500/30",
  Algoritmo: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Clean Code": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Memória: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Concorrência: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};
