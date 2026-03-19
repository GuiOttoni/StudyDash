// Mapeamento de categoria → classes Tailwind.
// Strings completas são necessárias para o purging do Tailwind funcionar corretamente.
// Para adicionar uma nova categoria: apenas acrescente uma entrada — nenhuma union type para atualizar.
const colors: Record<string, string> = {
  Criacional:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Estrutural:     "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Comportamental: "bg-green-500/20 text-green-300 border-green-500/30",
  Algoritmo:      "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Clean Code":   "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Memória:        "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Concorrência:   "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Performance:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Arquitetura:    "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Mensageria:     "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

export function getCategoryColor(category: string): string {
  return colors[category] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
}
