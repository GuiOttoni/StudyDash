using Microsoft.AspNetCore.Mvc;

namespace StudyDash.Api.Patterns.Singleton;

[ApiController]
[Route("api/patterns/singleton")]
public class SingletonController : ControllerBase
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
            await Send("── Demonstração do Padrão Singleton ──");
            await Task.Delay(400, cancellationToken);

            // ── Primeira chamada
            await Send("");
            await Send("» Chamada 1: AppLogger.GetInstance() — primeira vez");
            await Task.Delay(300, cancellationToken);
            var logger1 = AppLogger.GetInstance();
            await Send($"  ✓ Instância criada  →  id={logger1.InstanceId}");
            await Task.Delay(300, cancellationToken);

            // ── Segunda chamada (simula outro serviço)
            await Send("");
            await Send("» Chamada 2: AppLogger.GetInstance() — outro serviço");
            await Task.Delay(300, cancellationToken);
            var logger2 = AppLogger.GetInstance();
            await Send($"  ✓ Instância retornada  →  id={logger2.InstanceId}");
            await Task.Delay(200, cancellationToken);
            await Send(object.ReferenceEquals(logger1, logger2)
                ? "  ✓ logger1 == logger2  →  MESMA referência na memória"
                : "  ✗ Instâncias diferentes (bug!)");
            await Task.Delay(400, cancellationToken);

            // ── Terceira chamada (simula mais um serviço)
            await Send("");
            await Send("» Chamada 3: AppLogger.GetInstance() — mais um serviço");
            await Task.Delay(300, cancellationToken);
            var logger3 = AppLogger.GetInstance();
            await Send($"  ✓ Instância retornada  →  id={logger3.InstanceId}");
            await Send(object.ReferenceEquals(logger1, logger3)
                ? "  ✓ logger1 == logger3  →  MESMA referência na memória"
                : "  ✗ Instâncias diferentes (bug!)");
            await Task.Delay(400, cancellationToken);

            // ── Demonstração de estado compartilhado
            await Send("");
            await Send("── Estado compartilhado (todas usam o mesmo contador) ──");
            await Task.Delay(300, cancellationToken);

            await Task.Delay(250, cancellationToken);
            await Send($"  {logger1.Write("UserService: usuário autenticado")}");
            await Task.Delay(250, cancellationToken);
            await Send($"  {logger2.Write("OrderService: pedido #4821 criado")}");
            await Task.Delay(250, cancellationToken);
            await Send($"  {logger3.Write("PaymentService: pagamento aprovado")}");
            await Task.Delay(250, cancellationToken);
            await Send($"  {logger1.Write("UserService: sessão encerrada")}");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send($"✓ Total de logs registrados: {logger1.LogCount}  (contador único, compartilhado)");
            await Send($"  Todas as 3 variáveis apontam para o mesmo objeto  →  id={logger1.InstanceId}");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
