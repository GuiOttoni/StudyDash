using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using StudyDash.Messaging.RabbitMq;

namespace StudyDash.Api.Features.Mensageria.CompetingConsumers;

/// <summary>
/// Vertical slice: Competing Consumers Pattern com RabbitMQ real
/// Route: GET /api/mensageria/competing-consumers/run
///
/// Demonstra o padrão Competing Consumers:
///   - Múltiplos workers competem pela mesma fila
///   - RabbitMQ distribui mensagens round-robin (prefetchCount=1)
///   - Cada mensagem é processada por exatamente UM worker
///   - Escalabilidade horizontal: mais workers = mais throughput
/// </summary>
public static class CompetingConsumersFeature
{
    public static void MapCompetingConsumersFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/mensageria/competing-consumers/run", RunAsync)
           .WithTags("Mensageria")
           .WithSummary("Demo Competing Consumers (RabbitMQ real)")
           .WithDescription(
               "Demonstra o padrão Competing Consumers com AMQP real via SSE: 3 workers competem " +
               "por uma fila de 9 jobs. Cada mensagem é processada por exatamente um worker. " +
               "Mostra distribuição round-robin, speedup paralelo vs sequencial e prefetch count.")
           .Produces<string>(200, "text/event-stream");
    }

    private record Job(int Id, string Tipo, int ProcessamentoMs);

    private static readonly Job[] Jobs =
    [
        new(1, "Cálculo de imposto",    300),
        new(2, "Envio de e-mail",       200),
        new(3, "Geração de PDF",        150),
        new(4, "Sincronização de CRM",  300),
        new(5, "Notificação push",      200),
        new(6, "Relatório contábil",    150),
        new(7, "Indexação de busca",    300),
        new(8, "Resize de imagem",      200),
        new(9, "Exportação CSV",        150),
    ];

    private static readonly string[] Workers = ["Worker-A", "Worker-B", "Worker-C"];

    private static async Task RunAsync(
        RabbitMqConnectionManager connectionManager,
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

        const string exchange = "cc.demo.exchange";
        const string queue    = "cc.demo.jobs";
        const string key      = "job";

        await using var channel = await connectionManager.CreateChannelAsync(cancellationToken);

        try
        {
            await Send("── Competing Consumers Pattern (RabbitMQ real) ──");
            await Task.Delay(300, cancellationToken);

            // ── FASE 1: Topologia ──────────────────────────────────────────────
            await Send("");
            await Send("» Fase 1 — Declarando topologia...");
            await Task.Delay(150, cancellationToken);

            await channel.ExchangeDeclareAsync(exchange, ExchangeType.Direct,
                durable: false, autoDelete: false, cancellationToken: cancellationToken);
            await channel.QueueDeclareAsync(queue, durable: false, exclusive: false, autoDelete: false,
                cancellationToken: cancellationToken);
            await channel.QueueBindAsync(queue, exchange, key, cancellationToken: cancellationToken);

            // prefetchCount=1 garante que cada worker pega 1 mensagem por vez
            await channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 1, global: false,
                cancellationToken: cancellationToken);

            await Send($"  ✓ Exchange: {exchange} (direct)");
            await Send($"  ✓ Fila:     {queue}  |  prefetchCount=1");
            await Send($"  ✓ Workers:  {string.Join(", ", Workers)}");
            await Task.Delay(300, cancellationToken);

            // ── FASE 2: Publicar jobs ──────────────────────────────────────────
            await Send("");
            await Send($"» Fase 2 — Publicando {Jobs.Length} jobs na fila...");
            await Task.Delay(150, cancellationToken);

            foreach (var job in Jobs)
            {
                var body  = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(job));
                var props = new BasicProperties { ContentType = "application/json", DeliveryMode = DeliveryModes.Transient };
                await channel.BasicPublishAsync(exchange, key, false, props, body, cancellationToken);
                await Send($"  PUBLISH → Job-{job.Id:D2} | {job.Tipo,-26} | {job.ProcessamentoMs}ms");
                await Task.Delay(80, cancellationToken);
            }

            int totalSequencial = Jobs.Sum(j => j.ProcessamentoMs);
            await Send($"  ✓ {Jobs.Length} jobs publicados | Tempo sequencial (1 worker): {totalSequencial}ms");
            await Task.Delay(400, cancellationToken);

            // ── FASE 3: Competing Consumers ────────────────────────────────────
            await Send("");
            await Send($"» Fase 3 — {Workers.Length} workers competindo pela fila (round-robin)...");
            await Task.Delay(200, cancellationToken);

            // Processa em rodadas: cada rodada = 1 mensagem por worker em paralelo
            int totalParalelo  = 0;
            int jobsRestantes  = Jobs.Length;
            int rodada         = 0;

            while (jobsRestantes > 0)
            {
                rodada++;
                var lote = new List<(string Worker, Job Job)>();

                // Cada worker pega 1 mensagem (BasicGet simula o pull; em produção seria push via consumer)
                foreach (var worker in Workers)
                {
                    if (jobsRestantes == 0) break;
                    var result = await channel.BasicGetAsync(queue, autoAck: false, cancellationToken);
                    if (result is null) break;

                    var job = JsonSerializer.Deserialize<Job>(result.Body.Span)!;
                    await channel.BasicAckAsync(result.DeliveryTag, multiple: false, cancellationToken);
                    lote.Add((worker, job));
                    jobsRestantes--;
                }

                // Tempo desta rodada = maior processamento do lote (paralelo)
                int tempoRodada = lote.Max(x => x.Job.ProcessamentoMs);
                totalParalelo += tempoRodada;

                await Send($"  Rodada {rodada} — {tempoRodada}ms (paralelo):");
                foreach (var (worker, job) in lote)
                    await Send($"    {worker} → Job-{job.Id:D2} | {job.Tipo,-26} | {job.ProcessamentoMs}ms");

                // Delay proporcional para visualização (÷10)
                await Task.Delay(tempoRodada / 10, cancellationToken);
                await Send($"    ✓ Rodada {rodada} completa");
                await Task.Delay(150, cancellationToken);
            }

            await Task.Delay(300, cancellationToken);
            double speedup = (double)totalSequencial / totalParalelo;
            await Send("");
            await Send($"  Tempo sequencial  (1 worker):  {totalSequencial}ms");
            await Send($"  Tempo paralelo    (3 workers): {totalParalelo}ms");
            await Send($"  Speedup:  {speedup:F1}x  ({Workers.Length} workers)");
            await Task.Delay(400, cancellationToken);

            // ── FASE 4: Teoria ─────────────────────────────────────────────────
            await Send("");
            await Send("» Competing Consumers — quando usar:");
            await Task.Delay(150, cancellationToken);
            await Send("  ✓ Escalar processamento sem mudar o producer");
            await Send("  ✓ Isolar falhas: worker que crasha não afeta os outros");
            await Send("  ✓ Deploy independente: adicione/remova workers sem downtime");
            await Task.Delay(150, cancellationToken);
            await Send("  Chave: prefetchCount=1 garante que RabbitMQ envie 1 mensagem");
            await Send("         por worker de cada vez — sem acumular mensagens ociosas");
            await Send("  Produção: WorkerApi (studydash-worker) usa exatamente este padrão");

            // ── Limpar ─────────────────────────────────────────────────────────
            await channel.QueueDeleteAsync(queue, cancellationToken: cancellationToken);
            await channel.ExchangeDeleteAsync(exchange, cancellationToken: cancellationToken);

            await Send("");
            await Send("✓ Cada mensagem processada por exatamente 1 worker — garantido pelo broker");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
