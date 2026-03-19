using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using StudyDash.Api.Features.Patterns.Builder;
using StudyDash.Api.Features.Patterns.Singleton;
using StudyDash.Api.Features.Algorithms.BubbleSort;
using StudyDash.Api.Features.Algorithms.MergeSort;
using StudyDash.Api.Features.CleanCode.DiLifetimes;
using StudyDash.Api.Features.Principles.Solid;
using StudyDash.Api.Features.Principles.OopPillars;
using StudyDash.Api.Features.Principles.Grasp;
using StudyDash.Api.Features.Memory.HeapStack;
using StudyDash.Api.Features.Memory.GarbageCollection;
using StudyDash.Api.Features.Memory.RecordClassStruct;
using StudyDash.Api.Features.Concurrency.ThreadTask;
using StudyDash.Api.Features.Concurrency.ParallelTasks;
using StudyDash.Api.Features.Roadmap;
using StudyDash.Api.Features.Performance.ValueTaskDemo;
using StudyDash.Api.Features.Arquiteturas.EventDriven;
using StudyDash.Api.Features.Mensageria.Exchanges;
using StudyDash.Api.Features.Catalog;

var builder = WebApplication.CreateBuilder(args);

// ── OpenAPI / Scalar ──────────────────────────────────────────────────────────
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((doc, _, _) =>
    {
        doc.Info.Title = "StudyDash API";
        doc.Info.Version = "v1";
        doc.Info.Description =
            "Backend educacional do StudyDash. Expõe demos interativos via SSE, " +
            "roadmap de estudos (CRUD), catálogo de seções e estudos (CRUD) e metadados de navegação para Server-Driven UI.";
        return Task.CompletedTask;
    });
});

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

// ── Banco de dados ────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// ── Schema + Seed ────────────────────────────────────────────────────────────
// EnsureCreatedAsync cria o schema completo apenas em bancos novos.
// Para bancos já existentes, CatalogSchemaHelper garante as novas tabelas.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await CatalogSchemaHelper.EnsureTablesAsync(db);
    await RoadmapSeedData.SeedAsync(db);
    await CatalogSeedData.SeedAsync(db);
}

app.UseCors();

app.MapOpenApi();
app.MapScalarApiReference("/scalar", opt =>
{
    opt.Title = "StudyDash API";
    opt.Theme = ScalarTheme.DeepSpace;
});

// ── Catálogo (Seções e Estudos — Server-Driven UI) ────────────────────────────
app.MapSectionsFeature();
app.MapStudiesFeature();

// ── Cada feature registra sua própria rota (Vertical Slice) ─────────────────
app.MapBuilderFeature();
app.MapSingletonFeature();
app.MapBubbleSortFeature();
app.MapMergeSortFeature();
app.MapDiLifetimesFeature();
app.MapSolidFeature();
app.MapOopPillarsFeature();
app.MapGraspFeature();

// ── Memória ──────────────────────────────────────────────────────────────────
app.MapHeapStackFeature();
app.MapGarbageCollectionFeature();
app.MapRecordClassStructFeature();

// ── Concorrência ─────────────────────────────────────────────────────────────
app.MapThreadTaskFeature();
app.MapParallelTasksFeature();

// ── Roadmap ───────────────────────────────────────────────────────────────────
app.MapRoadmapTasksFeature();

// ── Performance ───────────────────────────────────────────────────────────────
app.MapValueTaskFeature();

// ── Arquiteturas ──────────────────────────────────────────────────────────────
app.MapEventDrivenFeature();

// ── Mensageria ────────────────────────────────────────────────────────────────
app.MapExchangePatternsFeature();

app.Run();
