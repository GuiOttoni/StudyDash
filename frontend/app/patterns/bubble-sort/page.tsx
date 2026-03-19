import { BubbleSortRunSection } from "@/components/algorithms/BubbleSortRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

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

const complexities = [
  { label: "Melhor caso", value: "O(n)", note: "array já ordenado", color: "text-emerald-400" },
  { label: "Caso médio", value: "O(n²)", note: "geral", color: "text-orange-400" },
  { label: "Pior caso", value: "O(n²)", note: "ordem inversa", color: "text-red-400" },
  { label: "Espaço", value: "O(1)", note: "in-place", color: "text-blue-400" },
];

const steps = [
  "Percorre o array comparando cada par de elementos adjacentes.",
  "Se o elemento da esquerda for maior, os dois são trocados.",
  "Ao final de cada pass, o maior elemento não ordenado chega à sua posição final.",
  "Repete o processo ignorando os elementos já posicionados no final.",
  "Otimização: se nenhum troca ocorrer em um pass, o array já está ordenado (early exit).",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function BubbleSortPage() {
  return (
    <AlgorithmLayout
      title="Bubble Sort"
      icon="ArrowUpDown"
      category="Algoritmo"
      description="O Bubble Sort é um algoritmo de ordenação por comparação que percorre repetidamente a lista, compara elementos adjacentes e os troca se estiverem na ordem errada. O maior elemento 'borbulha' para o final a cada passagem."
      complexities={complexities}
      steps={steps}
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação em C# (.NET 10) com otimização de early exit."
    >
      <div className="flex flex-col gap-3">
        <p className="text-zinc-500 text-sm">
          Escolha o tamanho do array, clique em executar e acompanhe a ordenação em tempo real —
          o array é gerado aleatoriamente a cada execução.
        </p>
        <BubbleSortRunSection apiUrl={`${API_URL}/api/algorithms/bubblesort/run`} />
      </div>
    </AlgorithmLayout>
  );
}
