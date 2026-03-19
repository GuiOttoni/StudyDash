using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using StudyDash.Messaging.RabbitMq;

namespace StudyDash.Api.Features.Mensageria.Dlq;

/// <summary>
/// Vertical slice: Dead Letter Queue demo com AMQP real
/// Route: GET /api/mensageria/dlq/run
///
/// Demonstra DLQ com RabbitMQ real:
///   1. Conecta e declara exchanges/filas temporárias via AMQP
///   2. Publica 5 mensagens
///   3. Consome com falha simulada → BasicNack(requeue:false) → RabbitMQ roteia para DLQ
///   4. Drena a DLQ e exibe os headers x-death
///   5. Limpa a topologia e explica o pattern
///
/// Usa BasicGetAsync (pull mode) para manter controle de fluxo linear no handler SSE.
/// Push-mode (BasicConsumeAsync) entregaria mensagens em thread interna incompatível com SSE.
/// </summary>
public static class DlqFeature
{
    public static void MapDlqFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/mensageria/dlq/run", RunAsync)
           .WithTags("Mensageria")
           .WithSummary("Demo Dead Letter Queue (RabbitMQ real)")
           .WithDescription(
               "Demonstra DLQ com AMQP real via SSE: declara exchanges e filas temporárias, " +
               "publica 5 mensagens, simula falhas com BasicNack(requeue:false) → RabbitMQ roteia " +
               "para dlq.demo.dead. Drena a DLQ exibindo os headers x-death de cada mensagem morta.")
           .Produces<string>(200, "text/event-stream");
    }

    private record OrderMessage(int OrderId, string Produto, decimal Valor);

    private static async Task RunAsync(
        RabbitMqConnectionManager connectionManager,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string message)
        {
            await http.Response.WriteAsync($"data: {message}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        // Nomes de exchanges e filas temporárias (escopo desta demo)
        const string mainExchange = "dlq.demo.exchange";
        const string deadExchange = "dlq.demo.dead-exchange";
        const string mainQueue    = "dlq.demo.main";
        const string deadQueue    = "dlq.demo.dead";
        const string routingKey   = "order.process";
        const string deadKey      = "order.dead";

        // Canal por-request — nunca compartilhado
        await using var channel = await connectionManager.CreateChannelAsync(cancellationToken);

        try
        {
            await Send("── Dead Letter Queue Demo (RabbitMQ real) ──");
            await Task.Delay(300, cancellationToken);

            // ── FASE 1: Conectar + Declarar topologia ──────────────────────────
            await Send("");
            await Send("» Fase 1 — Declarando topologia AMQP...");
            await Task.Delay(200, cancellationToken);

            await channel.ExchangeDeclareAsync(mainExchange, ExchangeType.Direct,
                durable: false, autoDelete: false, cancellationToken: cancellationToken);
            await Send($"  ✓ Exchange: {mainExchange} (direct)");

            await channel.ExchangeDeclareAsync(deadExchange, ExchangeType.Direct,
                durable: false, autoDelete: false, cancellationToken: cancellationToken);
            await Send($"  ✓ Exchange: {deadExchange} (direct)");

            await channel.QueueDeclareAsync(mainQueue, durable: false, exclusive: false, autoDelete: false,
                arguments: new Dictionary<string, object?>
                {
                    ["x-dead-letter-exchange"]      = deadExchange,
                    ["x-dead-letter-routing-key"]   = deadKey,
                },
                cancellationToken: cancellationToken);
            await Send($"  ✓ Fila:     {mainQueue}");
            await Send($"              x-dead-letter-exchange:    {deadExchange}");
            await Send($"              x-dead-letter-routing-key: {deadKey}");

            await channel.QueueDeclareAsync(deadQueue, durable: false, exclusive: false, autoDelete: false,
                cancellationToken: cancellationToken);
            await Send($"  ✓ Fila:     {deadQueue}  ← mensagens rejeitadas chegam aqui");

            await channel.QueueBindAsync(mainQueue, mainExchange, routingKey,
                cancellationToken: cancellationToken);
            await Send($"  ✓ Binding:  {mainExchange} --[{routingKey}]→ {mainQueue}");

            await channel.QueueBindAsync(deadQueue, deadExchange, deadKey,
                cancellationToken: cancellationToken);
            await Send($"  ✓ Binding:  {deadExchange} --[{deadKey}]→ {deadQueue}");
            await Task.Delay(400, cancellationToken);

            // ── FASE 2: Publicar 5 mensagens ───────────────────────────────────
            await Send("");
            await Send("» Fase 2 — Publicando 5 mensagens na fila principal...");
            await Task.Delay(200, cancellationToken);

            var orders = new OrderMessage[]
            {
                new(1, "Notebook",  4599.90m),
                new(2, "Mouse",       89.90m),
                new(3, "Teclado",    259.90m),
                new(4, "Monitor",   1799.90m),
                new(5, "Headset",    349.90m),
            };

            foreach (var order in orders)
            {
                var body  = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(order));
                var props = new BasicProperties
                {
                    ContentType  = "application/json",
                    DeliveryMode = DeliveryModes.Transient,
                    MessageId    = Guid.NewGuid().ToString(),
                };

                await channel.BasicPublishAsync(
                    exchange: mainExchange, routingKey: routingKey,
                    mandatory: false, basicProperties: props, body: body,
                    cancellationToken: cancellationToken);

                await Send($"  PUBLISH [{order.OrderId}] {order.Produto} → {mainQueue}");
                await Task.Delay(120, cancellationToken);
            }

            await Send($"  ✓ 5 mensagens publicadas em '{mainQueue}'");
            await Task.Delay(400, cancellationToken);

            // ── FASE 3: Consumir com falha simulada ────────────────────────────
            await Send("");
            await Send("» Fase 3 — Processando mensagens (orderId ímpar → FALHA → DLQ)...");
            await Task.Delay(200, cancellationToken);
            await Send("  Regra: orderId par → ACK ✓ (sucesso) | orderId ímpar → NACK ✗ (falha → DLQ)");
            await Task.Delay(200, cancellationToken);

            int acked = 0, nacked = 0;

            for (int i = 0; i < orders.Length; i++)
            {
                await Task.Delay(200, cancellationToken);
                var result = await channel.BasicGetAsync(mainQueue, autoAck: false, cancellationToken);
                if (result is null) break;

                var body  = Encoding.UTF8.GetString(result.Body.Span);
                var order = JsonSerializer.Deserialize<OrderMessage>(body)!;

                if (order.OrderId % 2 == 0)
                {
                    await channel.BasicAckAsync(result.DeliveryTag, multiple: false, cancellationToken);
                    await Send($"  [{order.OrderId}] {order.Produto,-12} → ACK ✓  processado com sucesso");
                    acked++;
                }
                else
                {
                    await channel.BasicNackAsync(result.DeliveryTag, multiple: false, requeue: false,
                        cancellationToken);
                    await Send($"  [{order.OrderId}] {order.Produto,-12} → NACK ✗  requeue:false → vai para DLQ");
                    nacked++;
                }
            }

            await Task.Delay(400, cancellationToken);
            await Send($"  ✓ Resultado: {acked} ACK(s), {nacked} NACK(s) → {nacked} mensagem(s) na DLQ");

            // ── FASE 4: Drenar DLQ ─────────────────────────────────────────────
            await Send("");
            await Send("» Fase 4 — Lendo Dead Letter Queue...");
            await Task.Delay(300, cancellationToken);

            int dlqCount = 0;
            while (true)
            {
                var dead = await channel.BasicGetAsync(deadQueue, autoAck: true, cancellationToken);
                if (dead is null) break;

                dlqCount++;
                var body  = Encoding.UTF8.GetString(dead.Body.Span);
                var order = JsonSerializer.Deserialize<OrderMessage>(body)!;

                await Send($"  [DLQ-{dlqCount}] orderId={order.OrderId} | {order.Produto}");

                // Extrair x-death headers para mostrar o rastreamento
                if (dead.BasicProperties.Headers?.TryGetValue("x-death", out var xdeath) == true
                    && xdeath is List<object> deaths && deaths.Count > 0
                    && deaths[0] is IDictionary<string, object> entry)
                {
                    var reason  = entry.TryGetValue("reason",   out var r) ? Encoding.UTF8.GetString((byte[])r) : "?";
                    var queue   = entry.TryGetValue("queue",    out var q) ? Encoding.UTF8.GetString((byte[])q) : "?";
                    var xchg    = entry.TryGetValue("exchange", out var x) ? Encoding.UTF8.GetString((byte[])x) : "?";
                    var count   = entry.TryGetValue("count",    out var c) ? c : "?";
                    await Send($"         x-death: reason={reason}, count={count}, queue={queue}, exchange={xchg}");
                }

                await Task.Delay(150, cancellationToken);
            }

            if (dlqCount == 0)
                await Send("  (DLQ vazia — mensagens ainda em trânsito, tente novamente em instantes)");
            else
                await Send($"  ✓ {dlqCount} mensagem(s) encontrada(s) na DLQ — disponíveis para análise ou reprocessamento");

            await Task.Delay(400, cancellationToken);

            // ── FASE 5: Limpar + teoria ────────────────────────────────────────
            await Send("");
            await Send("» Fase 5 — Limpando topologia de demo...");
            await Task.Delay(200, cancellationToken);
            await channel.QueueDeleteAsync(mainQueue, cancellationToken: cancellationToken);
            await channel.QueueDeleteAsync(deadQueue, cancellationToken: cancellationToken);
            await channel.ExchangeDeleteAsync(mainExchange, cancellationToken: cancellationToken);
            await channel.ExchangeDeleteAsync(deadExchange, cancellationToken: cancellationToken);
            await Send("  ✓ Filas e exchanges temporários removidos");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Por que DLQ é essencial em produção?");
            await Task.Delay(200, cancellationToken);
            await Send("  ✗ Sem DLQ: mensagem rejeitada é descartada (perda de dados)");
            await Send("             ou reenfileirada infinitamente (loop de retentativa)");
            await Send("  ✓ Com DLQ: mensagens problemáticas são isoladas e preservadas");
            await Send("             operações podem inspecionar, corrigir e reprocessar");
            await Task.Delay(200, cancellationToken);
            await Send("  Causas comuns de DLQ: payload inválido, dependência indisponível,");
            await Send("    TTL expirado (x-message-ttl), fila cheia (x-max-length)");
            await Task.Delay(200, cancellationToken);
            await Send("  Estratégias: retry com backoff exponencial, correção manual,");
            await Send("    DLQ → replay automático após correção do sistema");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  StudyDash.WorkerApi também demonstra DLQ em produção:");
            await Send("    → studydash.orders   consome pedidos reais (30% falha → DLQ)");
            await Send("    → studydash.orders.dead  acumula os rejeitados");
            await Send("    Observar: docker logs studydash-worker -f");

            await Send("");
            await Send("✓ DLQ é o mecanismo de resiliência fundamental de qualquer sistema de mensageria");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
