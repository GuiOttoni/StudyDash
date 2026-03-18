namespace StudyDash.Api.Features.CleanCode.DiLifetimes;

public interface ILifetimeService
{
    Guid Id { get; }
}

public class TransientService : ILifetimeService
{
    public Guid Id { get; } = Guid.NewGuid();
}

public class ScopedService : ILifetimeService
{
    public Guid Id { get; } = Guid.NewGuid();
}

public class SingletonService : ILifetimeService
{
    public Guid Id { get; } = Guid.NewGuid();
}

public static class DiLifetimesFeature
{
    public static void MapDiLifetimesFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/algorithms/dilifetimes/run", RunAsync)
           .WithTags("CleanCode");
    }

    private static async Task RunAsync(
        HttpContext http,
        TransientService transient1,
        TransientService transient2,
        ScopedService scoped1,
        ScopedService scoped2,
        SingletonService singleton1,
        SingletonService singleton2,
        CancellationToken ct)
    {
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string msg)
        {
            await http.Response.WriteAsync($"data: {msg}\n\n", ct);
            await http.Response.Body.FlushAsync(ct);
            await Task.Delay(400, ct); 
        }

        try
        {
            await Send("» Iniciando teste de Lifetimes...");
            await Send("");

            await Send("── Transient (Sempre Novo) ──");
            await Send($"» Instância 1: {transient1.Id}");
            await Send($"» Instância 2: {transient2.Id}");
            await Send("» Observe que os IDs são diferentes. Cada injeção cria um novo objeto.");
            await Send("");

            await Send("── Scoped (Mesma Request) ──");
            await Send($"» Instância 1: {scoped1.Id}");
            await Send($"» Instância 2: {scoped2.Id}");
            await Send("» Observe que os IDs são IGUAIS. O objeto é reaproveitado durante a request.");
            await Send("");

            await Send("── Singleton (Sempre o Mesmo) ──");
            await Send($"» Instância 1: {singleton1.Id}");
            await Send($"» Instância 2: {singleton2.Id}");
            await Send("» O ID será o mesmo para todos os usuários, até o app reiniciar.");
            await Send("");

            await Send("✓ Teste concluído com sucesso.");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
