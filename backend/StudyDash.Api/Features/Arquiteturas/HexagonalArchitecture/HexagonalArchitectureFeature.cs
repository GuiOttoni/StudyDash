namespace StudyDash.Api.Features.Arquiteturas.HexagonalArchitecture;

/// <summary>
/// Vertical slice: Hexagonal Architecture (Ports &amp; Adapters) demo
/// Route: GET /api/arquiteturas/hexagonal/run
/// </summary>
public static class HexagonalArchitectureFeature
{
    public static void MapHexagonalArchitectureFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/arquiteturas/hexagonal/run", RunAsync)
           .WithTags("Arquiteturas")
           .WithSummary("Demo Arquitetura Hexagonal")
           .WithDescription("Demonstra Ports & Adapters: domínio define interfaces (ports), adapters conectam infra — swappable sem tocar em lógica de negócio. Compara Hexagonal vs Clean vs Onion Architecture.")
           .Produces<string>(200, "text/event-stream");
    }

    // ── Domain Model (núcleo do hexágono — sem dependências externas) ─────────
    private record Order(Guid Id, string Product, decimal Amount, string Status);

    // ── Outbound Ports (contratos definidos pelo DOMÍNIO, não pela infra) ─────
    private interface IOrderRepository
    {
        Task SaveAsync(Order order);
        Task<Order?> FindByIdAsync(Guid id);
    }

    private interface IPaymentPort
    {
        Task<bool> ChargeAsync(Guid orderId, decimal amount);
    }

    private interface INotificationPort
    {
        Task SendAsync(string recipient, string message);
    }

    // ── Application Service / Use Case ────────────────────────────────────────
    // Depende apenas de ports (interfaces) — NUNCA dos adapters concretos.
    // Composition Root (Program.cs / DI container) decide qual adapter injetar.
    private sealed class PlaceOrderUseCase(
        IOrderRepository repository,
        IPaymentPort payment,
        INotificationPort notification)
    {
        public async Task<Order> ExecuteAsync(string product, decimal amount, string customerEmail)
        {
            var order = new Order(Guid.NewGuid(), product, amount, "Pending");
            await repository.SaveAsync(order);

            var approved = await payment.ChargeAsync(order.Id, amount);
            var finalOrder = order with { Status = approved ? "Confirmed" : "PaymentFailed" };

            await repository.SaveAsync(finalOrder);
            await notification.SendAsync(customerEmail,
                approved
                    ? $"Pedido #{order.Id.ToString()[..8]} confirmado! Produto: {product}"
                    : $"Pedido #{order.Id.ToString()[..8]} recusado. Valor: R$ {amount:F2}");

            return finalOrder;
        }
    }

    // ── Adapters (implementam ports — isolados e substituíveis) ──────────────

    // Adapter de repositório: Dictionary em memória (ideal para testes e demos)
    private sealed class InMemoryOrderAdapter : IOrderRepository
    {
        private readonly Dictionary<Guid, Order> _store = new();
        public Task SaveAsync(Order order)   { _store[order.Id] = order; return Task.CompletedTask; }
        public Task<Order?> FindByIdAsync(Guid id) => Task.FromResult(_store.GetValueOrDefault(id));
    }

    // Adapter de pagamento: simula limite de R$5.000 (poderia ser StripeAdapter, PagarMeAdapter…)
    private sealed class FakePaymentAdapter(List<string> log) : IPaymentPort
    {
        public Task<bool> ChargeAsync(Guid orderId, decimal amount)
        {
            var approved = amount < 5_000m;
            log.Add($"  [FakePaymentAdapter]      #{orderId.ToString()[..8]} R${amount:F2} → {(approved ? "APROVADO ✓" : "NEGADO ✗ (limite R$5.000)")}");
            return Task.FromResult(approved);
        }
    }

    // Adapter alternativo: aprova tudo — demonstra que o Use Case não precisa saber disso
    private sealed class AlwaysApprovePaymentAdapter(List<string> log) : IPaymentPort
    {
        public Task<bool> ChargeAsync(Guid orderId, decimal amount)
        {
            log.Add($"  [AlwaysApproveAdapter]    #{orderId.ToString()[..8]} R${amount:F2} → APROVADO ✓ (sem limite)");
            return Task.FromResult(true);
        }
    }

    // Adapter de notificação: escreve no console (poderia ser SmtpAdapter, SmsAdapter…)
    private sealed class ConsoleNotificationAdapter(List<string> log) : INotificationPort
    {
        public Task SendAsync(string recipient, string message)
        {
            log.Add($"  [ConsoleNotification]     → {recipient}: \"{message}\"");
            return Task.CompletedTask;
        }
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
            await Send("── Arquitetura Hexagonal (Ports & Adapters) ──");
            await Task.Delay(300, cancellationToken);

            // ── Contexto ──────────────────────────────────────────────────────
            await Send("");
            await Send("» Problema: código de negócio acoplado à infraestrutura");
            await Send("  OrderService chama SqlRepository.Save() e SmtpClient.Send() diretamente.");
            await Send("  → Trocar banco exige mudança no serviço de negócio.");
            await Send("  → Testar exige subir banco real ou mocks frágeis e atrelados à impl.");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("» Solução: Ports & Adapters");
            await Send("  Ports   = interfaces declaradas DENTRO do domínio (contrato puro).");
            await Send("  Adapters= implementações FORA do domínio, conectam tecnologias externas.");
            await Send("  Use Case depende só dos ports — nunca dos adapters concretos.");
            await Task.Delay(400, cancellationToken);

            // ── Estrutura ─────────────────────────────────────────────────────
            await Send("");
            await Send("» Estrutura neste exemplo:");
            await Send("  [Domínio]    Order (record), PlaceOrderUseCase");
            await Send("  [Ports]      IOrderRepository · IPaymentPort · INotificationPort");
            await Send("  [Adapters]   InMemoryOrderAdapter · FakePaymentAdapter · ConsoleNotificationAdapter");
            await Task.Delay(400, cancellationToken);

            // ── Demo 1: Pedido aprovado ───────────────────────────────────────
            await Send("");
            await Send("──────────────────────────────────────────────────────────");
            await Send("» DEMO 1 — FakePaymentAdapter (limite < R$5.000) — deve APROVAR");
            await Task.Delay(200, cancellationToken);

            var log1 = new List<string>();
            var uc1 = new PlaceOrderUseCase(
                new InMemoryOrderAdapter(),
                new FakePaymentAdapter(log1),
                new ConsoleNotificationAdapter(log1));

            var o1 = await uc1.ExecuteAsync("Teclado Mecânico", 1_299.90m, "dev@example.com");
            foreach (var l in log1) { await Send(l); await Task.Delay(130, cancellationToken); }
            await Send($"  Status final: {o1.Status}");
            await Task.Delay(400, cancellationToken);

            // ── Demo 2: Pedido negado ─────────────────────────────────────────
            await Send("");
            await Send("──────────────────────────────────────────────────────────");
            await Send("» DEMO 2 — FakePaymentAdapter (limite < R$5.000) — deve NEGAR");
            await Task.Delay(200, cancellationToken);

            var log2 = new List<string>();
            var uc2 = new PlaceOrderUseCase(
                new InMemoryOrderAdapter(),
                new FakePaymentAdapter(log2),
                new ConsoleNotificationAdapter(log2));

            var o2 = await uc2.ExecuteAsync("Workstation Pro", 12_990.00m, "cto@example.com");
            foreach (var l in log2) { await Send(l); await Task.Delay(130, cancellationToken); }
            await Send($"  Status final: {o2.Status}");
            await Task.Delay(400, cancellationToken);

            // ── Demo 3: Swap de adapter ───────────────────────────────────────
            await Send("");
            await Send("──────────────────────────────────────────────────────────");
            await Send("» DEMO 3 — Swap: FakePaymentAdapter → AlwaysApproveAdapter");
            await Send("  Mesmo produto de R$12.990, mas com adapter diferente — UseCase inalterado:");
            await Task.Delay(200, cancellationToken);

            var log3 = new List<string>();
            var uc3 = new PlaceOrderUseCase(
                new InMemoryOrderAdapter(),
                new AlwaysApprovePaymentAdapter(log3), // ← só essa linha mudou
                new ConsoleNotificationAdapter(log3));

            var o3 = await uc3.ExecuteAsync("Workstation Pro", 12_990.00m, "vip@example.com");
            foreach (var l in log3) { await Send(l); await Task.Delay(130, cancellationToken); }
            await Send($"  Status final: {o3.Status}");
            await Send("  ✓ PlaceOrderUseCase não teve nenhuma linha alterada — só o adapter.");
            await Task.Delay(500, cancellationToken);

            // ── Comparação ────────────────────────────────────────────────────
            await Send("");
            await Send("──────────────────────────────────────────────────────────");
            await Send("» Hexagonal vs Clean Architecture vs Onion Architecture");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  HEXAGONAL (Alistair Cockburn, 2005)");
            await Send("    Metáfora: hexágono com dois lados — Driving (entrada) e Driven (saída)");
            await Send("    Conceito central: Ports (interfaces) + Adapters (implementações)");
            await Send("    Foco: isolamento via adapters como mecanismo de integração explícito");
            await Send("    ✓ Clareza sobre quem aciona vs quem é acionado pelo app");
            await Send("    ✓ Adapter swap = testabilidade máxima sem mocks de framework");
            await Send("    ✓ Simétrico — mesmo padrão para entrada (HTTP) e saída (DB, e-mail)");
            await Send("    ✗ Não prescreve organização interna do domínio");
            await Send("    ✗ O nome 'hexagonal' não carrega significado semântico forte");
            await Task.Delay(350, cancellationToken);

            await Send("");
            await Send("  CLEAN ARCHITECTURE (Robert C. Martin, 2012)");
            await Send("    Metáfora: anéis concêntricos — Dependency Rule: deps sempre para dentro");
            await Send("    Camadas: Entities → Use Cases → Interface Adapters → Frameworks & Drivers");
            await Send("    Foco: distinguir Enterprise Business Rules (Entities) de App Rules (UseCases)");
            await Send("    ✓ Organização de camadas muito bem definida e prescritiva");
            await Send("    ✓ Ótimo para grandes equipes — fronteiras claras por camada");
            await Send("    ✗ Overhead estrutural elevado para projetos pequenos ou médios");
            await Send("    ✗ Interface Adapters layer pode ser confusa (controllers + gateways juntos)");
            await Task.Delay(350, cancellationToken);

            await Send("");
            await Send("  ONION ARCHITECTURE (Jeffrey Palermo, 2008)");
            await Send("    Metáfora: cebola — Domain Model no centro absoluto, infra na borda");
            await Send("    Camadas: Domain Model → Domain Services → Application Services → Infra/UI");
            await Send("    Foco: Application Services orquestram Domain Services (DDD-friendly)");
            await Send("    ✓ Excelente fit com Domain-Driven Design e domínios ricos");
            await Send("    ✓ Domain Services isolam regras de negócio complexas");
            await Send("    ✗ Fronteira entre Domain Service e Application Service é subjetiva");
            await Send("    ✗ Mais camadas internas que Hexagonal — maior overhead conceitual");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("» O que as três têm em comum:");
            await Send("  · Dependency Inversion Principle — domínio define interfaces, infra implementa");
            await Send("  · Core/Application isolada de frameworks, UI e banco de dados");
            await Send("  · Testabilidade via substituição de implementações concretas por fakes");
            await Send("  · Evolução independente de cada camada/lado");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» A diferença central do adapter:");
            await Send("  Adapter é uma classe que traduz a linguagem de uma tecnologia externa");
            await Send("  para a linguagem do domínio — sem vazar detalhes da tecnologia para dentro.");
            await Send("  SqlOrderAdapter fala SQL internamente mas expõe Order.SaveAsync() para fora.");
            await Send("  StripePaymentAdapter chama HTTP internamente mas expõe ChargeAsync() para fora.");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("✓ Escolha pela clareza semântica do seu time — todas funcionam bem");
            await Send("  Hexagonal: adapters múltiplos, integração com N sistemas externos");
            await Send("  Clean: grandes equipes, Enterprise com DDD simples");
            await Send("  Onion: DDD rico, muitos Domain Services e aggregates complexos");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
