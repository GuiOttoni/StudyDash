namespace StudyDash.Api.Features.Principles.Solid;

/// <summary>
/// Vertical slice: SOLID Principles demo
/// Route: GET /api/principles/solid/run
/// </summary>
public static class SolidFeature
{
    public static void MapSolidFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/principles/solid/run", RunAsync)
           .WithTags("Principles");
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
            await Send("Executando demonstração dos 5 Princípios SOLID em C#");
            await Task.Delay(500, cancellationToken);

            // S — Single Responsibility
            await Section("[S] Single Responsibility Principle");
            await Send("  Cada classe deve ter apenas UMA razão para mudar.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Violação: InvoiceService faz tudo");
            await Task.Delay(200, cancellationToken);
            await Send("    → calcula total, salva no banco E envia por email");
            await Send("    → 3 motivos para mudar = 3 responsabilidades");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Solução: separar em classes especializadas");
            await Task.Delay(200, cancellationToken);
            var invoice = new Invoice(Items: 3, UnitPrice: 49.90m);
            await Send($"    Invoice.Calculate()         → total = R$ {invoice.Total:F2}");
            await Task.Delay(200, cancellationToken);
            var printer = new InvoicePrinter();
            await Send($"    InvoicePrinter.Print()      → {printer.Print(invoice)}");
            await Task.Delay(200, cancellationToken);
            var repo = new InvoiceRepository();
            await Send($"    InvoiceRepository.Save()    → {repo.Save(invoice)}");
            await Task.Delay(400, cancellationToken);
            await Send("  ✓ Cada classe tem 1 responsabilidade, 1 razão para mudar");

            // O — Open/Closed
            await Section("[O] Open/Closed Principle");
            await Send("  Classes abertas para extensão, fechadas para modificação.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Violação: AreaCalculator com switch por tipo");
            await Send("    → adicionar Triangle exige modificar a classe existente");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Solução: IShape — novas formas sem tocar no Calculator");
            await Task.Delay(200, cancellationToken);
            IShape[] shapes = [new Circle(5), new Rectangle(4, 6), new Triangle(3, 8)];
            foreach (var shape in shapes)
                await Send($"    {shape.GetType().Name,-12} → área = {shape.Area():F2}");
            await Task.Delay(200, cancellationToken);
            var calc = new AreaCalculator();
            await Send($"    AreaCalculator.Total()      → {calc.TotalArea(shapes):F2}");
            await Send("  ✓ Adicionou Triangle sem modificar AreaCalculator");

            // L — Liskov Substitution
            await Section("[L] Liskov Substitution Principle");
            await Send("  Subclasses devem poder substituir suas classes base.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Violação: Penguin herda Bird.Fly() → lança exceção");
            await Send("    → substitui Bird, mas quebra o comportamento esperado");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Solução: Bird abstrata + interfaces IFlyable / ISwimmable");
            await Task.Delay(200, cancellationToken);
            Bird[] birds = [new Eagle(), new Penguin(), new Duck()];
            foreach (var bird in birds)
                await Send($"    {bird.GetType().Name,-10} → {bird.Describe()}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Cada subtipo pode substituir Bird sem surpresas");

            // I — Interface Segregation
            await Section("[I] Interface Segregation Principle");
            await Send("  Nenhum cliente deve depender de métodos que não usa.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Violação: IWorker com Work() + Eat() + Sleep()");
            await Send("    → Robot implementa IWorker e é forçado a ter Eat() e Sleep()");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Solução: interfaces segregadas IWorkable, IFeedable, IRestable");
            await Task.Delay(200, cancellationToken);
            IWorkable[] workers = [new HumanWorker("Ana"), new RobotWorker("R2-D2")];
            foreach (var w in workers)
            {
                await Send($"    {w.Work()}");
                if (w is IFeedable f) await Send($"    {f.Eat()}");
                if (w is IRestable r) await Send($"    {r.Sleep()}");
            }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Robot não conhece Eat/Sleep, Human implementa os 3");

