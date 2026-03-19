using StudyDash.Messaging.Kafka;
using StudyDash.Messaging.RabbitMq;

namespace StudyDash.Messaging;

public sealed class MessagingOptions
{
    public const string SectionName = "Messaging";
    public RabbitMqOptions RabbitMq { get; set; } = new();
    public KafkaOptions Kafka { get; set; } = new();
}
