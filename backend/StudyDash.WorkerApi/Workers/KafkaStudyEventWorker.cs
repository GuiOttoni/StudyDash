using Confluent.Kafka;
using Microsoft.Extensions.Options;
using StudyDash.Messaging;
using StudyDash.Messaging.Kafka;

namespace StudyDash.WorkerApi.Workers;

/// <summary>
/// Consome o tópico 'studydash.study-events' do Kafka via consumer group.
/// Commit manual após processamento bem-sucedido (EnableAutoCommit=false).
/// Também publica eventos de exemplo na inicialização para demonstração.
/// Observar com: docker logs studydash-worker -f
/// </summary>
public sealed class KafkaStudyEventWorker : BackgroundService
{
    private const string Topic      = "studydash.study-events";
    private const string GroupId    = "studydash-workers";

    private readonly KafkaOptions _options;
    private readonly ILogger<KafkaStudyEventWorker> _logger;

    public KafkaStudyEventWorker(
        IOptions<MessagingOptions> options,
        ILogger<KafkaStudyEventWorker> logger)
    {
        _options = options.Value.Kafka;
        _logger  = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[KafkaStudyEventWorker] Iniciando...");

        // Publica alguns eventos de exemplo antes de consumir
        await SeedEventsAsync(stoppingToken);

        var config = new ConsumerConfig
        {
            BootstrapServers  = _options.BootstrapServers,
            GroupId           = GroupId,
            AutoOffsetReset   = AutoOffsetReset.Earliest,
            EnableAutoCommit  = false,
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe(Topic);

        _logger.LogInformation(
            "[KafkaStudyEventWorker] Consumer group '{Group}' subscrito em '{Topic}'. Aguardando eventos...",
            GroupId, Topic);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                // Consume com timeout curto para verificar o stoppingToken frequentemente
                var result = await Task.Run(
                    () => consumer.Consume(TimeSpan.FromSeconds(1)),
                    stoppingToken);

                if (result is null) continue;

                _logger.LogInformation(
                    "[KafkaStudyEventWorker] EVENT recebido → key={Key} offset={Offset} partition={Partition} | {Value}",
                    result.Message.Key,
                    result.Offset,
                    result.Partition,
                    result.Message.Value);

                // Commit manual — confirma apenas após processamento bem-sucedido
                consumer.Commit(result);
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            consumer.Close();
            _logger.LogInformation("[KafkaStudyEventWorker] Consumer encerrado.");
        }
    }

    private async Task SeedEventsAsync(CancellationToken ct)
    {
        var producerConfig = new ProducerConfig
        {
            BootstrapServers = _options.BootstrapServers,
            Acks             = Acks.Leader,
            MessageTimeoutMs = 10_000,
        };

        using var producer = new ProducerBuilder<string, string>(producerConfig).Build();

        var events = new[]
        {
            new { tipo = "study.started",   slug = "rabbitmq-dlq",    usuario = "user-1" },
            new { tipo = "study.completed", slug = "kafka-producer",   usuario = "user-2" },
            new { tipo = "study.started",   slug = "event-driven",    usuario = "user-1" },
            new { tipo = "study.paused",    slug = "rabbitmq-dlq",    usuario = "user-3" },
            new { tipo = "study.completed", slug = "clean-code-solid", usuario = "user-2" },
        };

        _logger.LogInformation("[KafkaStudyEventWorker] Publicando {Count} eventos de exemplo no tópico '{Topic}'...",
            events.Length, Topic);

        foreach (var ev in events)
        {
            var key   = ev.usuario;
            var value = System.Text.Json.JsonSerializer.Serialize(ev);
            await producer.ProduceAsync(Topic, new Message<string, string> { Key = key, Value = value }, ct);
            _logger.LogInformation("[KafkaStudyEventWorker] PRODUCE → key={Key} | {Value}", key, value);
        }

        producer.Flush(TimeSpan.FromSeconds(5));
        _logger.LogInformation("[KafkaStudyEventWorker] {Count} eventos publicados.", events.Length);
    }
}
