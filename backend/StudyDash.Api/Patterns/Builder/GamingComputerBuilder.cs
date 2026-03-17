namespace StudyDash.Api.Patterns.Builder;

public class GamingComputerBuilder : IComputerBuilder
{
    private readonly Computer _computer = new();

    public IComputerBuilder SetCPU(string cpu) { _computer.CPU = cpu; return this; }
    public IComputerBuilder SetGPU(string gpu) { _computer.GPU = gpu; return this; }
    public IComputerBuilder SetRAM(string ram) { _computer.RAM = ram; return this; }
    public IComputerBuilder SetStorage(string storage) { _computer.Storage = storage; return this; }
    public IComputerBuilder SetOS(string os) { _computer.OperatingSystem = os; return this; }
    public Computer Build() => _computer;
}
