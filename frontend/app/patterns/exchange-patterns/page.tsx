import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Topic Exchange wildcard matching (AMQP spec) ─────────────
// '*' = exatamente 1 palavra  |  '#' = zero ou mais palavras
static bool TopicMatches(string routingKey, string pattern)
{
    var key = routingKey.Split('.');
    var pat = pattern.Split('.');
    return Match(key, pat, 0, 0);
}

// ── Simulação de roteamento ───────────────────────────────────
var bindings = new[]
{
    ("orders-queue",   "order.*"),   // order.placed, order.shipped
    ("errors-queue",   "*.error"),   // payment.error, inventory.error
    ("audit-queue",    "audit.#"),   // audit.user.login, audit.order.placed
    ("firehose-queue", "#"),         // tudo
};

var messages = new[] { "order.placed", "payment.error", "audit.user.login" };

foreach (var key in messages)
{
    var matched = bindings.Where(b => TopicMatches(key, b.Item2)).ToList();
    Console.WriteLine($"'{key}' → {string.Join(", ", matched.Select(b => b.Item1))}");
}
// order.placed    → [orders-queue, audit-queue(?), firehose-queue]
// payment.error   → [errors-queue, firehose-queue]
// audit.user.login→ [audit-queue, firehose-queue]`;

const sources = [
  { label: "RabbitMQ — AMQP Concepts", url: "https://www.rabbitmq.com/tutorials/amqp-concepts", icon: "📖" },
  { label: "RabbitMQ — Topic Exchange Tutorial", url: "https://www.rabbitmq.com/tutorials/tutorial-five-dotnet", icon: "📝" },
  { label: "Confluent — Kafka vs RabbitMQ", url: "https://www.confluent.io/learn/rabbitmq-vs-apache-kafka/", icon: "📖" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function ExchangePatternsPage() {
  return (
    <AlgorithmLayout
      title="Exchange Patterns"
      icon="Send"
      category="Mensageria"
      description="No RabbitMQ, exchanges recebem mensagens e as roteiam para filas via bindings. O tipo de exchange determina a lógica de roteamento: Direct (chave exata), Fanout (broadcast), Topic (wildcards * e #) e Headers (atributos da mensagem). Escolher o exchange correto define a flexibilidade e o acoplamento do seu sistema de mensageria."
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação do algoritmo de matching de Topic Exchange com suporte a wildcards (* = 1 palavra, # = N palavras) e simulação de roteamento em memória."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              type: "Direct",
              icon: "→",
              desc: "Mensagem chega na fila cujo binding key seja igual à routing key. Um-para-um exato.",
              example: "key='order' → orders-queue",
              color: "blue",
            },
            {
              type: "Fanout",
              icon: "⊕",
              desc: "Broadcast: ignora routing key e entrega cópia para todas as filas vinculadas.",
              example: "qualquer key → email, sms, analytics",
              color: "emerald",
            },
            {
              type: "Topic",
              icon: "*#",
              desc: "Routing key com padrões: * = uma palavra, # = zero ou mais. Máxima flexibilidade.",
              example: "'order.*' → order.placed, order.shipped",
              color: "violet",
            },
          ].map(({ type, icon, desc, example, color }) => (
            <div key={type} className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-lg ${
                  color === "blue" ? "text-blue-400" : color === "emerald" ? "text-emerald-400" : "text-violet-400"
                }`}>{icon}</span>
                <h2 className="font-semibold text-white">{type} Exchange</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              <code className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">{example}</code>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">RabbitMQ</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li>Protocolo <strong className="text-zinc-300">AMQP</strong> — modelo push com ACK por mensagem.</li>
              <li>Roteamento rico com exchanges, bindings e headers.</li>
              <li>Throughput ~<strong className="text-zinc-300">50 k msg/s</strong> por fila.</li>
              <li><strong className="text-red-400">Sem replay</strong> — mensagem descartada após ACK.</li>
              <li>Ideal para: <strong className="text-emerald-400">tasks, RPC, workflows complexos</strong>.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Apache Kafka</h2>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li><strong className="text-zinc-300">Log distribuído</strong> imutável com partições.</li>
              <li>Consumer groups para escalabilidade horizontal.</li>
              <li>Throughput ~<strong className="text-zinc-300">1 M msg/s</strong> por partição.</li>
              <li><strong className="text-emerald-400">Replay</strong> — leitura a partir de qualquer offset.</li>
              <li>Ideal para: <strong className="text-emerald-400">event sourcing, streaming, audit log</strong>.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Simulação dos 3 tipos de exchange em memória: Direct com routing key exata, Fanout broadcast e
            Topic com wildcards. Finaliza com comparação RabbitMQ vs Kafka.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/mensageria/exchanges/run`}
            buttonLabel="▶ Executar Demo"
            accentColor="violet"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
