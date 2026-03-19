namespace StudyDash.Api.Features.Patterns.Builder;

/// <summary>
/// Vertical slice: Builder Pattern demo
/// Route: GET /api/patterns/builder/run
/// </summary>
public static class BuilderFeature
{
    public static void MapBuilderFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/patterns/builder/run", RunAsync)
           .WithTags("Patterns")
           .WithSummary("Demo Builder Pattern")
           .WithDescription("Executa o Builder Pattern via SSE: constrói um computador gamer passo a passo usando Director + ConcreteBuilder, demonstrando separação entre construção e representação. Stream encerra com `data: [DONE]`.")
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
            var computerBuilder = new GamingComputerBuilder();
            var director = new ComputerDirector(computerBuilder);

            await Send("[Director] Iniciando construção do Gaming Computer...");
            await Task.Delay(400, cancellationToken);

            await director.BuildStep_CPU(Send, cancellationToken);
            await director.BuildStep_GPU(Send, cancellationToken);
            await director.BuildStep_RAM(Send, cancellationToken);
            await director.BuildStep_Storage(Send, cancellationToken);
            await director.BuildStep_OS(Send, cancellationToken);

            var computer = computerBuilder.Build();
            await Task.Delay(300, cancellationToken);
            await Send($"[Produto] Build finalizado! {computer.Describe()}");
            await Task.Delay(200, cancellationToken);
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
