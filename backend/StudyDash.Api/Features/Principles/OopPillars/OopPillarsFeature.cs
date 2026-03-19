namespace StudyDash.Api.Features.Principles.OopPillars;

/// <summary>
/// Vertical slice: 4 Pilares da POO demo
/// Route: GET /api/principles/oop-pillars/run
/// </summary>
public static class OopPillarsFeature
{
    public static void MapOopPillarsFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/principles/oop-pillars/run", RunAsync)
           .WithTags("Principles")
           .WithSummary("Demo 4 Pilares da POO")
           .WithDescription("Demonstra os 4 pilares da Programação Orientada a Objetos via SSE: Encapsulamento, Abstração, Herança e Polimorfismo — com exemplos práticos em C#.")
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
            await Send("Demonstrando os 4 Pilares da Programação Orientada a Objetos em C#");
            await Task.Delay(500, cancellationToken);

            // ─── 1. Encapsulamento ────────────────────────────────────────────────
            await Section("[1] Encapsulamento");
            await Send("  Protege o estado interno — acesso controlado via métodos públicos.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Sem encapsulamento: campo público, qualquer um pode corromper o estado");
            await Send("    balance = -99999; // sem validação alguma!");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Com encapsulamento: BankAccount protege _balance");
            await Task.Delay(200, cancellationToken);

            var account = new BankAccount("Ana");
            await Send($"    {account.Deposit(1000)}");
            await Task.Delay(150, cancellationToken);
            await Send($"    {account.Deposit(500)}");
            await Task.Delay(150, cancellationToken);
            await Send($"    {account.Withdraw(250)}");
            await Task.Delay(150, cancellationToken);
            await Send($"    {account.Withdraw(5000)}");
            await Task.Delay(150, cancellationToken);
            await Send($"    Saldo final: R$ {account.Balance:F2}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Estado interno protegido — invariantes sempre garantidos");

            // ─── 2. Abstração ─────────────────────────────────────────────────────
            await Section("[2] Abstração");
            await Send("  Esconde a complexidade — o cliente usa o 'o quê', não o 'como'.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Sem abstração: cliente conhece cada fórmula");
            await Send("    area = 3.14159 * r * r; // cliente sabe demais");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Com abstração: Shape.Area() — implementação invisível");
            await Task.Delay(200, cancellationToken);

            AbstractShape[] shapes = [
                new OopCircle(5),
                new OopRectangle(4, 6),
                new OopTriangle(3, 8)
            ];

            foreach (var shape in shapes)
            {
                await Send($"    {shape}");
                await Task.Delay(200, cancellationToken);
            }
            await Send($"    Área total: {shapes.Sum(s => s.Area()):F2}");
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Cliente chama Area() sem saber nada da fórmula usada");

            // ─── 3. Herança ───────────────────────────────────────────────────────
            await Section("[3] Herança");
            await Send("  Reutiliza e estende comportamentos — evita duplicação de código.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Sem herança: Brand/Year duplicados em Car, Truck, Motorcycle");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Com herança: Vehicle define o que é comum, filhos especializam");
            await Task.Delay(200, cancellationToken);

            OopVehicle[] fleet = [
                new OopCar("Toyota Corolla", 2024, 4),
                new OopMotorcycle("Honda CB 500", 2023),
                new OopTruck("Volvo FH", 2022, 18)
            ];

            foreach (var vehicle in fleet)
            {
                await Send($"    {vehicle.Start()}");
                await Task.Delay(200, cancellationToken);
            }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Lógica comum em Vehicle; filhos apenas especializam");

            // ─── 4. Polimorfismo ──────────────────────────────────────────────────
            await Section("[4] Polimorfismo");
            await Send("  Mesma interface, comportamentos distintos em tempo de execução.");
            await Task.Delay(300, cancellationToken);
            await Send("");
            await Send("  ✗ Sem polimorfismo: if/switch por tipo — não escala");
            await Send("    if (type == \"Dog\") ... else if (type == \"Cat\") ...");
            await Task.Delay(400, cancellationToken);
            await Send("");
            await Send("  ✓ Com polimorfismo: mesma chamada a.Sound() → comportamento diferente");
            await Task.Delay(200, cancellationToken);

            OopAnimal[] animals = [
                new OopDog("Rex"),
                new OopCat("Mimi"),
                new OopCow("Mimosa"),
                new OopDog("Buddy")
            ];

            foreach (var animal in animals)
            {
                await Send($"    {animal}");
                await Task.Delay(200, cancellationToken);
            }
            await Task.Delay(200, cancellationToken);
            await Send("  ✓ Mesmo laço, mesma chamada — 4 comportamentos distintos em runtime");

            await Send("");
            await Send("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            await Send("✓ Encapsulamento · Abstração · Herança · Polimorfismo");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}

// ─── 1: Encapsulamento ─────────────────────────────────────────────────────

class BankAccount(string owner)
{
    private decimal _balance;

    public string Deposit(decimal amount)
    {
        if (amount <= 0) return $"[{owner}] Depósito inválido: R$ {amount:F2}";
        _balance += amount;
        return $"[{owner}] Depósito R$ {amount:F2} → saldo R$ {_balance:F2}";
    }

    public string Withdraw(decimal amount)
    {
        if (amount > _balance)
            return $"[{owner}] Saque negado: R$ {amount:F2} > saldo R$ {_balance:F2}";
        _balance -= amount;
        return $"[{owner}] Saque R$ {amount:F2} → saldo R$ {_balance:F2}";
    }

    public decimal Balance => _balance;
}

// ─── 2: Abstração ──────────────────────────────────────────────────────────

abstract class AbstractShape
{
    public abstract string Name { get; }
    public abstract double Area();
    public override string ToString() => $"{Name,-12} → área = {Area():F2}";
}

class OopCircle(double radius) : AbstractShape
{
    public override string Name => "Círculo";
    public override double Area() => Math.PI * radius * radius;
}

class OopRectangle(double w, double h) : AbstractShape
{
    public override string Name => "Retângulo";
    public override double Area() => w * h;
}

class OopTriangle(double b, double h) : AbstractShape
{
    public override string Name => "Triângulo";
    public override double Area() => 0.5 * b * h;
}

// ─── 3: Herança ────────────────────────────────────────────────────────────

abstract class OopVehicle(string model, int year)
{
    public string Model { get; } = model;
    public int Year { get; } = year;
    public abstract string Type { get; }
    public virtual string Start() => $"{Type,-12} {Model} ({Year}): motor ligado";
}

class OopCar(string model, int year, int doors) : OopVehicle(model, year)
{
    public override string Type => "Carro";
    public override string Start() => base.Start() + $" | {doors} portas";
}

class OopMotorcycle(string model, int year) : OopVehicle(model, year)
{
    public override string Type => "Moto";
    public override string Start() => base.Start() + " | vroom!";
}

class OopTruck(string model, int year, int tons) : OopVehicle(model, year)
{
    public override string Type => "Caminhão";
    public override string Start() => base.Start() + $" | {tons}t carga";
}

// ─── 4: Polimorfismo ───────────────────────────────────────────────────────

abstract class OopAnimal(string name)
{
    public string Name { get; } = name;
    public abstract string Sound();
    public override string ToString() => $"{GetType().Name,-10}({Name,-6}): {Sound()}";
}

class OopDog(string name) : OopAnimal(name) { public override string Sound() => "Au au!"; }
class OopCat(string name) : OopAnimal(name) { public override string Sound() => "Miau!"; }
class OopCow(string name) : OopAnimal(name) { public override string Sound() => "Muuu!"; }
