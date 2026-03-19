using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using StudyDash.Messaging;
using StudyDash.Messaging.Kafka;

namespace StudyDash.Api.Features.Mensageria.ConsumerGroups;

/// <summary>
/// Vertical slice: Consumer Groups e Particionamento com Kafka real
/// Route: GET /api/mensageria/consumer-groups/run
///
/// Demonstra:
///   1. Produz 9 mensagens com 3 chaves diferentes (orders, payments, inventory)
///   2. Consumer Group A lê todas as mensagens — mostra partition/offset
///   3. Consumer Group B lê as MESMAS mensagens do início (replay!)
///      → diferença fundamental do Kafka vs RabbitMQ: mensagens ficam no log
///   4. Explica particionamento e escalonamento horizontal
/// </summary>
public static class ConsumerGroupsFeature
{
    public static void MapConsumerGroupsFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/mensageria/consumer-groups/run", RunAsync)
           .WithTags("Mensageria")
           .WithSummary("Demo Consumer Groups e Particionamento (Kafka real)")
           .WithDescription(
               "Demonstra Consumer Groups com Kafka real via SSE: produz 9 mensagens com 3 chaves " +
               "diferentes, Consumer Group A lê todas (partition/offset), Consumer Group B faz replay " +
               "das mesmas mensagens — mostrando a diferença fundamental entre Kafka e RabbitMQ.")
           .Produces<string>(200, "text/event-stream");
    }

    private record Evento(string Dominio, string Tipo, string Payload);

    private static async Task RunAsync(
        KafkaProducerService producer,
        IOptions<MessagingOptions> options,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string msg)
        {
            await http.Response.WriteAsync($"data: {msg}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        // Tópico único por execução para evitar contaminação entre runs
        var runId  = Guid.NewGuid().ToString("N")[..6];
        var topic  = $"studydash.cg-demo-{runId}";
        var bootstrap = options.Value.Kafka.BootstrapServers;

        var eventos = new Evento[]
        {
            new("orders",    "order.placed",     $"{{\"orderId\":\"A{runId}-1\",\"valor\":199.90}}"),
            new("payments",  "payment.received", $"{{\"orderId\":\"A{runId}-1\",\"txId\":\"TX-001\"}}"),
            new("inventory", "stock.reserved",   $"{{\"orderId\":\"A{runId}-1\",\"qty\":1}}"),
            new("orders",    "order.placed",     $"{{\"orderId\":\"B{runId}-2\",\"valor\":599.00}}"),
            new("payments",  "payment.received", $"{{\"orderId\":\"B{runId}-2\",\"txId\":\"TX-002\"}}"),
            new("inventory", "stock.reserved",   $"{{\"orderId\":\"B{runId}-2\",\"qty\":3}}"),
            new("orders",    "order.shipped",    $"{{\"orderId\":\"A{runId}-1\",\"tracking\":\"TRK-9\"}}"),
            new("payments",  "refund.issued",    $"{{\"orderId\":\"B{runId}-2\",\"motivo\":\"cancelamento\"}}"),
            new("inventory", "stock.released",   $"{{\"orderId\":\"B{runId}-2\",\"qty\":3}}"),
        };

        try
        {
            await Send("── Consumer Groups e Particionamento (Kafka real) ──");
            await Task.Delay(300, cancellationToken);

            // ── FASE 1: Produzir mensagens ─────────────────────────────────────
            await Send("");
            await Send($"» Fase 1 — Publicando {eventos.Length} eventos no tópico '{topic}'...");
            await Send("  (Chave da mensagem determina a partição — mesma chave → mesma partição)");
            await Task.Delay(200, cancellationToken);

            foreach (var ev in eventos)
            {
                var value  = JsonSerializer.Serialize(ev);
                var result = await producer.ProduceAsync(topic, ev.Dominio, value, cancellationToken);
                await Send($"  PRODUCE key={ev.Dominio,-10} tipo={ev.Tipo,-22} → partition={result.Partition.Value} offset={result.Offset.Value}");
                await Task.Delay(100, cancellationToken);
            }

            await Send($"  ✓ {eventos.Length} eventos persistidos no log do Kafka");
            await Task.Delay(400, cancellationToken);

            // ── FASE 2: Consumer Group A ───────────────────────────────────────
            await Send("");
            await Send("» Fase 2 — Consumer Group 'analytics-service' lendo do início...");
            await Task.Delay(200, cancellationToken);

            int consumidos = await ConsumeGroupAsync(
                bootstrap, topic, "analytics-service", eventos.Length, Send, cancellationToken);

            await Send($"  ✓ analytics-service processou {consumidos} eventos — offset confirmado");
            await Task.Delay(400, cancellationToken);

            // ── FASE 3: Consumer Group B — Replay ─────────────────────────────
            await Send("");
            await Send("» Fase 3 — Consumer Group 'audit-service' lendo os MESMOS eventos (replay)...");
            await Send("  RabbitMQ: mensagem consumida = removida da fila (sem replay)");
            await Send("  Kafka:    mensagem permanece no log — qualquer grupo pode reler do offset 0");
            await Task.Delay(300, cancellationToken);

            int replay = await ConsumeGroupAsync(
                bootstrap, topic, "audit-service", eventos.Length, Send, cancellationToken);

            await Send($"  ✓ audit-service processou {replay} eventos a partir do offset 0");
            await Task.Delay(400, cancellationToken);

            // ── FASE 4: Particionamento ────────────────────────────────────────
            await Send("");
            await Send("» Particionamento e escalabilidade horizontal:");
            await Task.Delay(150, cancellationToken);
            await Send("  Partição = unidade de paralelismo no Kafka");
            await Send("  1 consumer no grupo → atende TODAS as partições");
            await Send("  N consumers no grupo → cada um atende N/partições (sem duplicatas)");
            await Send("  regra: consumers > partições → consumers ociosos (sem trabalho)");
            await Task.Delay(150, cancellationToken);
            await Send("  Chave da mensagem garante ordenação por entidade:");
            await Send("    key='orders'    → sempre na mesma partição → ordenação garantida");
            await Send("    key='payments'  → partição diferente → processado em paralelo");
            await Task.Delay(200, cancellationToken);
            await Send("  Kafka vs RabbitMQ:");
            await Send("    Kafka:    log imutável — replay, event sourcing, audit trail");
            await Send("    RabbitMQ: fila — ACK descarta; ideal para tasks, workflows, DLQ");

            await Send("");
            await Send("✓ Consumer Groups permitem múltiplos sistemas consumirem o mesmo log independentemente");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }

    private static async Task<int> ConsumeGroupAsync(
        string bootstrap,
        string topic,
        string groupId,
        int expectedCount,
        Func<string, Task> send,
        CancellationToken ct)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = bootstrap,
            GroupId          = groupId,
            AutoOffsetReset  = AutoOffsetReset.Earliest,
            EnableAutoCommit = false,
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe(topic);

        int count   = 0;
        int maxWait = 30; // max iterações sem mensagem

        while (count < expectedCount && maxWait > 0 && !ct.IsCancellationRequested)
        {
            var result = await Task.Run(() => consumer.Consume(TimeSpan.FromMilliseconds(500)), ct);

            if (result is null)
            {
                maxWait--;
                continue;
            }

            count++;
            var ev = JsonSerializer.Deserialize<ConsumerGroupsFeature_Evento>(result.Message.Value);
            await send($"  [{groupId}] partition={result.Partition.Value} offset={result.Offset,-4} key={result.Message.Key,-10} → {ev?.Tipo ?? result.Message.Value}");
            consumer.Commit(result);
            await Task.Delay(80, ct);
        }

        consumer.Close();
        return count;
    }

    // Record auxiliar para deserialização dentro do método estático privado
    private record ConsumerGroupsFeature_Evento(string Dominio, string Tipo, string Payload);
}
