namespace StudyDash.Api.Features.Principles.Grasp;

/// <summary>
/// Vertical slice: 9 Princípios GRASP demo
/// Route: GET /api/principles/grasp/run
/// </summary>
public static class GraspFeature
{
    public static void MapGraspFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/principles/grasp/run", RunAsync)
           .WithTags("Principles")
           .WithSummary("Demo Princípios GRASP")
           .WithDescription("Demonstra os 9 princípios GRASP de Craig Larman via SSE: Information Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection e Protected Variations.")
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

        async Task Section(string title)
        {
            await Send("");
            await Send($"━━━ {title} ━━━");
            await Task.Delay(300, cancellationToken);
        }

        try
        {
            await Send("Demonstrando os 9 Princípios GRASP em C# (Craig Larman)");
            await Task.Delay(500, cancellationToken);

            // ─── 1. Information Expert ────────────────────────────────────────────
            await Section("[IE] Information Expert");
            await Send("  Atribua a responsabilidade à classe que tem a informação necessária.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ PaymentService calcula o total da Invoice — sabe demais sobre estrutura alheia");
            await Send("  ✓ Invoice tem os itens, logo Invoice.Total() é o Expert");
            await Task.Delay(200, cancellationToken);

            var inv = new GraspInvoice();
            inv.Add(new GraspLine("Livro C#",  89.90m, 2));
            inv.Add(new GraspLine("Mouse",    149.50m, 1));
            inv.Add(new GraspLine("Teclado",  249.00m, 1));
            foreach (var l in inv.Lines)
                await Send($"    {l}");
            await Task.Delay(200, cancellationToken);
            await Send($"    Invoice.Total() → R$ {inv.Total():F2}  ← quem tem os dados calcula");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ A classe com a informação é responsável por processá-la");

            // ─── 2. Creator ────────────────────────────────────────────────────────
            await Section("[Cr] Creator");
            await Send("  B deve criar A se B agrega, contém ou registra instâncias de A.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ Código externo cria OrderLine e injeta sem validação alguma");
            await Send("  ✓ Order agrega OrderLine → Order cria, valida e controla suas linhas");
            await Task.Delay(200, cancellationToken);

            var order = new GraspOrder();
            order.AddLine("Notebook",   2999.90m, 1);
            order.AddLine("Carregador",  199.90m, 2);
            foreach (var l in order.Lines)
                await Send($"    {l}");
            await Task.Delay(200, cancellationToken);
            await Send($"    Order.Total → R$ {order.Total:F2}");
            try   { order.AddLine("", -1m, 0); }
            catch (ArgumentException ex) { await Send($"    Inválido bloqueado: {ex.Message}"); }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Order controla o ciclo de vida de suas próprias linhas");

            // ─── 3. Controller ─────────────────────────────────────────────────────
            await Section("[Ct] Controller");
            await Send("  Use um Controller para receber eventos de sistema e delegar ao domínio.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ Lógica de negócio diretamente no endpoint HTTP — mistura camadas");
            await Send("  ✓ CheckoutController recebe o evento, orquestra e delega; endpoint é fino");
            await Task.Delay(200, cancellationToken);

            var ctrl   = new GraspCheckoutController(new GraspOrderDomainService());
            var result = await ctrl.Checkout(new GraspCartDto("cliente@email.com", inv));
            await Send($"    {result}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Controller não implementa negócio — apenas recebe e delega");

            // ─── 4. Low Coupling ───────────────────────────────────────────────────
            await Section("[LC] Low Coupling");
            await Send("  Minimize dependências entre classes — prefira abstrações.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ OrderService depende de StripePayment e SmtpMailer concretos");
            await Send("  ✓ Depende de IPaymentGateway + IMailSender — trocar é transparente");
            await Task.Delay(200, cancellationToken);

            var svc1 = new GraspLCOrderService(new GraspStripeGateway(), new GraspSmtpSender());
            await Send($"    Stripe + SMTP:      {svc1.Place(199.90m, "a@dev.com")}");
            await Task.Delay(200, cancellationToken);
            var svc2 = new GraspLCOrderService(new GraspPayPalGateway(), new GraspSendGridSender());
            await Send($"    PayPal + SendGrid:  {svc2.Place(350.00m, "b@dev.com")}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Zero mudanças em GraspLCOrderService para trocar gateway ou mailer");

            // ─── 5. High Cohesion ──────────────────────────────────────────────────
            await Section("[HC] High Cohesion");
            await Send("  Cada classe deve ter responsabilidades relacionadas e bem focadas.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ OrderGod: calcular + persistir + notificar + gerar PDF + validar estoque");
            await Send("    → 5 responsabilidades = 5 razões para mudar = baixa coesão");
            await Task.Delay(400, cancellationToken);
            await Send("  ✓ Classes coesas — cada uma com 1 responsabilidade clara:");
            await Task.Delay(200, cancellationToken);

            var calc   = new GraspPriceCalculator();
            await Send($"    PriceCalculator:   {calc.Calculate([89.90m, 149.50m], [2, 1])}");
            await Task.Delay(150, cancellationToken);
            var oRepo  = new GraspOrderRepo();
            await Send($"    OrderRepository:   {oRepo.Save(order)}");
            await Task.Delay(150, cancellationToken);
            var mailer = new GraspOrderMailer();
            await Send($"    OrderMailer:       {mailer.Confirm("cliente@email.com", order.Total)}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Cada classe muda por apenas 1 razão");

            // ─── 6. Polymorphism ───────────────────────────────────────────────────
            await Section("[Po] Polymorphism");
            await Send("  Use polimorfismo em vez de condicionais para variações por tipo.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ switch por tipo de desconto — adicionar novo tipo = editar código");
            await Send("  ✓ IDiscount — cada tipo encapsula sua própria lógica");
            await Task.Delay(200, cancellationToken);

            IGraspDiscount[] discounts =
            [
                new GraspPercentageDiscount(0.10),
                new GraspFixedDiscount(20m),
                new GraspVipDiscount(),
                new GraspNoDiscount()
            ];
            foreach (var d in discounts)
                await Send($"    {d.Name,-24} R$ 500 → R$ {d.Apply(500m):F2}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Mesmo laço, dispatch automático para cada implementação — zero if/switch");

            // ─── 7. Pure Fabrication ───────────────────────────────────────────────
            await Section("[PF] Pure Fabrication");
            await Send("  Crie classes artificiais coesas para responsabilidades técnicas.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ Product.Save(db) — entidade de domínio acoplada à infraestrutura");
            await Send("  ✓ ProductRepository: fabricação pura que mantém o domínio limpo");
            await Task.Delay(200, cancellationToken);

            var pRepo = new GraspProductRepository();
            var id1   = pRepo.Save(new GraspProduct("Notebook", 2999.90m));
            await Send($"    Save(Notebook R$ 2999,90)  → id={id1[..6]}");
            await Task.Delay(150, cancellationToken);
            var id2   = pRepo.Save(new GraspProduct("Mouse", 149.50m));
            await Send($"    Save(Mouse R$ 149,50)       → id={id2[..6]}");
            await Task.Delay(150, cancellationToken);
            var found = pRepo.Find(id1);
            await Send($"    Find({id1[..6]})         → {found?.Name} R$ {found?.Price:F2}");
            await Send($"    Repository.Count           → {pRepo.Count} produtos");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Product é domínio puro; Repository é a fabricação que isola persistência");

            // ─── 8. Indirection ────────────────────────────────────────────────────
            await Section("[In] Indirection");
            await Send("  Use um intermediário para evitar acoplamento direto entre classes.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ PaymentService conhece StockService, MailService, AuditService diretamente");
            await Send("  ✓ EventBus medeia Publisher e Subscribers — nenhum se conhece");
            await Task.Delay(200, cancellationToken);

            var bus = new GraspEventBus();
            bus.Subscribe(e => $"  [Stock]  reserva estoque — {e}");
            bus.Subscribe(e => $"  [Mail]   envia confirmação — {e}");
            bus.Subscribe(e => $"  [Audit]  registra auditoria — {e}");
            foreach (var output in bus.Publish("OrderPaid:42:R$ 199,90"))
                await Send(output);
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Publisher só conhece o bus; handlers são independentes entre si");

            // ─── 9. Protected Variations ───────────────────────────────────────────
            await Section("[PV] Protected Variations");
            await Send("  Identifique pontos de variação e proteja com interfaces estáveis.");
            await Task.Delay(300, cancellationToken);
            await Send("  ✗ ReportService usa File.WriteAllBytes — migrar para S3 exige editar tudo");
            await Send("  ✓ IStorageProvider: ponto estável de variação; ReportService nunca muda");
            await Task.Delay(200, cancellationToken);

            IGraspStorageProvider[] providers = [new GraspLocalStorage(), new GraspS3Storage("meu-bucket")];
            foreach (var p in providers)
            {
                var report = new GraspReportService(p);
                await Send($"    {report.Export("relatorio.pdf", 2_400)}");
                await Task.Delay(150, cancellationToken);
            }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Trocar provedor = trocar injeção; ReportService fica intocado");

            await Send("");
            await Send("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            await Send("✓ IE · Cr · Ct · LC · HC · Po · PF · In · PV");
            await Send("✓ GRASP → responsabilidades bem atribuídas = design coeso e manutenível");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}

// ─── IE: Information Expert ───────────────────────────────────────────────────

record GraspLine(string Name, decimal Price, int Qty)
{
    public decimal Subtotal => Price * Qty;
    public override string ToString() => $"{Name,-18} {Qty}x R$ {Price:F2} = R$ {Subtotal:F2}";
}

class GraspInvoice
{
    public List<GraspLine> Lines { get; } = [];
    public void    Add(GraspLine l) => Lines.Add(l);
    public decimal Total()          => Lines.Sum(l => l.Subtotal);
}

// ─── Cr: Creator ──────────────────────────────────────────────────────────────

class GraspOrder
{
    private readonly List<GraspLine> _lines = [];
    public IReadOnlyList<GraspLine> Lines => _lines;
    public decimal Total => _lines.Sum(l => l.Subtotal);

    public void AddLine(string name, decimal price, int qty)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome inválido");
        if (price <= 0) throw new ArgumentException($"Preço inválido: {price}");
        if (qty   <= 0) throw new ArgumentException($"Quantidade inválida: {qty}");
        _lines.Add(new GraspLine(name, price, qty));
    }
}

// ─── Ct: Controller ───────────────────────────────────────────────────────────

record GraspCartDto(string Email, GraspInvoice Invoice);

class GraspOrderDomainService
{
    public async Task<string> Process(GraspCartDto dto)
    {
        await Task.Delay(100);
        var id = Guid.NewGuid().ToString()[..6];
        return $"[OrderService] Pedido #{id} | R$ {dto.Invoice.Total():F2} → {dto.Email} ✓";
    }
}

class GraspCheckoutController(GraspOrderDomainService orderSvc)
{
    public async Task<string> Checkout(GraspCartDto dto) =>
        $"[Controller] {await orderSvc.Process(dto)}";
}

// ─── LC: Low Coupling ─────────────────────────────────────────────────────────

interface IGraspPaymentGateway { string Charge(decimal amount); }
interface IGraspMailSender     { string Send(string to, string body); }

class GraspStripeGateway  : IGraspPaymentGateway { public string Charge(decimal a) => $"Stripe: R$ {a:F2} ✓"; }
class GraspPayPalGateway  : IGraspPaymentGateway { public string Charge(decimal a) => $"PayPal: R$ {a:F2} ✓"; }
class GraspSmtpSender     : IGraspMailSender     { public string Send(string to, string _) => $"SMTP→{to} ✓"; }
class GraspSendGridSender : IGraspMailSender     { public string Send(string to, string _) => $"SendGrid→{to} ✓"; }

class GraspLCOrderService(IGraspPaymentGateway payment, IGraspMailSender mail)
{
    public string Place(decimal total, string email) =>
        $"{payment.Charge(total)} | {mail.Send(email, "Confirmado!")}";
}

// ─── HC: High Cohesion ────────────────────────────────────────────────────────

class GraspPriceCalculator
{
    public string Calculate(decimal[] prices, int[] qtys)
    {
        var total = prices.Zip(qtys, (p, q) => p * q).Sum();
        return $"total = R$ {total:F2}";
    }
}

class GraspOrderRepo
{
    public string Save(GraspOrder o) =>
        $"salvo pedido #{Guid.NewGuid().ToString()[..4]} (R$ {o.Total:F2})";
}

class GraspOrderMailer
{
    public string Confirm(string email, decimal total) =>
        $"email enviado para {email} (R$ {total:F2})";
}

// ─── Po: Polymorphism ─────────────────────────────────────────────────────────

interface IGraspDiscount { string Name { get; } decimal Apply(decimal total); }

record GraspPercentageDiscount(double Rate) : IGraspDiscount
{
    public string  Name             => $"Desconto {Rate * 100:F0}%";
    public decimal Apply(decimal t) => t * (1 - (decimal)Rate);
}

record GraspFixedDiscount(decimal Amount) : IGraspDiscount
{
    public string  Name             => $"Desconto fixo R$ {Amount:F2}";
    public decimal Apply(decimal t) => Math.Max(0, t - Amount);
}

record GraspVipDiscount() : IGraspDiscount
{
    public string  Name             => "VIP 25%";
    public decimal Apply(decimal t) => t * 0.75m;
}

record GraspNoDiscount() : IGraspDiscount
{
    public string  Name             => "Sem desconto";
    public decimal Apply(decimal t) => t;
}

// ─── PF: Pure Fabrication ─────────────────────────────────────────────────────

record GraspProduct(string Name, decimal Price);

class GraspProductRepository
{
    private readonly Dictionary<string, GraspProduct> _store = [];
    public string         Save(GraspProduct p) { var id = Guid.NewGuid().ToString(); _store[id] = p; return id; }
    public GraspProduct?  Find(string id)       => _store.GetValueOrDefault(id);
    public int            Count                 => _store.Count;
}

// ─── In: Indirection ─────────────────────────────────────────────────────────

class GraspEventBus
{
    private readonly List<Func<string, string>> _handlers = [];
    public void              Subscribe(Func<string, string> h) => _handlers.Add(h);
    public IEnumerable<string> Publish(string @event)          => _handlers.Select(h => h(@event));
}

// ─── PV: Protected Variations ─────────────────────────────────────────────────

interface IGraspStorageProvider { string Save(string name, int bytes); }

class GraspLocalStorage : IGraspStorageProvider
{
    public string Save(string name, int bytes) =>
        $"[Local] '{name}' ({bytes:N0} B) → C:\\Storage\\{name}";
}

class GraspS3Storage(string bucket) : IGraspStorageProvider
{
    public string Save(string name, int bytes) =>
        $"[S3]    '{name}' ({bytes:N0} B) → s3://{bucket}/{name}";
}

class GraspReportService(IGraspStorageProvider storage)
{
    public string Export(string name, int sizeBytes) => storage.Save(name, sizeBytes);
}
