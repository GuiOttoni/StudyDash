namespace StudyDash.Api.Features.Patterns.Builder;

public class ComputerDirector(IComputerBuilder builder)
{
    public async Task BuildStep_CPU(Func<string, Task> send, CancellationToken ct)
    {
        await send("[CPU] Instalando Intel Core i9-14900K...");
        await Task.Delay(500, ct);
        builder.SetCPU("Intel Core i9-14900K");
        await send("[CPU] ✓ Concluído.");
        await Task.Delay(200, ct);
    }

    public async Task BuildStep_GPU(Func<string, Task> send, CancellationToken ct)
    {
        await send("[GPU] Instalando NVIDIA RTX 4090...");
        await Task.Delay(600, ct);
        builder.SetGPU("NVIDIA RTX 4090");
        await send("[GPU] ✓ Concluído.");
        await Task.Delay(200, ct);
    }

    public async Task BuildStep_RAM(Func<string, Task> send, CancellationToken ct)
    {
        await send("[RAM] Instalando 64GB DDR5-6000...");
        await Task.Delay(400, ct);
        builder.SetRAM("64GB DDR5-6000");
        await send("[RAM] ✓ Concluído.");
        await Task.Delay(200, ct);
    }

    public async Task BuildStep_Storage(Func<string, Task> send, CancellationToken ct)
    {
        await send("[Storage] Instalando SSD NVMe 2TB...");
        await Task.Delay(450, ct);
        builder.SetStorage("SSD NVMe 2TB");
        await send("[Storage] ✓ Concluído.");
        await Task.Delay(200, ct);
    }

    public async Task BuildStep_OS(Func<string, Task> send, CancellationToken ct)
    {
        await send("[OS] Instalando Windows 11 Pro...");
        await Task.Delay(700, ct);
        builder.SetOS("Windows 11 Pro");
        await send("[OS] ✓ Concluído.");
        await Task.Delay(200, ct);
    }
}
