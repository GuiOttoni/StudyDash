import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Task<T>: sempre aloca um objeto no heap ──────────────
static Task<int> GetWithTask(bool cacheHit)
    => cacheHit
        ? Task.FromResult(_cache)      // ainda aloca Task<int> no heap
        : FetchFromSourceAsync();      // async real

// ── ValueTask<T>: struct — zero alocação no caminho síncrono ─
static ValueTask<int> GetWithValueTask(bool cacheHit)
    => cacheHit
        ? new ValueTask<int>(_cache)   // struct na stack, sem heap
        : new ValueTask<int>(FetchFromSourceAsync()); // delega p/ Task

static async Task<int> FetchFromSourceAsync()
{
    await Task.Delay(1);   // simula I/O
    return 42;
}

// ── Medindo alocações no caminho síncrono ────────────────────
long before = GC.GetAllocatedBytesForCurrentThread();
for (int i = 0; i < 50_000; i++)
    await GetWithTask(cacheHit: true);
long taskBytes = GC.GetAllocatedBytesForCurrentThread() - before;

before = GC.GetAllocatedBytesForCurrentThread();
for (int i = 0; i < 50_000; i++)
    await GetWithValueTask(cacheHit: true);
long valueTaskBytes = GC.GetAllocatedBytesForCurrentThread() - before;

// Resultado típico: Task ~2 MB, ValueTask ~0 bytes

// ── Armadilhas ───────────────────────────────────────────────
var vt = GetWithValueTask(true);
await vt;   // OK
await vt;   // ✗ ERRO: ValueTask não pode ser aguardado duas vezes

// Precisa de múltiplos awaits? Converta explicitamente:
var t = GetWithValueTask(true).AsTask();
await t;
await t;   // OK — Task pode ser aguardada múltiplas vezes`;

const sources = [
  { label: "docs.microsoft.com — Understanding ValueTask", url: "https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.valuetask-1", icon: "📖" },
  { label: "devblogs.microsoft.com — Understanding the Whys, Whats, and Whens of ValueTask", url: "https://devblogs.microsoft.com/dotnet/understanding-the-whys-whats-and-whens-of-valuetask/", icon: "📝" },
  { label: "docs.microsoft.com — Performance Tips", url: "https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function ValueTaskPage() {
  return (
    <AlgorithmLayout
      title="ValueTask vs Task"
      icon="TrendingUp"
      category="Performance"
      description="Task<T> é uma classe — qualquer retorno, mesmo quando o resultado já está disponível, aloca um objeto no heap e pressiona o GC. ValueTask<T> é uma struct: no caminho síncrono (cache hit, buffer cheio) o resultado volta pela stack sem nenhuma alocação. No caminho async real, delega para um Task<T> internamente — custo idêntico."
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação de um serviço com cache, medição de alocações via GC.GetAllocatedBytesForCurrentThread() e demonstração das armadilhas do ValueTask."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Task&lt;T&gt;</h2>
            <ul className="space-y-1.5 text-zinc-400 text-sm leading-relaxed">
              <li>Tipo <strong className="text-zinc-300">referência</strong> — sempre aloca no heap.</li>
              <li><code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Task.FromResult(x)</code> ainda cria um objeto.</li>
              <li>Pode ser aguardado <strong className="text-zinc-300">múltiplas vezes</strong>.</li>
              <li>Composição com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">WhenAll</code> / <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">WhenAny</code> nativa.</li>
              <li><strong className="text-emerald-400">Padrão para APIs públicas e I/O bound.</strong></li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">ValueTask&lt;T&gt;</h2>
            <ul className="space-y-1.5 text-zinc-400 text-sm leading-relaxed">
              <li>Tipo <strong className="text-zinc-300">valor</strong> (struct) — zero alocação no caminho síncrono.</li>
              <li><code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">new ValueTask&lt;int&gt;(x)</code> não toca o heap.</li>
              <li><strong className="text-red-400">Não pode</strong> ser aguardado mais de uma vez.</li>
              <li>Precisa de <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">.AsTask()</code> para compor com WhenAll.</li>
              <li><strong className="text-amber-400">Ideal para hot paths com resultado frequentemente em cache.</strong></li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Caminho síncrono", task: "Aloca Task no heap", vt: "Zero alocação (struct)", highlight: "vt" },
            { label: "Caminho assíncrono", task: "Aloca Task no heap", vt: "Aloca Task internamente", highlight: "equal" },
            { label: "Múltiplos awaits", task: "Suportado", vt: "Proibido — use .AsTask()", highlight: "task" },
          ].map(({ label, task, vt, highlight }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <div className="flex flex-col gap-1">
                <div className={`text-xs px-2 py-1 rounded ${highlight === "task" ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                  Task: {task}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${highlight === "vt" ? "bg-amber-500/10 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>
                  ValueTask: {vt}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Benchmark real: 50.000 chamadas ao caminho síncrono (cache hit) e 200 ao caminho async — alocações medidas com{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">GC.GetAllocatedBytesForCurrentThread()</code>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/performance/value-task/run`}
            buttonLabel="▶ Executar Benchmark"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
