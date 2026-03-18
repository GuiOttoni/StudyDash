import { LogRunSection } from "@/components/patterns/LogRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `// Baseline sequencial: 4 × 200ms ≈ 800ms
for (int i = 0; i < 4; i++) Thread.Sleep(200);

// ── Parallel.For — CPU-bound ──
long sum = 0;
var lockObj = new object();

Parallel.For(0, 4, i =>
{
    Thread.Sleep(200);
    lock (lockObj) sum += i;   // thread-safe
});
// ≈ 200ms (execução paralela)

// ── Parallel.ForEach — sobre coleção ──
var items = new[] { "Alpha", "Beta", "Gamma", "Delta" };
var results = new ConcurrentBag<string>();

Parallel.ForEach(items, item =>
{
    Thread.Sleep(200);
    results.Add($"{item} → Thread#{Thread.CurrentThread.ManagedThreadId}");
});
// ≈ 200ms

// ── Task.WhenAll — I/O-bound (assíncrono) ──
var taskResults = await Task.WhenAll(
    Enumerable.Range(1, 4).Select(async i =>
    {
        await Task.Delay(200);   // não bloqueia threads
        return $"Task{i} → Thread#{Thread.CurrentThread.ManagedThreadId}";
    })
);
// ≈ 200ms`;

const sources = [
  { label: "docs.microsoft.com — Parallel Class", url: "https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel", icon: "📖" },
  { label: "docs.microsoft.com — Task.WhenAll", url: "https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.whenall", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function ParallelTasksPage() {
  return (
    <AlgorithmLayout
      title="Parallel Tasks"
      icon="⚡"
      category="Concorrência"
      description="O .NET oferece três formas principais de paralelismo: Parallel.For e Parallel.ForEach para trabalho CPU-bound, e Task.WhenAll para I/O-bound assíncrono. Todas distribuem trabalho entre núcleos automaticamente, com speedup proporcional ao número de cores."
      sources={sources}
      code={csharpCode}
      codeDescription="Comparação de Parallel.For, Parallel.ForEach e Task.WhenAll com medição de speedup."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Quando usar cada abordagem?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-zinc-300">Parallel.For / ForEach:</strong> cálculos intensivos de CPU — processa dados em paralelo no ThreadPool.</li>
            <li><strong className="text-zinc-300">Task.WhenAll:</strong> múltiplas operações I/O (HTTP, banco, arquivos) — não bloqueia threads enquanto espera.</li>
            <li><strong className="text-yellow-400">Atenção:</strong> use <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">ConcurrentBag&lt;T&gt;</code> ou <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">lock</code> para evitar condições de corrida.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Cuidados</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-yellow-400">Race condition:</strong> múltiplas threads acessando a mesma variável sem sincronização.</li>
            <li><strong className="text-yellow-400">Deadlock:</strong> locks aninhados mal ordenados — prefira estruturas thread-safe (<code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">ConcurrentBag</code>, <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Interlocked</code>).</li>
            <li><strong className="text-yellow-400">Over-parallelism:</strong> paralelizar tarefas muito pequenas cria overhead maior que o ganho.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { role: "Parallel.For", desc: "Iterações de índice em paralelo — CPU-bound." },
            { role: "Parallel.ForEach", desc: "Itens de coleção em paralelo — CPU-bound." },
            { role: "Task.WhenAll", desc: "Múltiplas tasks assíncronas — I/O-bound." },
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
            Executa um baseline sequencial (~800ms) e depois as três formas paralelas (~200ms cada),
            exibindo os IDs de thread usados e o speedup calculado.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/concurrency/parallel-tasks/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
