using System.Text.Json;

namespace StudyDash.Api.Features.Algorithms.BubbleSort;

/// <summary>
/// Vertical slice: Bubble Sort algorithm demo with real-time visualization
/// Route: GET /api/algorithms/bubblesort/run?size=N  (N: 5–10)
/// </summary>
public static class BubbleSortFeature
{
    public static void MapBubbleSortFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/algorithms/bubblesort/run", RunAsync)
           .WithTags("Algorithms");
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
            await Task.Delay(600, cancellationToken);

            int n = array.Length;
            int totalSwaps = 0;
            int totalComparisons = 0;

            for (int pass = 0; pass < n - 1; pass++)
            {
                await Send(new { type = "log", msg = $"── Pass {pass + 1} / {n - 1} ──" });
                bool swappedInPass = false;

                for (int i = 0; i < n - 1 - pass; i++)
                {
                    totalComparisons++;

                    await Send(new { type = "state", array = (int[])array.Clone(), comparing = new[] { i, i + 1 }, sorted = sortedIndices.ToArray() });
                    await Task.Delay(220, cancellationToken);

                    if (array[i] > array[i + 1])
                    {
                        await Send(new { type = "log", msg = $"  [{i}]={array[i]} > [{i + 1}]={array[i + 1]} → troca!" });
                        (array[i], array[i + 1]) = (array[i + 1], array[i]);
                        totalSwaps++;
                        swappedInPass = true;

                        await Send(new { type = "state", array = (int[])array.Clone(), comparing = new[] { i, i + 1 }, sorted = sortedIndices.ToArray() });
                        await Task.Delay(180, cancellationToken);
                    }
                    else
                    {
                        await Send(new { type = "log", msg = $"  [{i}]={array[i]} ≤ [{i + 1}]={array[i + 1]} → ok" });
                    }
                }

                sortedIndices.Add(n - 1 - pass);
                await Send(new { type = "state", array = (int[])array.Clone(), comparing = Array.Empty<int>(), sorted = sortedIndices.ToArray() });
                await Task.Delay(150, cancellationToken);

                if (!swappedInPass)
                {
                    for (int k = 0; k <= n - 1 - pass; k++) sortedIndices.Add(k);
                    await Send(new { type = "log", msg = "  Nenhuma troca neste pass → early exit!" });
                    break;
                }
            }

            for (int k = 0; k < n; k++) sortedIndices.Add(k);
            await Send(new { type = "state", array = (int[])array.Clone(), comparing = Array.Empty<int>(), sorted = sortedIndices.ToArray() });
            await Task.Delay(300, cancellationToken);
            await Send(new { type = "log", msg = $"✓ Ordenado: [{string.Join(", ", array)}]" });
            await Send(new { type = "log", msg = $"  Comparações: {totalComparisons}  |  Trocas: {totalSwaps}  |  Complexidade: O(n²)" });
            await Send(new { type = "done" });
        }
        catch (OperationCanceledException) { }
    }
}
