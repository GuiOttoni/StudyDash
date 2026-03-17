using StudyDash.Api.Features.Patterns.Builder;
using StudyDash.Api.Features.Patterns.Singleton;
using StudyDash.Api.Features.Algorithms.BubbleSort;
using StudyDash.Api.Features.Principles.Solid;

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

var app = builder.Build();

app.UseCors();

// ── Cada feature registra sua própria rota (Vertical Slice) ─────────────────
app.MapBuilderFeature();
app.MapSingletonFeature();
app.MapBubbleSortFeature();
app.MapSolidFeature();

app.Run();
