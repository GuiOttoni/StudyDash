using System.Runtime.CompilerServices;

namespace StudyDash.Api.Features.Memory.RecordClassStruct;

/// <summary>
/// Vertical slice: Record vs Class vs Struct demo
/// Route: GET /api/memory/record-class-struct/run
/// </summary>
public static class RecordClassStructFeature
{
    public static void MapRecordClassStructFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/memory/record-class-struct/run", RunAsync)
           .WithTags("Memory")
           .WithSummary("Demo Record vs Class vs Struct")
           .WithDescription("Compara semântica de igualdade, cópia e alocação de memória entre `record`, `class` e `struct` via SSE. Mede alocações reais com `GC.GetTotalMemory()` e demonstra as diferenças comportamentais de cada tipo.")
           .Produces<string>(200, "text/event-stream");
    }

    private record  PointRecord(int X, int Y);
    private class   PointClass  { public int X; public int Y; public PointClass(int x, int y) { X = x; Y = y; } }
    private struct  PointStruct { public int X; public int Y; public PointStruct(int x, int y) { X = x; Y = y; } }

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
            await Send("── Record vs Class vs Struct no .NET ──");
            await Task.Delay(400, cancellationToken);

            // ── 1. Tamanhos ─────────────────────────────────────────────────────
            await Send("");
            await Send("» Tamanho em memória");
            await Task.Delay(200, cancellationToken);
            await Send($"  Struct  → Unsafe.SizeOf<PointStruct>() = {Unsafe.SizeOf<PointStruct>()} bytes  (stack, sem overhead)");
            await Send( "  Class   → referência 8 bytes + object header ≈ 24 bytes no heap");
            await Send( "  Record  → igual à Class (é uma class com geração automática de membros)");
            await Task.Delay(400, cancellationToken);

            // ── 2. Igualdade ────────────────────────────────────────────────────
            await Send("");
            await Send("» Semântica de igualdade");
            await Task.Delay(200, cancellationToken);

            var s1 = new PointStruct(1, 2); var s2 = new PointStruct(1, 2);
            await Send($"  Struct:  s1=(1,2)  s2=(1,2)  →  s1.Equals(s2) = {s1.Equals(s2)}  (compara valores)");

            var r1 = new PointRecord(1, 2); var r2 = new PointRecord(1, 2);
            await Send($"  Record:  r1=(1,2)  r2=(1,2)  →  r1 == r2      = {r1 == r2}  (Equals gerado pelo compilador)");

            var c1 = new PointClass(1, 2); var c2 = new PointClass(1, 2);
            await Send($"  Class:   c1=(1,2)  c2=(1,2)  →  c1 == c2      = {c1 == c2}  (compara referência — objetos diferentes!)");
            await Task.Delay(400, cancellationToken);

            // ── 3. Semântica de cópia ────────────────────────────────────────────
            await Send("");
            await Send("» Semântica de cópia");
            await Task.Delay(200, cancellationToken);

            var sOrig = new PointStruct(10, 20);
            var sCopy = sOrig;
            sCopy.X = 999;
            await Send($"  Struct  — sOrig.X={sOrig.X}  sCopy.X={sCopy.X}  →  cópias independentes (valor)");

            var rOrig = new PointRecord(10, 20);
            var rCopy = rOrig with { X = 999 };
            await Send($"  Record  — rOrig.X={rOrig.X}  rCopy.X={rCopy.X}  →  with cria novo objeto (imutável)");

            var cOrig = new PointClass(10, 20);
            var cAlias = cOrig;
            cAlias.X = 999;
            await Send($"  Class   — cOrig.X={cOrig.X}  cAlias.X={cAlias.X}  →  mesma referência! (alias)");
            await Task.Delay(400, cancellationToken);

            // ── 4. Alocação em massa ─────────────────────────────────────────────
            await Send("");
            await Send("» Alocação em massa: 10.000 instâncias cada");
            await Task.Delay(200, cancellationToken);

            GC.Collect(); GC.WaitForPendingFinalizers();
            long b1 = GC.GetTotalMemory(true);
            var classes = new PointClass[10_000];
            for (int i = 0; i < 10_000; i++) classes[i] = new PointClass(i, i);
            long a1 = GC.GetTotalMemory(false);

            GC.Collect(); GC.WaitForPendingFinalizers();
            long b2 = GC.GetTotalMemory(true);
            var records = new PointRecord[10_000];
            for (int i = 0; i < 10_000; i++) records[i] = new PointRecord(i, i);
            long a2 = GC.GetTotalMemory(false);

            GC.Collect(); GC.WaitForPendingFinalizers();
            long b3 = GC.GetTotalMemory(true);
            var structs = new PointStruct[10_000];
            for (int i = 0; i < 10_000; i++) structs[i] = new PointStruct(i, i);
            long a3 = GC.GetTotalMemory(false);

            await Send($"  Class  → +{a1 - b1,8:N0} bytes  (heap: object header por instância)");
            await Send($"  Record → +{a2 - b2,8:N0} bytes  (heap: igual à class)");
            await Send($"  Struct → +{a3 - b3,8:N0} bytes  (array contíguo, sem header por item)");

            GC.KeepAlive(classes); GC.KeepAlive(records); GC.KeepAlive(structs);

            await Send("");
            await Send("✓ Resumo:");
            await Send("  Struct  →  stack / valor / cópia por valor / igualdade por valor");
            await Send("  Class   →  heap / referência / alias / igualdade por referência");
            await Send("  Record  →  heap / referência / with-expression / igualdade por valor (gerada)");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
