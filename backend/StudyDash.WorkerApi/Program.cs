using StudyDash.Messaging;
using StudyDash.WorkerApi.Workers;

var builder = Host.CreateApplicationBuilder(args);

// ── Módulo de mensageria compartilhado (StudyDash.Messaging) ─────────────────
builder.Services.AddMessaging(builder.Configuration);

// ── Workers ──────────────────────────────────────────────────────────────────
builder.Services.AddHostedService<RabbitMqOrderWorker>();
builder.Services.AddHostedService<KafkaStudyEventWorker>();

var host = builder.Build();
await host.RunAsync();
