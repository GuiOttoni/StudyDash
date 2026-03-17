using Microsoft.AspNetCore.Mvc;

namespace StudyDash.Api.Patterns.Builder;

[ApiController]
[Route("api/patterns/builder")]
public class BuilderController : ControllerBase
{
    [HttpGet("run")]
    public async Task Run(CancellationToken cancellationToken)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("X-Accel-Buffering", "no");
        Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string message)
        {
            await Response.WriteAsync($"data: {message}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
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
        catch (OperationCanceledException)
        {
            // Client disconnected — no action needed
        }
    }
}
