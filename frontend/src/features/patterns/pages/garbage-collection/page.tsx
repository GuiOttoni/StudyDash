import { LogRunSection } from "@/features/patterns/components/LogRunSection";
import { AlgorithmLayout } from "@/features/patterns/components/AlgorithmLayout";

const csharpCode = `// Estado do GC
Console.WriteLine(GC.MaxGeneration);             // 2 (Gen0, Gen1, Gen2)
Console.WriteLine(GC.GetTotalMemory(false));     // bytes gerenciados
Console.WriteLine(GC.CollectionCount(0));        // coletas Gen0

// Alocar e liberar objetos curta duração
for (int i = 0; i < 200_000; i++)
{
    var _ = new object();  // Gen0 coleta automaticamente
}

// Forçar coleta completa
GC.Collect();
GC.WaitForPendingFinalizers();
Console.WriteLine(GC.GetTotalMemory(true));      // após coleta

// WeakReference — não impede coleta
object? obj = new object();
var weakRef = new WeakReference(obj);

Console.WriteLine(weakRef.IsAlive);  // True

obj = null;     // remove referência forte
GC.Collect();

Console.WriteLine(weakRef.IsAlive);  // False — objeto foi coletado`;

const sources = [
  { label: "docs.microsoft.com — Fundamentals of GC", url: "https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals", icon: "📖" },
  { label: "docs.microsoft.com — WeakReference", url: "https://learn.microsoft.com/en-us/dotnet/api/system.weakreference", icon: "📖" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function GarbageCollectionPage() {
  return (
    <AlgorithmLayout
      title="Garbage Collection"
      icon="RefreshCw"
      category="Memória"
      description="O Garbage Collector do .NET libera automaticamente memória de objetos não referenciados usando um sistema de gerações (Gen0, Gen1, Gen2). Gen0 coleta objetos curta duração frequentemente; Gen2 raramente coleta objetos de longa duração."
      sources={sources}
      code={csharpCode}
      codeDescription="Demonstração de gerações do GC, GC.Collect(), contadores de coleta e WeakReference."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-[var(--text-primary)] text-lg">Gerações</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-tertiary)] leading-relaxed">
            <li><strong className="text-[var(--text-secondary)]">Gen0:</strong> objetos recém-alocados — coletados com mais frequência (milissegundos).</li>
            <li><strong className="text-[var(--text-secondary)]">Gen1:</strong> objetos que sobreviveram a uma coleta Gen0 — buffer entre Gen0 e Gen2.</li>
            <li><strong className="text-[var(--text-secondary)]">Gen2:</strong> objetos de longa duração (statics, caches) — coletados raramente.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-[var(--text-primary)] text-lg">Boas práticas</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-tertiary)] leading-relaxed">
            <li>Evite <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">GC.Collect()</code> manual — o GC já é otimizado.</li>
            <li>Use <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">IDisposable</code> e <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">using</code> para liberar recursos não-gerenciados.</li>
            <li>Prefira structs para dados pequenos e curta duração — menos pressão no GC.</li>
            <li><strong className="text-yellow-400">WeakReference</strong> é útil para caches: o objeto pode ser coletado se a memória está baixa.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { role: "Gen0 (curta duração)", desc: "Coletado frequentemente, muito rápido." },
            { role: "Gen2 (longa duração)", desc: "Coletado raramente — evite promover objetos." },
            { role: "WeakReference", desc: "Referência que não impede a coleta pelo GC." },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-[var(--bg-surface-hover)] rounded-lg p-3 border border-[var(--border-strong)]">
              <span className="font-medium text-[var(--text-primary)] text-xs">{role}</span>
              <p className="text-[var(--text-muted)] mt-1 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Executar no Backend</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Demonstra alocações em massa, contadores de coleta por geração,{" "}
            <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">GC.Collect()</code> forçado e comportamento de{" "}
            <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">WeakReference</code>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/memory/garbage-collection/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
