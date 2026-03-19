import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Declarar topologia DLQ no RabbitMQ ───────────────────────
// Exchange principal e exchange de dead-letter
await channel.ExchangeDeclareAsync("orders.exchange",  "direct", durable: true);
await channel.ExchangeDeclareAsync("orders.dlq.exchange", "fanout", durable: true);

// Fila principal: configura x-dead-letter-exchange
var mainArgs = new Dictionary<string, object?>
{
    ["x-dead-letter-exchange"]    = "orders.dlq.exchange",
    ["x-dead-letter-routing-key"] = "order.dead",
    ["x-message-ttl"]             = 30_000,   // mensagem expira em 30s → DLQ
};
await channel.QueueDeclareAsync("orders.main", durable: true, arguments: mainArgs);
await channel.QueueBindAsync("orders.main", "orders.exchange", "order.process");

// Dead Letter Queue
await channel.QueueDeclareAsync("orders.dead", durable: true);
await channel.QueueBindAsync("orders.dead", "orders.dlq.exchange", "order.dead");

// ── Consumir com ACK / NACK ───────────────────────────────────
var consumer = new AsyncEventingBasicConsumer(channel);
consumer.ReceivedAsync += async (_, ea) =>
{
    var order = JsonSerializer.Deserialize<Order>(ea.Body.Span);

    if (CanProcess(order))
    {
        await ProcessAsync(order);
        await channel.BasicAckAsync(ea.DeliveryTag, multiple: false);      // ✓ removida da fila
    }
    else
    {
        // requeue:false → RabbitMQ roteia para x-dead-letter-exchange
        await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: false); // ✗ → DLQ
    }
};

// prefetchCount=1 — broker só envia nova mensagem após ACK/NACK
await channel.BasicQosAsync(prefetchCount: 1);
await channel.BasicConsumeAsync("orders.main", autoAck: false, consumer: consumer);`;

const sources = [
  { label: "RabbitMQ — Dead Letter Exchanges", url: "https://www.rabbitmq.com/docs/dlx", icon: "📖" },
  { label: "RabbitMQ — Consumer Acknowledgements", url: "https://www.rabbitmq.com/docs/confirms", icon: "📖" },
  { label: "Enterprise Integration Patterns — Dead Letter Channel", url: "https://www.enterpriseintegrationpatterns.com/DeadLetterChannel.html", icon: "📝" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function DlqPage() {
  return (
    <AlgorithmLayout
      title="Dead Letter Queue"
      icon="Inbox"
      category="Mensageria"
      description="Quando uma mensagem não pode ser processada com sucesso — após esgotar tentativas, receber um NACK com requeue:false ou expirar pelo TTL — o RabbitMQ a redireciona para uma exchange especial chamada Dead Letter Exchange (DLX). A fila vinculada a essa DLX é a Dead Letter Queue (DLQ). Ela funciona como caixa de entrada de falhas: permite análise, reprocessamento manual ou alerta operacional, evitando perda silenciosa de mensagens."
      sources={sources}
      code={csharpCode}
      codeDescription="Declaração de topologia AMQP com x-dead-letter-exchange, x-message-ttl, e consumidor que decide entre BasicAck (sucesso) e BasicNack(requeue:false) (falha → DLQ)."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            {
              cause: "BasicNack requeue:false",
              desc: "Consumidor rejeita explicitamente a mensagem sem reencaminhar para a fila original.",
              color: "red",
            },
            {
              cause: "x-message-ttl expirado",
              desc: "Mensagem permaneceu na fila além do tempo máximo configurado (TTL).",
              color: "amber",
            },
            {
              cause: "Fila cheia (x-max-length)",
              desc: "A fila atingiu o limite de mensagens e a mais antiga é descartada para a DLQ.",
              color: "orange",
            },
          ].map(({ cause, desc, color }) => (
            <div key={cause} className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded w-fit ${
                color === "red"    ? "bg-red-950 text-red-400 border border-red-900"
                : color === "amber" ? "bg-amber-950 text-amber-400 border border-amber-900"
                : "bg-orange-950 text-orange-400 border border-orange-900"
              }`}>{cause}</span>
              <p className="text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Fluxo da Mensagem</h2>
            <ol className="space-y-2 text-zinc-400 leading-relaxed list-decimal list-inside">
              <li>Producer publica para <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">orders.exchange</code>.</li>
              <li>Mensagem entra em <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">orders.main</code>.</li>
              <li>Consumidor processa → <strong className="text-emerald-400">ACK</strong> ou falha → <strong className="text-red-400">NACK</strong>.</li>
              <li>NACK (requeue:false) → RabbitMQ aplica <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">x-dead-letter-exchange</code>.</li>
              <li>Mensagem chega em <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">orders.dead</code> com headers <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">x-death</code>.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Headers x-death</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Cada mensagem na DLQ carrega o header <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">x-death</code> com:
            </p>
            <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
              <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">reason</code> — <span className="text-amber-400">rejected</span>, <span className="text-amber-400">expired</span> ou <span className="text-amber-400">maxlen</span></li>
              <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">queue</code> — fila de origem</li>
              <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">time</code> — timestamp da morte</li>
              <li><code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">count</code> — quantas vezes a mensagem morreu</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
          <h2 className="font-semibold text-white">Boas Práticas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
            <ul className="space-y-1.5 leading-relaxed">
              <li><strong className="text-emerald-400">Monitore a DLQ</strong> — aumento de mensagens indica problema sistêmico.</li>
              <li><strong className="text-emerald-400">Alertas</strong> — configure alarmes no RabbitMQ Management ou Prometheus.</li>
            </ul>
            <ul className="space-y-1.5 leading-relaxed">
              <li><strong className="text-amber-400">Reprocessamento</strong> — publique de volta na fila principal após corrigir o bug.</li>
              <li><strong className="text-amber-400">Nunca ignore</strong> — DLQ sem consumidor é perda silenciosa de dados.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Declara topologia AMQP real no RabbitMQ, publica 5 pedidos, consome simulando falhas
            com BasicNack e drena a DLQ exibindo os headers <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">x-death</code>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/mensageria/dlq/run`}
            buttonLabel="▶ Executar Demo DLQ"
            accentColor="violet"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
