using System.Text.Json;

namespace StudyDash.Api.Features.Algorithms.MergeSort;

/// <summary>
/// Vertical slice: Merge Sort algorithm demo with real-time visualization
/// Route: GET /api/algorithms/mergesort/run?size=N  (N: 5–10)
/// </summary>
public static class MergeSortFeature
{
    public static void MapMergeSortFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/algorithms/mergesort/run", RunAsync)
           .WithTags("Algorithms")
           .WithSummary("Demo Merge Sort")
           .WithDescription("Ordena um array aleatório via Merge Sort (divide e conquista) com visualização dos passos de divisão e merge via SSE. Parâmetro `size` define o tamanho do array (5–10, padrão 7).")
           .Produces<string>(200, "text/event-stream");
    }

    private static async Task RunAsync(HttpContext http, int size = 7, CancellationToken cancellationToken = default)
    {
        size = Math.Clamp(size, 5, 10);

        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(object payload)
        {
            var json = JsonSerializer.Serialize(payload);
            await http.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        try
        {
            var rng = new Random();
            var array = Enumerable.Range(0, size).Select(_ => rng.Next(10, 99)).ToArray();
            var sortedIndices = new HashSet<int>();

            await Send(new { type = "log", msg = $"Array inicial: [{string.Join(", ", array)}]" });
            await Send(new { type = "state", array = (int[])array.Clone(), comparing = Array.Empty<int>(), sorted = Array.Empty<int>() });
            await Task.Delay(1000, cancellationToken);

            await SortAsync(array, 0, array.Length - 1, sortedIndices, Send, cancellationToken);

            for (int k = 0; k < array.Length; k++) sortedIndices.Add(k);
            await Send(new { type = "state", array = (int[])array.Clone(), comparing = Array.Empty<int>(), sorted = sortedIndices.ToArray() });
            await Send(new { type = "log", msg = $"✓ Ordenado: [{string.Join(", ", array)}]" });
            await Send(new { type = "done" });
        }
        catch (OperationCanceledException) { }
    }

    private static async Task SortAsync(int[] array, int left, int right, HashSet<int> sortedIndices, Func<object, Task> send, CancellationToken ct)
    {
        if (left < right)
        {
            int mid = left + (right - left) / 2;

            await send(new { type = "log", msg = $"Dividindo: [{left}...{mid}] e [{mid + 1}...{right}]" });
            
            await SortAsync(array, left, mid, sortedIndices, send, ct);
            await SortAsync(array, mid + 1, right, sortedIndices, send, ct);

            await MergeAsync(array, left, mid, right, sortedIndices, send, ct);
        }
    }

    private static async Task MergeAsync(int[] array, int left, int mid, int right, HashSet<int> sortedIndices, Func<object, Task> send, CancellationToken ct)
    {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        int[] L = new int[n1];
        int[] R = new int[n2];

        Array.Copy(array, left, L, 0, n1);
        Array.Copy(array, mid + 1, R, 0, n2);

        await send(new { type = "log", msg = $"Mesclando metades: [{string.Join(", ", L)}] e [{string.Join(", ", R)}]" });

        int i = 0, j = 0;
        int k = left;

        while (i < n1 && j < n2)
        {
            await send(new { type = "state", array = (int[])array.Clone(), comparing = new[] { left + i, mid + 1 + j }, sorted = sortedIndices.ToArray() });
            await Task.Delay(400, ct);

            if (L[i] <= R[j])
            {
                array[k] = L[i];
                i++;
            }
            else
            {
                array[k] = R[j];
                j++;
            }
            k++;
        }

        while (i < n1)
        {
            array[k] = L[i];
            i++;
            k++;
        }

        while (j < n2)
        {
            array[k] = R[j];
            j++;
            k++;
        }

        await send(new { type = "state", array = (int[])array.Clone(), comparing = Array.Empty<int>(), sorted = sortedIndices.ToArray() });
        await Task.Delay(200, ct);
    }
}
