import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Producer: publica eventos no tópico ──────────────────────
var producer = new ProducerBuilder<string, string>(new ProducerConfig
{
    BootstrapServers = "kafka:9092",
    Acks = Acks.Leader,
}).Build();

await producer.ProduceAsync("study-events", new Message<string, string>
{
    Key   = "order-service",
    Value = JsonSerializer.Serialize(new { EventType = "OrderPlaced", OrderId = 42 }),
});

// ── Consumer Group A — analytics-service ─────────────────────
var analyticsConsumer = new ConsumerBuilder<string, string>(new ConsumerConfig
{
    BootstrapServers  = "kafka:9092",
    GroupId           = "analytics-service",  // ← grupo independente
    AutoOffsetReset   = AutoOffsetReset.Earliest,
    EnableAutoCommit  = false,
}).Build();

analyticsConsumer.Subscribe("study-events");

while (!stoppingToken.IsCancellationRequested)
{
    var result = analyticsConsumer.Consume(TimeSpan.FromSeconds(1));
    if (result is null) continue;

    Console.WriteLine($"[analytics] offset={result.Offset} key={result.Message.Key}");
    analyticsConsumer.Commit(result);   // commit manual por mensagem
}

// ── Consumer Group B — audit-service (replay do offset 0) ────
// Mesmo tópico, GroupId diferente → lê os mesmos eventos independentemente
var auditConfig = new ConsumerConfig
{
    GroupId = "audit-service",   // ← grupo separado = cursor separado
    AutoOffsetReset = AutoOffsetReset.Earliest,
};`;

const sources = [
  { label: "Apache Kafka — Consumer Groups", url: "https://kafka.apache.org/documentation/#intro_consumers", icon: "📖" },
  { label: "Confluent — Consumer Group Protocol", url: "https://developer.confluent.io/courses/apache-kafka/consumer-group-protocol/", icon: "📖" },
  { label: "Confluent — Kafka vs RabbitMQ", url: "https://www.confluent.io/learn/rabbitmq-vs-apache-kafka/", icon: "📝" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function ConsumerGroupsPage() {
  return (
    <AlgorithmLayout
      title="Consumer Groups"
      icon="Network"
      category="Mensageria"
      description="No Kafka, um Consumer Group é um conjunto de consumidores que cooperam para ler um tópico. Cada partição é atribuída a exatamente um consumidor dentro do grupo — paralelismo automático. A chave diferencial do Kafka é que grupos independentes têm cursores (offsets) independentes: dois serviços com GroupIds diferentes leem os mesmos eventos sem interferência, e qualquer grupo pode fazer replay a partir do offset 0 a qualquer momento."
      sources={sources}
      code={csharpCode}
      codeDescription="Dois consumer groups independentes (analytics-service e audit-service) lendo o mesmo tópico Kafka. O segundo grupo faz replay a partir do offset 0, demonstrando a diferença fundamental entre log (Kafka) e fila (RabbitMQ)."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">RabbitMQ — Fila</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li><strong className="text-red-400">Mensagem destruída após ACK</strong> — não há replay.</li>
              <li>Dois consumers na mesma fila <strong className="text-zinc-300">competem</strong> (Competing Consumers).</li>
              <li>Para cada "serviço" receber a mensagem → crie uma fila por serviço (Fanout).</li>
              <li>Ideal para: <strong className="text-emerald-400">tasks, RPC, processamento único</strong>.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Kafka — Log Imutável</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li><strong className="text-emerald-400">Mensagem persiste</strong> no log — múltiplos grupos leem independentemente.</li>
              <li>Cada GroupId mantém seu próprio <strong className="text-zinc-300">offset</strong>.</li>
              <li>Replay: <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">AutoOffsetReset.Earliest</code> → relê desde o início.</li>
              <li>Ideal para: <strong className="text-emerald-400">event sourcing, audit, streaming, analytics</strong>.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Paralelismo", value: "Partições distribuídas entre consumers do mesmo grupo — sem duplicatas", color: "blue" },
            { label: "Isolamento", value: "GroupIds diferentes têm offsets independentes — sem interferência", color: "emerald" },
            { label: "Replay", value: "Qualquer grupo pode reler eventos antigos a partir de qualquer offset", color: "emerald" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <span className={`text-xs ${color === "blue" ? "text-blue-300" : "text-emerald-300"}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
          <h2 className="font-semibold text-white">Fluxo da Demo</h2>
          <ol className="space-y-1.5 text-zinc-400 leading-relaxed list-decimal list-inside">
            <li>Producer publica 9 eventos com 3 chaves de domínio (orders, payments, inventory).</li>
            <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">analytics-service</code> lê todos os 9 eventos do offset 0.</li>
            <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">audit-service</code> faz <strong className="text-emerald-400">replay</strong> dos mesmos 9 eventos a partir do offset 0.</li>
            <li>Ambos os grupos são independentes — nenhum interfere no offset do outro.</li>
            <li>Tópico temporário descartado ao final para evitar contaminação entre execuções.</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Publica 9 eventos no Kafka real, depois demonstra dois consumer groups independentes
            lendo o mesmo log — o segundo faz replay completo a partir do offset 0.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/mensageria/consumer-groups/run`}
            buttonLabel="▶ Executar Demo"
            accentColor="blue"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
