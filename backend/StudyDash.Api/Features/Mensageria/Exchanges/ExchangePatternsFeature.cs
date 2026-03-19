namespace StudyDash.Api.Features.Mensageria.Exchanges;

/// <summary>
/// Vertical slice: RabbitMQ Exchange Patterns demo (simulado em memória)
/// Route: GET /api/mensageria/exchanges/run
/// </summary>
public static class ExchangePatternsFeature
{
    public static void MapExchangePatternsFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/mensageria/exchanges/run", RunAsync)
           .WithTags("Mensageria")
           .WithSummary("Demo Exchange Patterns (RabbitMQ)")
           .WithDescription("Simula os 3 tipos de exchange do RabbitMQ em memória via SSE: **Direct** (routing key exata), **Fanout** (broadcast para todas as filas) e **Topic** (wildcards `*` e `#` com algoritmo AMQP). Finaliza com comparação RabbitMQ vs Kafka.")
           .Produces<string>(200, "text/event-stream");
    }

    private record Message(string RoutingKey, string Payload);
    private record Binding(string QueueName, string Pattern);

    // ── Topic wildcard matching (AMQP spec) ───────────────────────────────────
    // '*' = exactly one word  |  '#' = zero or more words
    private static bool TopicMatches(string routingKey, string pattern)
    {
        var key = routingKey.Split('.');
        var pat = pattern.Split('.');
        return Match(key, pat, 0, 0);
    }

    private static bool Match(string[] key, string[] pat, int ki, int pi)
    {
        if (pi == pat.Length) return ki == key.Length;

        if (pat[pi] == "#")
        {
            // '#' can consume 0 or more words
            for (int skip = 0; skip <= key.Length - ki; skip++)
                if (Match(key, pat, ki + skip, pi + 1)) return true;
            return false;
        }

        if (ki >= key.Length) return false;
        if (pat[pi] != "*" && pat[pi] != key[ki]) return false;
        return Match(key, pat, ki + 1, pi + 1);
    }

    private static async Task RunAsync(HttpContext http, CancellationToken cancellationToken)
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

        try
        {
            await Send("── RabbitMQ Exchange Patterns ──");
            await Task.Delay(300, cancellationToken);

            // ── 1. Direct Exchange ─────────────────────────────────────────────
            await Send("");
            await Send("» 1. Direct Exchange — roteamento por routing key exata");
            await Task.Delay(200, cancellationToken);
            await Send("  Bindings configurados:");
            await Send("    'order'   → orders-queue");
            await Send("    'payment' → payments-queue");
            await Send("    'email'   → notifications-queue");
            await Task.Delay(300, cancellationToken);

            var directBindings = new Binding[]
            {
                new("orders-queue",        "order"),
                new("payments-queue",      "payment"),
                new("notifications-queue", "email"),
            };

            var directMessages = new Message[]
            {
                new("order",   "{ orderId: 'A1', product: 'Notebook' }"),
                new("payment", "{ orderId: 'A1', amount: 4599.90 }"),
                new("unknown", "{ data: 'mensagem sem binding' }"),
            };

            foreach (var msg in directMessages)
            {
                var matched = directBindings.Where(b => b.Pattern == msg.RoutingKey).ToList();
                if (matched.Count > 0)
                    foreach (var b in matched)
                        await Send($"  PUBLISH key='{msg.RoutingKey}' → [{b.QueueName}] ✓");
                else
                    await Send($"  PUBLISH key='{msg.RoutingKey}' → ✗ nenhum binding (descartada)");
                await Task.Delay(200, cancellationToken);
            }
            await Task.Delay(300, cancellationToken);

            // ── 2. Fanout Exchange ─────────────────────────────────────────────
            await Send("");
            await Send("» 2. Fanout Exchange — broadcast para TODAS as filas vinculadas");
            await Task.Delay(200, cancellationToken);
            await Send("  Bindings: email-queue, sms-queue, analytics-queue, audit-queue");
            await Task.Delay(200, cancellationToken);

            var fanoutQueues = new[] { "email-queue", "sms-queue", "analytics-queue", "audit-queue" };
            var fanoutMsg = new Message("", "{ orderId: 'B2', status: 'shipped' }");

            await Send($"  PUBLISH (routing key ignorada) → {fanoutMsg.Payload}");
            await Task.Delay(150, cancellationToken);

            foreach (var q in fanoutQueues)
            {
                await Send($"  → [{q}] recebeu cópia da mensagem ✓");
                await Task.Delay(100, cancellationToken);
            }
            await Task.Delay(300, cancellationToken);

            // ── 3. Topic Exchange ──────────────────────────────────────────────
            await Send("");
            await Send("» 3. Topic Exchange — routing key com wildcards (* e #)");
            await Task.Delay(200, cancellationToken);
            await Send("  Bindings configurados:");
            await Send("    'order.*'   → orders-queue      (* = exatamente 1 palavra)");
            await Send("    '*.error'   → errors-queue      (* = qualquer serviço)");
            await Send("    'audit.#'   → audit-queue       (# = zero ou mais palavras)");
            await Send("    '#'         → firehose-queue    (todas as mensagens)");
            await Task.Delay(300, cancellationToken);

            var topicBindings = new Binding[]
            {
                new("orders-queue",   "order.*"),
                new("errors-queue",   "*.error"),
                new("audit-queue",    "audit.#"),
                new("firehose-queue", "#"),
            };

            var topicMessages = new Message[]
            {
                new("order.placed",      "novo pedido"),
                new("order.shipped",     "pedido enviado"),
                new("payment.error",     "falha no pagamento"),
                new("audit.user.login",  "login registrado"),
                new("inventory.updated", "estoque atualizado"),
            };

            foreach (var msg in topicMessages)
            {
                var matched = topicBindings.Where(b => TopicMatches(msg.RoutingKey, b.Pattern)).ToList();
                var targets = matched.Count > 0
                    ? string.Join(", ", matched.Select(b => $"[{b.QueueName}]"))
                    : "✗ descartada";
                await Send($"  PUBLISH '{msg.RoutingKey}' → {targets}");
                await Task.Delay(200, cancellationToken);
            }
            await Task.Delay(400, cancellationToken);

            // ── RabbitMQ vs Kafka ─────────────────────────────────────────────
            await Send("");
            await Send("» RabbitMQ vs Kafka — quando usar cada um:");
            await Task.Delay(200, cancellationToken);
            await Send("  RabbitMQ  → mensageria tradicional; roteamento rico (exchanges); ACK por mensagem");
            await Send("             → ideal para: tasks assíncronas, RPC, workflows com routing complexo");
            await Send("  Kafka     → log distribuído imutável; replay; consumer groups; alta vazão");
            await Send("             → ideal para: event sourcing, streaming, audit log, integrações de dados");
            await Task.Delay(200, cancellationToken);
            await Send("  Throughput : Kafka ~1 M msg/s por partição vs RabbitMQ ~50 k msg/s por fila");
            await Send("  Retenção   : Kafka guarda por TTL configurável; RabbitMQ descarta após ACK");
            await Send("  Ordering   : Kafka garante ordem por partição; RabbitMQ por fila sem concorrência");
            await Send("  Replay     : Kafka permite reler a partir de qualquer offset; RabbitMQ não");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("✓ RabbitMQ para roteamento inteligente; Kafka para volume, replay e event sourcing");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
