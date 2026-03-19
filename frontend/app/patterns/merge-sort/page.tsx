import { MergeSortRunSection } from "@/components/algorithms/MergeSortRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `public static void MergeSort(int[] array, int left, int right)
{
    if (left < right)
    {
        int mid = left + (right - left) / 2;

        // Divide recursivamente
        MergeSort(array, left, mid);
        MergeSort(array, mid + 1, right);

        // Mescla as metades ordenadas
        Merge(array, left, mid, right);
    }
}

private static void Merge(int[] array, int left, int mid, int right)
{
    int n1 = mid - left + 1;
    int n2 = right - mid;

    int[] L = new int[n1];
    int[] R = new int[n2];

    Array.Copy(array, left, L, 0, n1);
    Array.Copy(array, mid + 1, R, 0, n2);

    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2)
    {
        if (L[i] <= R[j])
        {
            array[k] = L[i];
            i++;
        }
        else
        {
            array[k] = R[j];
            j++;
        }
        k++;
    }

    while (i < n1) array[k++] = L[i++];
    while (j < n2) array[k++] = R[j++];
}`;

const sources = [
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Merge_sort",
    icon: "🌐",
  },
  {
    label: "Visualgo",
    url: "https://visualgo.net/en/sorting",
    icon: "📊",
  },
];

const complexities = [
  { label: "Melhor caso", value: "O(n log n)", note: "estável", color: "text-emerald-400" },
  { label: "Caso médio", value: "O(n log n)", note: "consistente", color: "text-orange-400" },
  { label: "Pior caso", value: "O(n log n)", note: "garantido", color: "text-red-400" },
  { label: "Espaço", value: "O(n)", note: "não in-place", color: "text-blue-400" },
];

const steps = [
  "Divide a lista não ordenada em duas metades (divide).",
  "Continua dividindo recursivamente até que cada sublista tenha apenas um elemento.",
  "Combina (conquista) as sublistas de volta, comparando os elementos para manter a ordem.",
  "O processo de mesclagem (merge) garante que o resultado final seja uma lista totalmente ordenada.",
  "Diferente do Bubble Sort, sua performance é consistente mesmo no pior caso.",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function MergeSortPage() {
  return (
    <AlgorithmLayout
      title="Merge Sort"
      icon="GitMerge"
      category="Algoritmo"
      description="O Merge Sort é um algoritmo de ordenação eficiente, baseado no princípio de 'Dividir e Conquistar'. Ele quebra o problema em subproblemas menores, resolve cada um e depois combina os resultados."
      complexities={complexities}
      steps={steps}
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação clássica em C# (.NET 10) usando recursão."
    >
      <div className="flex flex-col gap-3">
        <p className="text-zinc-500 text-sm">
          Acompanhe a divisão recursiva e a mesclagem em tempo real. Note como o algoritmo 'desmonta' o array antes de reconstruí-lo ordenado.
        </p>
        <MergeSortRunSection apiUrl={`${API_URL}/api/algorithms/mergesort/run`} />
      </div>
    </AlgorithmLayout>
  );
}
