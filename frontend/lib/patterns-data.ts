export type PatternCategory =
  | "Criacional"
  | "Estrutural"
  | "Comportamental"
  | "Algoritmo"
  | "Clean Code";

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
];

export const categoryColors: Record<PatternCategory, string> = {
  Criacional: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Estrutural: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Comportamental: "bg-green-500/20 text-green-300 border-green-500/30",
  Algoritmo: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Clean Code": "bg-pink-500/20 text-pink-300 border-pink-500/30",
};
