using System.Runtime.CompilerServices;

namespace StudyDash.Api.Features.Memory.HeapStack;

/// <summary>
/// Vertical slice: Heap vs Stack demo
/// Route: GET /api/memory/heap-stack/run
/// </summary>
public static class HeapStackFeature
{
    public static void MapHeapStackFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/memory/heap-stack/run", RunAsync)
           .WithTags("Memory");
    }

    private struct PointStruct { public int X; public int Y; }
    private class PointClass  { public int X; public int Y; }

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
            await Send("── Heap vs Stack no .NET ──");
            await Task.Delay(400, cancellationToken);

            // ── 1. Tamanhos de tipos ────────────────────────────────────────────
            await Send("");
            await Send("» Tamanhos em memória (Unsafe.SizeOf<T>)");
            await Task.Delay(200, cancellationToken);
            await Send($"  bool   = {Unsafe.SizeOf<bool>(),2} byte");
            await Send($"  char   = {Unsafe.SizeOf<char>(),2} bytes");
            await Send($"  int    = {Unsafe.SizeOf<int>(),2} bytes");
            await Send($"  long   = {Unsafe.SizeOf<long>(),2} bytes");
            await Send($"  double = {Unsafe.SizeOf<double>(),2} bytes");
            await Send($"  PointStruct(X,Y) = {Unsafe.SizeOf<PointStruct>(),2} bytes  ← struct na stack");
            await Send($"  PointClass(X,Y)  = referência (8 bytes ptr) → objeto no heap");
            await Task.Delay(400, cancellationToken);

            // ── 2. Stack: tipos de valor ────────────────────────────────────────
            await Send("");
            await Send("» Stack — tipos de valor (int, struct)");
            await Task.Delay(200, cancellationToken);
            int a = 10;
            int b = a;               // cópia independente
            b = 99;
            await Send($"  int a = 10;  int b = a;  b = 99;");
            await Send($"  ✓ a={a}  b={b}  →  cópias independentes (valor na stack)");
            await Task.Delay(300, cancellationToken);

            var sp = new PointStruct { X = 1, Y = 2 };
            var sp2 = sp;            // cópia de valor
            sp2.X = 999;
            await Send($"  PointStruct sp={{1,2}};  sp2=sp;  sp2.X=999;");
            await Send($"  ✓ sp.X={sp.X}  sp2.X={sp2.X}  →  struct copiada por valor");
            await Task.Delay(400, cancellationToken);

            // ── 3. Heap: tipos de referência ────────────────────────────────────
            await Send("");
            await Send("» Heap — tipos de referência (class)");
            await Task.Delay(200, cancellationToken);
            var cp1 = new PointClass { X = 1, Y = 2 };
            var cp2 = cp1;           // cópia de referência
            cp2.X = 999;
            await Send($"  PointClass cp1={{1,2}};  cp2=cp1;  cp2.X=999;");
            await Send($"  ✓ cp1.X={cp1.X}  cp2.X={cp2.X}  →  mesma referência no heap!");
            await Task.Delay(400, cancellationToken);

            // ── 4. Boxing / Unboxing ────────────────────────────────────────────
            await Send("");
            await Send("» Boxing e Unboxing");
            await Task.Delay(200, cancellationToken);
            int value = 42;
            object boxed   = value;                   // boxing: stack → heap
            int   unboxed  = (int)boxed;              // unboxing: heap → stack
            await Send($"  int value = {value}  (stack)");
            await Send($"  object boxed = value   →  boxing: cópia para o heap");
            await Send($"  int unboxed = (int)boxed  →  unboxing: cópia de volta para stack");
            await Send($"  ✓ value={value}  unboxed={unboxed}  →  boxing cria nova cópia");
            await Task.Delay(400, cancellationToken);

            // ── 5. Medição de alocação heap ─────────────────────────────────────
            await Send("");
            await Send("» Impacto no heap: 10.000 alocações de class vs struct");
            await Task.Delay(200, cancellationToken);

            GC.Collect(); GC.WaitForPendingFinalizers();
            long beforeClass = GC.GetTotalMemory(true);
            var classes = new PointClass[10_000];
            for (int i = 0; i < 10_000; i++) classes[i] = new PointClass { X = i, Y = i };
            long afterClass = GC.GetTotalMemory(false);

            GC.Collect(); GC.WaitForPendingFinalizers();
            long beforeStruct = GC.GetTotalMemory(true);
            var structs = new PointStruct[10_000];
            for (int i = 0; i < 10_000; i++) structs[i] = new PointStruct { X = i, Y = i };
            long afterStruct = GC.GetTotalMemory(false);

            await Send($"  PointClass[10.000]  →  +{afterClass - beforeClass,7:N0} bytes no heap");
            await Send($"  PointStruct[10.000] →  +{afterStruct - beforeStruct,7:N0} bytes (array contíguo, sem header por item)");
            await Send($"  ✓ Struct: sem object header (≈16 bytes) por instância — menor pressão no GC");

            GC.KeepAlive(classes);
            GC.KeepAlive(structs);

            await Send("");
            await Send("✓ Resumo: stack = rápido, automático, limitado; heap = flexível, gerenciado pelo GC");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
