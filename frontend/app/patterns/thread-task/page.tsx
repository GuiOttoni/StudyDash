import { LogRunSection } from "@/components/patterns/LogRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `// ── Thread: gerenciamento manual ──
var thread = new Thread(() =>
{
    Thread.Sleep(400);
    Console.WriteLine($"Thread#{Thread.CurrentThread.ManagedThreadId} concluída");
});

thread.Start();   // inicia a kernel thread
thread.Join();    // aguarda (bloqueando)

// ── Task: ThreadPool gerenciado ──
var task = Task.Run(async () =>
{
    await Task.Delay(400);
    return $"Task em Thread#{Thread.CurrentThread.ManagedThreadId}";
});

var result = await task;   // aguarda sem bloquear
Console.WriteLine(result);

// ── 4 tasks em paralelo ──
var results = await Task.WhenAll(
    Enumerable.Range(1, 4).Select(async i =>
    {
        await Task.Delay(300);
        return $"Task{i} → Thread#{Thread.CurrentThread.ManagedThreadId}";
    })
);

foreach (var r in results) Console.WriteLine(r);`;

const sources = [
  { label: "docs.microsoft.com — Task-based Async Pattern", url: "https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap", icon: "📖" },
  { label: "docs.microsoft.com — Threads", url: "https://learn.microsoft.com/en-us/dotnet/standard/threading/threads-and-threading", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function ThreadTaskPage() {
  return (
    <AlgorithmLayout
      title="Thread vs Task"
      icon="⚙️"
      category="Concorrência"
      description="Thread é uma kernel thread dedicada — leve no código, mas pesada no sistema (~1 MB de stack). Task é uma abstração sobre o ThreadPool que reutiliza threads automaticamente, integra-se com async/await e é a escolha preferida em código .NET moderno."
      sources={sources}
      code={csharpCode}
      codeDescription="Comparação de Thread manual vs Task.Run, com timing e IDs de thread."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Thread</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Cria uma <strong className="text-zinc-300">kernel thread dedicada</strong> (~1 MB de stack por padrão).</li>
            <li>Requer gerenciamento manual: <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Start()</code>, <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Join()</code>, <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Abort()</code>.</li>
            <li>Útil quando precisa de controle fino: prioridade, <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">IsBackground</code>, nome da thread.</li>
            <li><strong className="text-yellow-400">Não suporta</strong> <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">async/await</code> nativamente.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Task</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-zinc-300">Reutiliza threads do ThreadPool</strong> — muito mais leve que Thread.</li>
            <li>Integra-se nativamente com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">async/await</code> e <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">Task.WhenAll</code>.</li>
            <li>Suporta cancelamento via <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">CancellationToken</code> e retorno tipado.</li>
            <li><strong className="text-emerald-400">Escolha padrão</strong> para código assíncrono e paralelo moderno.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { role: "Thread.Start()", desc: "Inicia a kernel thread — aguarde com Join()." },
            { role: "Task.Run()", desc: "Agenda no ThreadPool — await sem bloquear." },
            { role: "Task.WhenAll()", desc: "Aguarda múltiplas tasks em paralelo." },
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
            Demonstra Thread manual vs Task.Run, com <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">ManagedThreadId</code> e comparação de timing entre 4 Threads e 4 Tasks em paralelo.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/concurrency/thread-task/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
