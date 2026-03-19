import { LogRunSection } from "@/components/patterns/LogRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `// Definições
record  PointRecord(int X, int Y);                       // heap, imutável, igualdade por valor
class   PointClass  { public int X; public int Y; }      // heap, mutável, igualdade por referência
struct  PointStruct { public int X; public int Y; }      // stack, mutável, igualdade por valor

// ── Igualdade ──
var r1 = new PointRecord(1, 2); var r2 = new PointRecord(1, 2);
Console.WriteLine(r1 == r2);           // True  (valor)

var c1 = new PointClass { X=1, Y=2 }; var c2 = new PointClass { X=1, Y=2 };
Console.WriteLine(c1 == c2);           // False (referência — objetos distintos!)

var s1 = new PointStruct { X=1, Y=2 }; var s2 = new PointStruct { X=1, Y=2 };
Console.WriteLine(s1.Equals(s2));      // True  (valor)

// ── Cópia ──
var sOrig = new PointStruct { X=10 };
var sCopy = sOrig;   sCopy.X = 999;
Console.WriteLine(sOrig.X);  // 10 — cópia independente

var rOrig = new PointRecord(10, 20);
var rCopy = rOrig with { X = 999 };   // with-expression
Console.WriteLine(rOrig.X);  // 10 — imutável, with cria novo objeto

var cOrig = new PointClass { X=10 };
var cAlias = cOrig;  cAlias.X = 999;
Console.WriteLine(cOrig.X);  // 999 — mesma referência!`;

const sources = [
  { label: "docs.microsoft.com — Records", url: "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record", icon: "📖" },
  { label: "docs.microsoft.com — Structure types", url: "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function RecordClassStructPage() {
  return (
    <AlgorithmLayout
      title="Record vs Class vs Struct"
      icon="Boxes"
      category="Memória"
      description="Record, Class e Struct diferem em onde vivem na memória, semântica de igualdade e comportamento de cópia. Escolher o tipo certo impacta diretamente em alocações, pressão no GC e correção do código."
      sources={sources}
      code={csharpCode}
      codeDescription="Comparação de igualdade, semântica de cópia e alocação em massa com GC.GetTotalMemory()."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Comparativo</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 pr-4 text-zinc-300 font-medium">Característica</th>
                  <th className="text-left py-2 pr-4 text-teal-400 font-medium">Struct</th>
                  <th className="text-left py-2 pr-4 text-blue-400 font-medium">Class</th>
                  <th className="text-left py-2 text-violet-400 font-medium">Record</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  ["Onde vive", "Stack (ou inline)", "Heap", "Heap"],
                  ["Igualdade", "Por valor", "Por referência", "Por valor (gerada)"],
                  ["Cópia", "Por valor (independente)", "Por referência (alias)", "with-expression (novo obj)"],
                  ["Mutabilidade", "Mutável", "Mutável", "Imutável por padrão"],
                  ["Herança", "Não suporta", "Suporta", "Suporta (limitado)"],
                ].map(([feat, struct, cls, rec]) => (
                  <tr key={feat} className="border-b border-zinc-800">
                    <td className="py-2 pr-4 text-zinc-300">{feat}</td>
                    <td className="py-2 pr-4 text-teal-300">{struct}</td>
                    <td className="py-2 pr-4 text-blue-300">{cls}</td>
                    <td className="py-2 text-violet-300">{rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Quando usar cada um?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-teal-300">Struct:</strong> dados pequenos, curta duração, sem herança — ex: Point, Color, DateTime.</li>
            <li><strong className="text-blue-300">Class:</strong> objetos complexos, com identidade própria, mutáveis — ex: serviços, entidades.</li>
            <li><strong className="text-violet-300">Record:</strong> dados imutáveis passados entre camadas — ex: DTOs, eventos, value objects.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Demonstra igualdade, semântica de cópia e alocação de 10.000 instâncias de cada tipo,
            medida com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">GC.GetTotalMemory()</code>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/memory/record-class-struct/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
