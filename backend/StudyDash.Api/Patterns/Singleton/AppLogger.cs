namespace StudyDash.Api.Patterns.Singleton;

public sealed class AppLogger
{
    private static AppLogger? _instance;
    private static readonly object _lock = new();

    private readonly string _instanceId = Guid.NewGuid().ToString()[..8];
    private int _logCount = 0;

    // Construtor privado: impede instanciação direta
    private AppLogger() { }

    public static AppLogger GetInstance()
    {
        if (_instance is null)
        {
            lock (_lock)
            {
                _instance ??= new AppLogger();
            }
        }
        return _instance;
    }

    public string Write(string message)
    {
        _logCount++;
        return $"[Logger#{_instanceId}] #{_logCount:D3} {message}";
    }

    public string InstanceId => _instanceId;
    public int LogCount => _logCount;
}
