using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudyDash.Messaging.Kafka;
using StudyDash.Messaging.RabbitMq;

namespace StudyDash.Messaging;

/// <summary>
/// Entry point único para registrar a infraestrutura de mensageria no DI.
/// Usado em StudyDash.Api e StudyDash.WorkerApi.
///
/// Uso:
///   builder.Services.AddMessaging(builder.Configuration);
/// </summary>
public static class MessagingExtensions
{
    public static IServiceCollection AddMessaging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<MessagingOptions>(
            configuration.GetSection(MessagingOptions.SectionName));

        services.AddSingleton<RabbitMqConnectionManager>();
        services.AddSingleton<KafkaProducerService>();

        return services;
    }
}