            // D — Dependency Inversion
            await Section("[D] Dependency Inversion Principle");
            await Send("  Dependa de abstrações, não de implementações concretas.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Violação: OrderService instancia StripePayment diretamente");
            await Send("    → mudar para PayPal exige editar OrderService");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Solução: OrderService depende de IPaymentGateway");
            await Task.Delay(200, cancellationToken);
            IPaymentGateway[] gateways = [new StripeGateway(), new PayPalGateway()];
            foreach (var gw in gateways)
            {
                var orderService = new OrderService(gw);
                await Send($"    {orderService.PlaceOrder(199.90m)}");
                await Task.Delay(150, cancellationToken);
            }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Troca de gateway sem alterar uma linha de OrderService");

            await Send("");
            await Send("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            await Send("✓ SOLID → código flexível, testável e manutenível");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}

// ─── S: Single Responsibility ──────────────────────────────────────────────

record Invoice(int Items, decimal UnitPrice)
{
    public decimal Total => Items * UnitPrice;
}

class InvoicePrinter
{
    public string Print(Invoice inv) => $"Fatura: {inv.Items}x R${inv.UnitPrice:F2} = R${inv.Total:F2}";
}

class InvoiceRepository
{
    public string Save(Invoice inv) => $"Salvo no banco → id={Guid.NewGuid().ToString()[..6]}";
}

// ─── O: Open/Closed ────────────────────────────────────────────────────────

interface IShape { double Area(); }

record Circle(double Radius) : IShape
{
    public double Area() => Math.PI * Radius * Radius;
}

record Rectangle(double Width, double Height) : IShape
{
    public double Area() => Width * Height;
}

record Triangle(double Base, double Height) : IShape
{
    public double Area() => 0.5 * Base * Height;
}

class AreaCalculator
{
    public double TotalArea(IShape[] shapes) => shapes.Sum(s => s.Area());
}

// ─── L: Liskov Substitution ────────────────────────────────────────────────

abstract class Bird { public abstract string Describe(); }

class Eagle : Bird, IFlyable
{
    public override string Describe() => $"voa a {Fly()}m de altitude";
    public double Fly() => 3000;
}

class Penguin : Bird, ISwimmable
{
    public override string Describe() => $"nada a {Swim()} km/h";
    public double Swim() => 25;
}

class Duck : Bird, IFlyable, ISwimmable
{
    public override string Describe() => $"voa + nada (voa:{Fly()}m, nada:{Swim()}km/h)";
    public double Fly() => 500;
    public double Swim() => 8;
}

interface IFlyable { double Fly(); }
interface ISwimmable { double Swim(); }

// ─── I: Interface Segregation ──────────────────────────────────────────────

interface IWorkable { string Work(); }
interface IFeedable { string Eat(); }
interface IRestable { string Sleep(); }

class HumanWorker(string name) : IWorkable, IFeedable, IRestable
{
    public string Work() => $"Human({name}): trabalhando";
    public string Eat() => $"Human({name}): almoçando";
    public string Sleep() => $"Human({name}): dormindo";
}

class RobotWorker(string name) : IWorkable
{
    public string Work() => $"Robot({name}): executando tarefa";
}

// ─── D: Dependency Inversion ───────────────────────────────────────────────

interface IPaymentGateway { string Charge(decimal amount); }

class StripeGateway : IPaymentGateway
{
    public string Charge(decimal amount) => $"Stripe: cobrado R$ {amount:F2} ✓";
}

class PayPalGateway : IPaymentGateway
{
    public string Charge(decimal amount) => $"PayPal: cobrado R$ {amount:F2} ✓";
}

class OrderService(IPaymentGateway gateway)
{
    public string PlaceOrder(decimal total)
    {
        var result = gateway.Charge(total);
        return $"OrderService → {result}";
    }
}
