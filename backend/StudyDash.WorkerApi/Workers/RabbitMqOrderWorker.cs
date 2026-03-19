using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using StudyDash.Messaging.RabbitMq;

namespace StudyDash.WorkerApi.Workers;

/// <summary>
/// Consome a fila studydash.orders via AMQP real.
/// Simula processamento com 30% de falha (orderId divisível por 3) → BasicNack(requeue:false) → DLQ.
/// Observar com: docker logs studydash-worker -f
/// </summary>
public sealed class RabbitMqOrderWorker : BackgroundService
{
    private const string OrdersExchange    = "studydash.orders.exchange";
    private const string DlqExchange       = "studydash.dlq.exchange";
    private const string OrdersQueue       = "studydash.orders";
    private const string DeadQueue         = "studydash.orders.dead";
    private const string OrdersRoutingKey  = "order.process";

    private readonly RabbitMqConnectionManager _connectionManager;
    private readonly ILogger<RabbitMqOrderWorker> _logger;

    public RabbitMqOrderWorker(
        RabbitMqConnectionManager connectionManager,
        ILogger<RabbitMqOrderWorker> logger)
    {
        _connectionManager = connectionManager;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[RabbitMqOrderWorker] Iniciando...");

        // Canal dedicado ao worker — não compartilhado
        await using var channel = await _connectionManager.CreateChannelAsync(stoppingToken);

        // ── Declara topologia ───────────────────────────────────────────────────
        await channel.ExchangeDeclareAsync(
            OrdersExchange, ExchangeType.Direct,
            durable: true, autoDelete: false, cancellationToken: stoppingToken);

        await channel.ExchangeDeclareAsync(
            DlqExchange, ExchangeType.Fanout,
            durable: true, autoDelete: false, cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            OrdersQueue, durable: true, exclusive: false, autoDelete: false,
            arguments: new Dictionary<string, object?>
            {
                ["x-dead-letter-exchange"] = DlqExchange,
            },
            cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            DeadQueue, durable: true, exclusive: false, autoDelete: false,
            cancellationToken: stoppingToken);

        await channel.QueueBindAsync(OrdersQueue, OrdersExchange, OrdersRoutingKey,
            cancellationToken: stoppingToken);
        await channel.QueueBindAsync(DeadQueue, DlqExchange, string.Empty,
            cancellationToken: stoppingToken);

        // Prefetch 1: processa uma mensagem por vez para demonstrar ACK/NACK individual
        await channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 1, global: false,
            cancellationToken: stoppingToken);

        _logger.LogInformation(
            "[RabbitMqOrderWorker] Topologia declarada. Aguardando mensagens em '{Queue}'...",
            OrdersQueue);

        // ── Publica mensagens de exemplo na inicialização ───────────────────────
        await SeedOrdersAsync(channel, stoppingToken);

        // ── Registra consumer push-mode ─────────────────────────────────────────
        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var body    = Encoding.UTF8.GetString(ea.Body.Span);
            var orderId = ExtractOrderId(body);
            var shouldFail = orderId % 3 == 0; // ~30% de falha simulada

            if (shouldFail)
            {
                _logger.LogWarning(
                    "[RabbitMqOrderWorker] NACK → orderId={OrderId} falhou processamento → DLQ",
                    orderId);
                await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: false,
                    cancellationToken: stoppingToken);
            }
            else
            {
                _logger.LogInformation(
                    "[RabbitMqOrderWorker] ACK  → orderId={OrderId} processado com sucesso",
                    orderId);
                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false,
                    cancellationToken: stoppingToken);
            }
        };

        await channel.BasicConsumeAsync(
            queue: OrdersQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        // Mantém o worker vivo até cancelamento
        try { await Task.Delay(Timeout.Infinite, stoppingToken); }
        catch (OperationCanceledException) { }

        _logger.LogInformation("[RabbitMqOrderWorker] Encerrando.");
    }

    private async Task SeedOrdersAsync(IChannel channel, CancellationToken ct)
    {
        _logger.LogInformation("[RabbitMqOrderWorker] Publicando 10 pedidos de exemplo...");

        for (int i = 1; i <= 10; i++)
        {
            var payload = JsonSerializer.Serialize(new { orderId = i, produto = $"Produto-{i}", valor = i * 99.90m });
            var body    = Encoding.UTF8.GetBytes(payload);

            var props = new BasicProperties
            {
                ContentType  = "application/json",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId    = Guid.NewGuid().ToString(),
            };

            await channel.BasicPublishAsync(
                exchange: OrdersExchange,
                routingKey: OrdersRoutingKey,
                mandatory: false,
                basicProperties: props,
                body: body,
                cancellationToken: ct);
        }

        _logger.LogInformation("[RabbitMqOrderWorker] 10 pedidos publicados em '{Exchange}'.", OrdersExchange);
    }

    private static int ExtractOrderId(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("orderId").GetInt32();
        }
        catch { return 1; } // fallback: ACK
    }
}
