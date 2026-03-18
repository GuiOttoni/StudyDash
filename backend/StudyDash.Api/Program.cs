using StudyDash.Api.Features.Patterns.Builder;
using StudyDash.Api.Features.Patterns.Singleton;
using StudyDash.Api.Features.Algorithms.BubbleSort;
using StudyDash.Api.Features.Algorithms.MergeSort;
using StudyDash.Api.Features.CleanCode.DiLifetimes;
using StudyDash.Api.Features.Principles.Solid;
using StudyDash.Api.Features.Memory.HeapStack;
using StudyDash.Api.Features.Memory.GarbageCollection;
using StudyDash.Api.Features.Memory.RecordClassStruct;
using StudyDash.Api.Features.Concurrency.ThreadTask;
using StudyDash.Api.Features.Concurrency.ParallelTasks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ── Registro de Lifetimes para o exemplo interativo ──────────────────────────
builder.Services.AddTransient<TransientService>();
builder.Services.AddScoped<ScopedService>();
builder.Services.AddSingleton<SingletonService>();

var app = builder.Build();

app.UseCors();

// ── Cada feature registra sua própria rota (Vertical Slice) ─────────────────
app.MapBuilderFeature();
app.MapSingletonFeature();
app.MapBubbleSortFeature();
app.MapMergeSortFeature();
app.MapDiLifetimesFeature();
app.MapSolidFeature();

// ── Memória ──────────────────────────────────────────────────────────────────
app.MapHeapStackFeature();
app.MapGarbageCollectionFeature();
app.MapRecordClassStructFeature();

// ── Concorrência ─────────────────────────────────────────────────────────────
app.MapThreadTaskFeature();
app.MapParallelTasksFeature();

app.Run();
