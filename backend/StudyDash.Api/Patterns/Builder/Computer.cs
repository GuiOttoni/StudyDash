namespace StudyDash.Api.Patterns.Builder;

public class Computer
{
    public string CPU { get; set; } = "";
    public string GPU { get; set; } = "";
    public string RAM { get; set; } = "";
    public string Storage { get; set; } = "";
    public string OperatingSystem { get; set; } = "";

    public string Describe() =>
        $"CPU={CPU} | GPU={GPU} | RAM={RAM} | Storage={Storage} | OS={OperatingSystem}";
}
