using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace StudyDash.Messaging.Kafka;

/// <summary>
/// Singleton thread-safe que encapsula IProducer&lt;string, string&gt; do Confluent.Kafka.
/// Deve ser registrado como singleton — o producer é criado uma vez e reutilizado.
/// Flush(5s) é chamado no Dispose para garantir entrega de mensagens em flight.
/// </summary>
public sealed class KafkaProducerService : IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducerService> _logger;

    public KafkaProducerService(
        IOptions<MessagingOptions> options,
        ILogger<KafkaProducerService> logger)
    {
        _logger = logger;

        var config = new ProducerConfig
        {
            BootstrapServers = options.Value.Kafka.BootstrapServers,
            Acks             = Acks.Leader,
            MessageTimeoutMs = 10_000,
        };

        _producer = new ProducerBuilder<string, string>(config).Build();
        _logger.LogInformation(
            "Kafka producer initialized → {Servers}", options.Value.Kafka.BootstrapServers);
    }

    /// <summary>
    /// Publica uma mensagem no tópico especificado.
    /// Retorna o DeliveryResult com partição e offset confirmados.
    /// </summary>
    public Task<DeliveryResult<string, string>> ProduceAsync(
        string topic,
        string key,
        string value,
        CancellationToken ct = default)
    {
        _logger.LogDebug("Kafka PRODUCE → {Topic} key={Key}", topic, key);
        return _producer.ProduceAsync(topic, new Message<string, string> { Key = key, Value = value }, ct);
    }

    public void Dispose()
    {
        _producer.Flush(TimeSpan.FromSeconds(5));
        _producer.Dispose();
        _logger.LogInformation("Kafka producer flushed and disposed.");
    }
}
