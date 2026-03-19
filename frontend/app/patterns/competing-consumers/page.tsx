import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Producer: publica jobs na fila compartilhada ─────────────
for (int i = 1; i <= 9; i++)
{
    var job = new { JobId = i, Type = "process", Payload = $"order-{i}" };
    var body = JsonSerializer.SerializeToUtf8Bytes(job);

    await channel.BasicPublishAsync(
        exchange:   "jobs.exchange",
        routingKey: "job.process",
        mandatory:  false,
        basicProperties: new BasicProperties { DeliveryMode = DeliveryModes.Persistent },
        body:       body);
}

// ── Consumer: cada worker declara o mesmo consumer na mesma fila
// prefetchCount=1 → broker só envia próxima msg após ACK
await channel.BasicQosAsync(prefetchCount: 1);

var consumer = new AsyncEventingBasicConsumer(channel);
consumer.ReceivedAsync += async (_, ea) =>
{
    var job = JsonSerializer.Deserialize<Job>(ea.Body.Span);

    Console.WriteLine($"[Worker-{workerId}] processando Job-{job.JobId}...");
    await Task.Delay(job.ProcessingTimeMs);   // simula I/O ou CPU
    Console.WriteLine($"[Worker-{workerId}] Job-{job.JobId} ✓ ({job.ProcessingTimeMs}ms)");

    // ACK após processamento bem-sucedido
    await channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
};

// Todos os workers consomem a MESMA fila — round-robin automático
await channel.BasicConsumeAsync("jobs.main", autoAck: false, consumer: consumer);`;

const sources = [
  { label: "RabbitMQ — Work Queues Tutorial", url: "https://www.rabbitmq.com/tutorials/tutorial-two-dotnet", icon: "📖" },
  { label: "Enterprise Integration Patterns — Competing Consumers", url: "https://www.enterpriseintegrationpatterns.com/CompetingConsumers.html", icon: "📖" },
  { label: "Microsoft — Competing Consumers Pattern", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers", icon: "📝" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function CompetingConsumersPage() {
  return (
    <AlgorithmLayout
      title="Competing Consumers"
      icon="Users"
      category="Mensageria"
      description="No padrão Competing Consumers, múltiplos workers consomem a mesma fila concorrentemente. O broker distribui cada mensagem para exatamente um worker (round-robin com prefetchCount=1), garantindo que nenhuma mensagem seja processada duas vezes. O resultado é paralelismo horizontal sem coordenação explícita: para processar mais rápido, basta adicionar mais workers."
      sources={sources}
      code={csharpCode}
      codeDescription="Producer publica N jobs na fila; 3 workers consomem concorrentemente com prefetchCount=1. O broker distribui automaticamente em round-robin — cada job é processado por exatamente um worker."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Processamento Sequencial</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li>Um único worker processa os jobs um a um.</li>
              <li>Jobs somam <strong className="text-zinc-300">~1950ms</strong> em série.</li>
              <li>Escalabilidade zero: só CPU do worker aumenta a vazão.</li>
              <li>Gargalo se o processamento for lento (I/O, CPU).</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">3 Workers em Paralelo</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li>Worker-A, Worker-B e Worker-C na mesma fila.</li>
              <li>Tempo total cai para <strong className="text-emerald-400">~900ms</strong> (speedup ≈ 2,2×).</li>
              <li>Escalonamento horizontal: <strong className="text-emerald-400">adicione workers</strong> sem alterar producer.</li>
              <li><strong className="text-zinc-300">prefetchCount=1</strong> garante distribuição justa.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "prefetchCount = 1", value: "Broker aguarda ACK antes de enviar próxima mensagem ao mesmo worker", color: "blue" },
            { label: "Sem duplicatas", value: "Cada mensagem entregue a exatamente um worker — broker garante exclusividade", color: "emerald" },
            { label: "Escalonamento", value: "Adicionar workers é suficiente — sem mudar código do producer ou da fila", color: "emerald" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <span className={`text-xs ${color === "blue" ? "text-blue-300" : "text-emerald-300"}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
          <h2 className="font-semibold text-white">Quando usar Competing Consumers?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
            <ul className="space-y-1.5 leading-relaxed">
              <li><strong className="text-emerald-400">Jobs independentes</strong> — sem dependência de ordem entre mensagens.</li>
              <li><strong className="text-emerald-400">Processamento lento</strong> — encoding, resize, e-mail, pagamento.</li>
            </ul>
            <ul className="space-y-1.5 leading-relaxed">
              <li><strong className="text-amber-400">Evite se houver ordenação</strong> — use partições Kafka para garantir sequência.</li>
              <li><strong className="text-amber-400">Idempotência</strong> — workers devem tolerar reprocessamento em caso de falha.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            9 jobs com tipos e tempos de processamento variados são publicados no RabbitMQ. 3 workers
            competem pela mesma fila em paralelo, mostrando o speedup real comparado ao modo sequencial.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/mensageria/competing-consumers/run`}
            buttonLabel="▶ Executar Demo"
            accentColor="emerald"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
