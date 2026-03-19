using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace StudyDash.Messaging.RabbitMq;

/// <summary>
/// Singleton que gerencia a conexão AMQP com o RabbitMQ.
/// Usa async double-checked lock via SemaphoreSlim para inicialização lazy thread-safe.
/// Canais (IChannel) são criados por-request via CreateChannelAsync() — nunca compartilhados.
/// </summary>
public sealed class RabbitMqConnectionManager : IAsyncDisposable
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqConnectionManager> _logger;
    private IConnection? _connection;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public RabbitMqConnectionManager(
        IOptions<MessagingOptions> options,
        ILogger<RabbitMqConnectionManager> logger)
    {
        _options = options.Value.RabbitMq;
        _logger = logger;
    }

    /// <summary>
    /// Retorna uma conexão aberta, inicializando na primeira chamada.
    /// Thread-safe via SemaphoreSlim (async double-checked lock).
    /// </summary>
    public async ValueTask<IConnection> GetConnectionAsync(CancellationToken ct = default)
    {
        // Fast path — sem lock
        if (_connection is { IsOpen: true })
            return _connection;

        await _lock.WaitAsync(ct);
        try
        {
            // Segunda verificação dentro do lock
            if (_connection is { IsOpen: true })
                return _connection;

            var factory = new ConnectionFactory
            {
                HostName    = _options.Host,
                Port        = _options.Port,
                UserName    = _options.Username,
                Password    = _options.Password,
                VirtualHost = _options.VirtualHost,
            };

            _connection = await factory.CreateConnectionAsync(ct);
            _logger.LogInformation(
                "RabbitMQ connection established → {Host}:{Port}{Vhost}",
                _options.Host, _options.Port, _options.VirtualHost);

            return _connection;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Cria e retorna um novo IChannel. O caller é responsável pelo ciclo de vida (await using).
    /// Canais não são thread-safe — um por request/worker.
    /// </summary>
    public async ValueTask<IChannel> CreateChannelAsync(CancellationToken ct = default)
    {
        var conn = await GetConnectionAsync(ct);
        return await conn.CreateChannelAsync(cancellationToken: ct);
    }

    public async ValueTask DisposeAsync()
    {
        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection.Dispose();
            _logger.LogInformation("RabbitMQ connection closed.");
        }
        _lock.Dispose();
    }
}
