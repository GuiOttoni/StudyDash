namespace StudyDash.Api.Features.Memory.GarbageCollection;

/// <summary>
/// Vertical slice: Garbage Collection demo
/// Route: GET /api/memory/garbage-collection/run
/// </summary>
public static class GarbageCollectionFeature
{
    public static void MapGarbageCollectionFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/memory/garbage-collection/run", RunAsync)
           .WithTags("Memory")
           .WithSummary("Demo Garbage Collection")
           .WithDescription("Observa o GC em ação via SSE: aloca objetos de curta duração (Gen0), longa duração (Gen1/Gen2), força `GC.Collect()` e exibe contadores de coleta por geração. Demonstra também `WeakReference` e finalização.")
           .Produces<string>(200, "text/event-stream");
    }

    private class ShortLived { public int Value; }

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
            await Send("── Garbage Collection no .NET ──");
            await Task.Delay(400, cancellationToken);

            // ── 1. Estado inicial ───────────────────────────────────────────────
            await Send("");
            await Send("» Estado inicial do GC");
            await Task.Delay(200, cancellationToken);
            await Send($"  GC.MaxGeneration   = {GC.MaxGeneration}  (gerações: Gen0, Gen1, Gen2)");
            await Send($"  Memória gerenciada = {GC.GetTotalMemory(false),10:N0} bytes");
            await Send($"  Coleções Gen0      = {GC.CollectionCount(0)}");
            await Send($"  Coleções Gen1      = {GC.CollectionCount(1)}");
            await Send($"  Coleções Gen2      = {GC.CollectionCount(2)}");
            await Task.Delay(400, cancellationToken);

            // ── 2. Alocação em massa (objetos curta duração → Gen0) ─────────────
            await Send("");
            await Send("» Alocando 200.000 objetos de curta duração...");
            await Task.Delay(200, cancellationToken);

            long memBefore = GC.GetTotalMemory(false);
            int gen0Before = GC.CollectionCount(0);

            for (int i = 0; i < 200_000; i++)
            {
                var _ = new ShortLived { Value = i };
            }

            long memAfter  = GC.GetTotalMemory(false);
            int gen0After  = GC.CollectionCount(0);

            await Send($"  Memória antes:  {memBefore,10:N0} bytes");
            await Send($"  Memória depois: {memAfter,10:N0} bytes");
            await Send($"  ✓ GC Gen0 disparou {gen0After - gen0Before}x durante a alocação (objetos curta duração)");
            await Task.Delay(400, cancellationToken);

            // ── 3. Coleta forçada ───────────────────────────────────────────────
            await Send("");
            await Send("» Forçando GC.Collect() — coleta completa (Gen0 → Gen2)");
            await Task.Delay(200, cancellationToken);

            int g0 = GC.CollectionCount(0), g1 = GC.CollectionCount(1), g2 = GC.CollectionCount(2);
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            await Send($"  Δ Gen0: +{GC.CollectionCount(0) - g0}   Δ Gen1: +{GC.CollectionCount(1) - g1}   Δ Gen2: +{GC.CollectionCount(2) - g2}");
            await Send($"  Memória após coleta: {GC.GetTotalMemory(true),10:N0} bytes");
            await Send($"  ✓ Objetos sem referências foram liberados");
            await Task.Delay(400, cancellationToken);

            // ── 4. Gerações: objetos que sobrevivem sobem de geração ────────────
            await Send("");
            await Send("» Gerações: Gen0 → Gen1 → Gen2");
            await Task.Delay(200, cancellationToken);
            await Send("  Gen0: objetos recém-alocados — coletados com mais frequência");
            await Send("  Gen1: objetos que sobreviveram a uma coleta Gen0");
            await Send("  Gen2: objetos de longa duração (ex: statics, caches)");
            await Send("  ✓ O GC é generacional: prioriza coletas rápidas em Gen0");
            await Task.Delay(400, cancellationToken);

            // ── 5. WeakReference ────────────────────────────────────────────────
            await Send("");
            await Send("» WeakReference — referência que não impede coleta");
            await Task.Delay(200, cancellationToken);

            object? obj = new object();
            var weakRef = new WeakReference(obj);
            await Send($"  weakRef.IsAlive antes de nulificar: {weakRef.IsAlive}");

            obj = null;   // remove a referência forte
            GC.Collect();
            GC.WaitForPendingFinalizers();

            await Send($"  obj = null  →  GC.Collect()");
            await Send($"  weakRef.IsAlive após coleta:        {weakRef.IsAlive}");
            await Send($"  ✓ WeakReference útil para caches: objeto é coletado se não há referências fortes");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send($"✓ GC final — Coleções: Gen0={GC.CollectionCount(0)}  Gen1={GC.CollectionCount(1)}  Gen2={GC.CollectionCount(2)}");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
