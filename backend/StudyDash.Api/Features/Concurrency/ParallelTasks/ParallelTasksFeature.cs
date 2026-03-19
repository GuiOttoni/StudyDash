using System.Collections.Concurrent;
using System.Diagnostics;

namespace StudyDash.Api.Features.Concurrency.ParallelTasks;

/// <summary>
/// Vertical slice: Parallel Tasks demo
/// Route: GET /api/concurrency/parallel-tasks/run
/// </summary>
public static class ParallelTasksFeature
{
    public static void MapParallelTasksFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/concurrency/parallel-tasks/run", RunAsync)
           .WithTags("Concurrency")
           .WithSummary("Demo Parallel Tasks")
           .WithDescription("Demonstra `Parallel.For`, `Parallel.ForEach` e `Task.WhenAll` via SSE: executa tarefas em paralelo com baseline sequencial, calcula speedup real e exibe os IDs de thread do ThreadPool.")
           .Produces<string>(200, "text/event-stream");
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
            await Send("── Parallel Tasks em Ação no .NET ──");
            await Task.Delay(400, cancellationToken);

            // ── 1. Baseline sequencial ──────────────────────────────────────────
            await Send("");
            await Send("» Sequencial (baseline) — 4 tarefas de 200ms cada");
            await Task.Delay(200, cancellationToken);

            var sw = Stopwatch.StartNew();
            long seqSum = 0;
            for (int i = 0; i < 4; i++)
            {
                Thread.Sleep(200);
                seqSum += i;
            }
            long seqMs = sw.ElapsedMilliseconds;
            await Send($"  4 × 200ms sequenciais: {seqMs}ms  (soma={seqSum})");
            await Task.Delay(300, cancellationToken);

            // ── 2. Parallel.For ─────────────────────────────────────────────────
            await Send("");
            await Send("» Parallel.For — iterações paralelas");
            await Task.Delay(200, cancellationToken);

            var lockObj   = new object();
            long parSum   = 0;
            var threadIds = new ConcurrentBag<int>();

            sw.Restart();
            Parallel.For(0, 4, i =>
            {
                Thread.Sleep(200);
                lock (lockObj) parSum += i;
                threadIds.Add(Thread.CurrentThread.ManagedThreadId);
            });
            long parForMs = sw.ElapsedMilliseconds;

            await Send($"  Parallel.For(0, 4): {parForMs}ms  (soma={parSum})");
            await Send($"  Threads usadas: [{string.Join(", ", threadIds.Distinct().OrderBy(x => x))}]");
            await Send($"  ✓ Speedup: ~{(double)seqMs / parForMs:F1}x vs sequencial");
            await Task.Delay(300, cancellationToken);

            // ── 3. Parallel.ForEach ─────────────────────────────────────────────
            await Send("");
            await Send("» Parallel.ForEach — iteração paralela sobre coleção");
            await Task.Delay(200, cancellationToken);

            var items     = new[] { "Alpha", "Beta", "Gamma", "Delta" };
            var processed = new ConcurrentBag<string>();

            sw.Restart();
            Parallel.ForEach(items, item =>
            {
                Thread.Sleep(200);
                processed.Add($"{item} → Thread#{Thread.CurrentThread.ManagedThreadId}");
            });
            long parEachMs = sw.ElapsedMilliseconds;

            await Send($"  Parallel.ForEach({items.Length} itens): {parEachMs}ms");
            foreach (var p in processed.OrderBy(x => x))
                await Send($"    ✓ {p}");
            await Task.Delay(300, cancellationToken);

            // ── 4. Task.WhenAll (async) ─────────────────────────────────────────
            await Send("");
            await Send("» Task.WhenAll — versão assíncrona (async/await friendly)");
            await Task.Delay(200, cancellationToken);

            sw.Restart();
            var taskResults = await Task.WhenAll(
                Enumerable.Range(1, 4).Select(async i =>
                {
                    await Task.Delay(200, cancellationToken);
                    return $"Task{i} → Thread#{Thread.CurrentThread.ManagedThreadId}";
                })
            );
            long whenAllMs = sw.ElapsedMilliseconds;

            await Send($"  Task.WhenAll(4 tasks): {whenAllMs}ms");
            foreach (var r in taskResults)
                await Send($"    ✓ {r}");
            await Task.Delay(300, cancellationToken);

            // ── 5. Resumo ───────────────────────────────────────────────────────
            await Send("");
            await Send("» Comparativo de tempo:");
            await Send($"  Sequencial    : {seqMs}ms");
            await Send($"  Parallel.For  : {parForMs}ms  (speedup ~{(double)seqMs / parForMs:F1}x)");
            await Send($"  Parallel.Each : {parEachMs}ms  (speedup ~{(double)seqMs / parEachMs:F1}x)");
            await Send($"  Task.WhenAll  : {whenAllMs}ms  (speedup ~{(double)seqMs / whenAllMs:F1}x)");
            await Send("");
            await Send("» Quando usar cada um?");
            await Send("  Parallel.For/Each  →  trabalho CPU-bound (cálculos intensos)");
            await Send("  Task.WhenAll       →  I/O-bound (HTTP, banco, arquivos) — não bloqueia threads");
            await Send("✓ Paralelismo real depende do número de núcleos disponíveis");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
