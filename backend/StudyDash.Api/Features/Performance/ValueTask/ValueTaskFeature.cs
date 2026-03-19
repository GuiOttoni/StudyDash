using System.Diagnostics;

namespace StudyDash.Api.Features.Performance.ValueTaskDemo;

/// <summary>
/// Vertical slice: ValueTask vs Task demo
/// Route: GET /api/performance/value-task/run
/// </summary>
public static class ValueTaskFeature
{
    public static void MapValueTaskFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/performance/value-task/run", RunAsync)
           .WithTags("Performance")
           .WithSummary("Demo ValueTask vs Task")
           .WithDescription("Demonstra `ValueTask<T>` vs `Task<T>` via SSE: simula um serviço com cache em memória, mede alocações no caminho síncrono (cache hit) e assíncrono (cache miss), e explica quando cada um deve ser usado.")
           .Produces<string>(200, "text/event-stream");
    }

    // ── Simula um serviço com cache em memória ────────────────────────────────
    private static int? _cached = null;

    private static Task<int> GetWithTask(bool cacheHit)
        => cacheHit
            ? Task.FromResult(_cached!.Value)   // aloca Task<int> no heap mesmo sendo sync
            : FetchFromSourceAsync();

    private static ValueTask<int> GetWithValueTask(bool cacheHit)
        => cacheHit
            ? new ValueTask<int>(_cached!.Value) // struct na stack — zero alocação
            : new ValueTask<int>(FetchFromSourceAsync());

    private static async Task<int> FetchFromSourceAsync()
    {
        await Task.Delay(1);
        return 42;
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
            await Send("── ValueTask<T> vs Task<T> ──");
            await Task.Delay(300, cancellationToken);

            // ── Conceito ──────────────────────────────────────────────────────
            await Send("");
            await Send("» O problema com Task<T>");
            await Send("  Task<T> é uma classe — qualquer retorno aloca um objeto no heap.");
            await Send("  Em hot paths com resultado já disponível (cache hit), isso gera");
            await Send("  pressão desnecessária no GC e latência extra.");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("» ValueTask<T> é uma struct — no caminho síncrono, zero alocação.");
            await Send("  Quando o resultado está disponível de imediato, retorna direto na stack.");
            await Send("  No caminho async (I/O real), delega para um Task<T> internamente.");
            await Task.Delay(500, cancellationToken);

            // ── Benchmark: caminho síncrono (cache hit) ───────────────────────
            _cached = 42;
            const int iterations = 50_000;

            await Send("");
            await Send($"» Benchmark — {iterations:N0} chamadas, cache sempre populado (caminho síncrono)");
            await Task.Delay(300, cancellationToken);

            // Task<int> — warm up + medição
            for (int i = 0; i < 1_000; i++) await GetWithTask(true);

            long before = GC.GetAllocatedBytesForCurrentThread();
            var sw = Stopwatch.StartNew();
            for (int i = 0; i < iterations; i++)
                await GetWithTask(cacheHit: true);
            sw.Stop();
            long taskAlloc = GC.GetAllocatedBytesForCurrentThread() - before;
            long taskMs = sw.ElapsedMilliseconds;

            await Send($"  Task<int>      → {taskAlloc,10:N0} bytes alocados  |  {taskMs}ms");
            await Task.Delay(200, cancellationToken);

            // ValueTask<int> — warm up + medição
            for (int i = 0; i < 1_000; i++) await GetWithValueTask(true);

            before = GC.GetAllocatedBytesForCurrentThread();
            sw.Restart();
            for (int i = 0; i < iterations; i++)
                await GetWithValueTask(cacheHit: true);
            sw.Stop();
            long valueTaskAlloc = GC.GetAllocatedBytesForCurrentThread() - before;
            long valueTaskMs = sw.ElapsedMilliseconds;

            await Send($"  ValueTask<int> → {valueTaskAlloc,10:N0} bytes alocados  |  {valueTaskMs}ms");
            await Task.Delay(300, cancellationToken);

            if (taskAlloc > 0)
            {
                double reduction = (1.0 - (double)valueTaskAlloc / taskAlloc) * 100.0;
                await Send($"  → ValueTask reduziu {reduction:F0}% das alocações no caminho síncrono");
            }
            await Task.Delay(400, cancellationToken);

            // ── Benchmark: caminho assíncrono (cache miss) ────────────────────
            const int asyncIter = 200;

            await Send("");
            await Send($"» Benchmark — {asyncIter} chamadas com await real (cache miss, I/O simulado)");
            await Task.Delay(200, cancellationToken);

            before = GC.GetAllocatedBytesForCurrentThread();
            sw.Restart();
            for (int i = 0; i < asyncIter; i++)
                await GetWithTask(cacheHit: false);
            sw.Stop();
            long taskAllocAsync = GC.GetAllocatedBytesForCurrentThread() - before;

            await Send($"  Task<int>      → {taskAllocAsync,8:N0} bytes  |  {sw.ElapsedMilliseconds}ms");

            before = GC.GetAllocatedBytesForCurrentThread();
            sw.Restart();
            for (int i = 0; i < asyncIter; i++)
                await GetWithValueTask(cacheHit: false);
            sw.Stop();
            long valueTaskAllocAsync = GC.GetAllocatedBytesForCurrentThread() - before;

            await Send($"  ValueTask<int> → {valueTaskAllocAsync,8:N0} bytes  |  {sw.ElapsedMilliseconds}ms");
            await Send("  → No caminho async, alocações são similares (ambos precisam de Task internamente)");
            await Task.Delay(400, cancellationToken);

            // ── Armadilhas ────────────────────────────────────────────────────
            await Send("");
            await Send("» Armadilhas do ValueTask — nunca faça isso:");
            await Task.Delay(200, cancellationToken);
            await Send("  ✗  var vt = GetWithValueTask(true);");
            await Send("     await vt;   // OK");
            await Send("     await vt;   // ERRO: ValueTask não pode ser aguardado duas vezes");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗  Não guarde ValueTask em campo/variável para usar depois");
            await Send("  ✗  Não use em Task.WhenAll() sem .AsTask() primeiro");
            await Task.Delay(300, cancellationToken);
            await Send("  ✓  Precisa de múltiplos awaits? Converta: var t = vt.AsTask();");
            await Task.Delay(400, cancellationToken);

            // ── Quando usar cada um ────────────────────────────────────────────
            await Send("");
            await Send("» Quando usar cada um?");
            await Send("  Task<T>      → padrão para I/O bound; composição com WhenAll/WhenAny; API pública");
            await Send("  ValueTask<T> → hot paths com resultado frequentemente síncrono (cache, buffer cheio)");
            await Send("  ValueTask    → interfaces de alto nível: IValueTaskSource, Socket, PipeReader");
            await Send("  Regra prática: não otimize prematuramente — meça antes de trocar Task por ValueTask");

            await Send("");
            await Send("✓ ValueTask<T> é uma micro-otimização cirúrgica: impacto real só em hot paths medidos");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
