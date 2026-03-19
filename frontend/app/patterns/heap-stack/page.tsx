import { LogRunSection } from "@/components/patterns/LogRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `using System.Runtime.CompilerServices;

// Tipo de valor (struct) → alocado na stack
struct PointStruct { public int X; public int Y; }

// Tipo de referência (class) → alocado no heap
class PointClass  { public int X; public int Y; }

// Tamanho real em bytes
Console.WriteLine(Unsafe.SizeOf<int>());          // 4
Console.WriteLine(Unsafe.SizeOf<double>());       // 8
Console.WriteLine(Unsafe.SizeOf<PointStruct>());  // 8 (stack)

// Struct: cópia independente (semântica de valor)
var s1 = new PointStruct { X = 1, Y = 2 };
var s2 = s1;   // cópia
s2.X = 999;
Console.WriteLine(s1.X); // 1 — não foi alterado

// Class: alias (mesma referência no heap)
var c1 = new PointClass { X = 1, Y = 2 };
var c2 = c1;   // alias — mesma referência
c2.X = 999;
Console.WriteLine(c1.X); // 999 — alterado!

// Boxing: int (stack) → object (heap)
int   value   = 42;
object boxed  = value;        // boxing
int   unboxed = (int)boxed;   // unboxing`;

const sources = [
  { label: "docs.microsoft.com — Value types", url: "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types", icon: "📖" },
  { label: "docs.microsoft.com — Boxing and Unboxing", url: "https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function HeapStackPage() {
  return (
    <AlgorithmLayout
      title="Heap vs Stack"
      icon="Server"
      category="Memória"
      description="No .NET, tipos de valor (int, struct) vivem na stack — rápidos e automáticos. Tipos de referência (class, record) vivem no heap — gerenciados pelo GC. Entender essa diferença é fundamental para escrever código eficiente."
      sources={sources}
      code={csharpCode}
      codeDescription="Demonstração de Unsafe.SizeOf<T>(), semântica de valor vs referência e boxing/unboxing."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Stack</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Alocação e liberação automáticas ao entrar/sair do escopo do método.</li>
            <li>Acesso muito rápido — endereços contíguos, sem overhead de GC.</li>
            <li>Tamanho limitado (~1 MB por thread no .NET).</li>
            <li>Tipos: <strong className="text-zinc-300">int, double, bool, char, struct, enum</strong>.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Heap</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Alocação dinâmica via <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">new</code> — liberação gerenciada pelo GC.</li>
            <li>Cada objeto tem um <strong className="text-zinc-300">object header</strong> (~16 bytes de overhead).</li>
            <li>Tamanho limitado apenas pela memória disponível.</li>
            <li>Tipos: <strong className="text-zinc-300">class, record, string, array, delegate</strong>.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { role: "Stack", desc: "Tipos de valor — rápido, automático, tamanho fixo." },
            { role: "Heap", desc: "Tipos de referência — flexível, gerenciado pelo GC." },
            { role: "Boxing", desc: "Embrulha valor (stack) num object (heap) — tem custo." },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
              <span className="font-medium text-zinc-200 text-xs">{role}</span>
              <p className="text-zinc-500 mt-1 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Demonstra tamanhos de tipos com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Unsafe.SizeOf&lt;T&gt;()</code>,
            semântica de cópia e medição de alocação no heap com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">GC.GetTotalMemory()</code>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/memory/heap-stack/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
