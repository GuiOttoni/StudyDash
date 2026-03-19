using System.Collections.Concurrent;
using System.Diagnostics;

namespace StudyDash.Api.Features.Concurrency.ThreadTask;

/// <summary>
/// Vertical slice: Thread vs Task demo
/// Route: GET /api/concurrency/thread-task/run
/// </summary>
public static class ThreadTaskFeature
{
    public static void MapThreadTaskFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/concurrency/thread-task/run", RunAsync)
           .WithTags("Concurrency")
           .WithSummary("Demo Thread vs Task")
           .WithDescription("Compara `Thread` manual e `Task.Run` via SSE: executa trabalho paralelo com ambas as abordagens, exibe `ManagedThreadId`, timing e demonstra por que `Task` é a escolha preferida no .NET moderno.")
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
            await Send("── Thread vs Task no .NET ──");
            await Task.Delay(400, cancellationToken);

            // ── 1. Thread manual ────────────────────────────────────────────────
            await Send("");
            await Send("» Thread — gerenciamento manual de kernel thread");
            await Task.Delay(200, cancellationToken);

            var sw = Stopwatch.StartNew();
            var threadResult = "";

            var thread = new Thread(() =>
            {
                Thread.Sleep(400);   // simula trabalho
                threadResult = $"Thread#{Thread.CurrentThread.ManagedThreadId} concluída em {sw.ElapsedMilliseconds}ms";
            });

            await Send($"  new Thread(...) criada — ainda não iniciada");
            thread.Start();
            await Send($"  thread.Start() → thread iniciada, bloqueando com thread.Join()...");
            thread.Join();   // aguarda bloqueando a thread do pool
            sw.Stop();
            await Send($"  ✓ {threadResult}");
            await Send($"  Custo: cria uma kernel thread dedicada (~1 MB de stack por padrão)");
            await Task.Delay(400, cancellationToken);

            // ── 2. Task com Task.Run ────────────────────────────────────────────
            await Send("");
            await Send("» Task — trabalho agendado no ThreadPool");
            await Task.Delay(200, cancellationToken);

            sw.Restart();
            var task = Task.Run(async () =>
            {
                await Task.Delay(400, cancellationToken);
                return $"Task em Thread#{Thread.CurrentThread.ManagedThreadId} concluída em {sw.ElapsedMilliseconds}ms";
            }, cancellationToken);

            await Send($"  Task.Run(...) agendado — ThreadPool escolhe a thread");
            var taskResult = await task;
            await Send($"  ✓ {taskResult}");
            await Send($"  Custo: reutiliza threads do pool — muito mais leve que Thread");
            await Task.Delay(400, cancellationToken);

            // ── 3. Comparação: 4 Threads vs 4 Tasks em paralelo ────────────────
            await Send("");
            await Send("» Comparação paralela: 4 Threads vs 4 Tasks (cada uma faz 300ms de trabalho)");
            await Task.Delay(200, cancellationToken);

            // 4 Threads
            var threadResults = new ConcurrentBag<string>();
            var threads = Enumerable.Range(1, 4).Select(i => new Thread(() =>
            {
                Thread.Sleep(300);
                threadResults.Add($"T{i}→Thread#{Thread.CurrentThread.ManagedThreadId}");
            })).ToList();

            sw.Restart();
            threads.ForEach(t => t.Start());
            threads.ForEach(t => t.Join());
            var threadMs = sw.ElapsedMilliseconds;
            await Send($"  4 Threads: {threadMs}ms  [{string.Join(", ", threadResults.OrderBy(x => x))}]");

            // 4 Tasks
            sw.Restart();
            var taskResults = await Task.WhenAll(Enumerable.Range(1, 4).Select(async i =>
            {
                await Task.Delay(300, cancellationToken);
                return $"T{i}→Thread#{Thread.CurrentThread.ManagedThreadId}";
            }));
            var taskMs = sw.ElapsedMilliseconds;
            await Send($"  4 Tasks:   {taskMs}ms  [{string.Join(", ", taskResults)}]");
            await Task.Delay(300, cancellationToken);

            // ── 4. Diferenças conceituais ───────────────────────────────────────
            await Send("");
            await Send("» Quando usar cada um?");
            await Send("  Thread  →  trabalho CPU-intenso de longa duração, controle fino de prioridade");
            await Send("  Task    →  I/O assíncrono, paralelismo de alto nível, código moderno (async/await)");
            await Send("  ✓ Regra geral: prefira Task — o ThreadPool gerencia tudo automaticamente");

            await Send("");
            await Send("✓ Task é a abstração moderna: leve, componível e integrada com async/await");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
