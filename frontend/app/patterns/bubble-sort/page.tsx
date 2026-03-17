import { CodeSnippet } from "@/components/patterns/CodeSnippet";
import { SourceLinks } from "@/components/patterns/SourceLinks";
import { BubbleSortRunSection } from "@/components/algorithms/BubbleSortRunSection";
import Link from "next/link";
import { categoryColors } from "@/lib/patterns-data";

const csharpCode = `public static void BubbleSort(int[] arr)
{
    int n = arr.Length;

    for (int pass = 0; pass < n - 1; pass++)
    {
        bool swapped = false;

        for (int i = 0; i < n - 1 - pass; i++)
        {
            if (arr[i] > arr[i + 1])
            {
                // Troca os elementos adjacentes fora de ordem
                (arr[i], arr[i + 1]) = (arr[i + 1], arr[i]);
                swapped = true;
            }
        }

        // Otimização: se nenhuma troca ocorreu, o array já está ordenado
        if (!swapped) break;
    }
}

// Exemplo de uso
int[] array = { 64, 34, 25, 12, 22, 11, 90 };
BubbleSort(array);
// Resultado: [11, 12, 22, 25, 34, 64, 90]`;

const sources = [
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Bubble_sort",
    icon: "🌐",
  },
  {
    label: "Visualgo",
    url: "https://visualgo.net/en/sorting",
    icon: "📊",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function BubbleSortPage() {
  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Padrões</Link>
        <span>/</span>
        <span className="text-zinc-300">Bubble Sort</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🫧</span>
          <div>
            <h1 className="text-3xl font-bold text-white">Bubble Sort</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors["Algoritmo"]}`}>
              Algoritmo
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="flex flex-col gap-4 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed">
            O <strong className="text-zinc-200">Bubble Sort</strong> é um algoritmo de ordenação por comparação
            que percorre repetidamente a lista, compara elementos adjacentes e os troca se estiverem na ordem errada.
            O maior elemento &quot;borbulha&quot; para o final a cada passagem.
          </p>

          <h2 className="font-semibold text-white text-lg">Complexidade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              { label: "Melhor caso", value: "O(n)", note: "array já ordenado", color: "text-emerald-400" },
              { label: "Caso médio", value: "O(n²)", note: "geral", color: "text-orange-400" },
              { label: "Pior caso", value: "O(n²)", note: "ordem inversa", color: "text-red-400" },
              { label: "Espaço", value: "O(1)", note: "in-place", color: "text-blue-400" },
            ].map(({ label, value, note, color }) => (
              <div key={label} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 text-center">
                <p className="text-zinc-500 text-xs mb-1">{label}</p>
                <p className={`font-mono font-bold text-lg ${color}`}>{value}</p>
                <p className="text-zinc-600 text-xs">{note}</p>
              </div>
            ))}
          </div>

          <h2 className="font-semibold text-white text-lg">Como funciona?</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 leading-relaxed">
            <li>Percorre o array comparando cada par de elementos adjacentes.</li>
            <li>Se o elemento da esquerda for maior, os dois são trocados.</li>
            <li>Ao final de cada <em>pass</em>, o maior elemento não ordenado chega à sua posição final.</li>
            <li>Repete o processo ignorando os elementos já posicionados no final.</li>
            <li><strong className="text-zinc-300">Otimização:</strong> se nenhum troca ocorrer em um pass, o array já está ordenado (<em>early exit</em>).</li>
          </ol>
        </div>

        <SourceLinks sources={sources} />
      </div>

      {/* Code */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Código de Exemplo</h2>
        <p className="text-zinc-500 text-sm">Implementação em C# (.NET 10) com otimização de early exit.</p>
        <CodeSnippet code={csharpCode} lang="csharp" />
      </div>

      {/* Interactive */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Visualização Interativa</h2>
        <p className="text-zinc-500 text-sm">
          Escolha o tamanho do array, clique em executar e acompanhe a ordenação em tempo real —
          o array é gerado aleatoriamente a cada execução.
        </p>
        <BubbleSortRunSection apiUrl={`${API_URL}/api/algorithms/bubblesort/run`} />
      </div>
    </div>
  );
}
