using Microsoft.EntityFrameworkCore;
using StudyDash.Api.Features.Roadmap;

namespace StudyDash.Api.Features.Catalog;

/// <summary>
/// Vertical slice: CRUD de estudos do catálogo
/// Base route: /api/studies
/// </summary>
public static class StudiesFeature
{
    public static IEndpointRouteBuilder MapStudiesFeature(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/studies").WithTags("Catalog");

        group.MapGet("/", async (string? section, AppDbContext db) =>
        {
            if (section is null)
                return Results.Ok(await db.Studies.OrderBy(s => s.Order).ThenBy(s => s.Id).ToListAsync());

            var categories = await db.Sections
                .Where(s => s.Slug == section)
                .Select(s => s.Categories)
                .FirstOrDefaultAsync();

            if (categories is null) return Results.NotFound();

            var filtered = await db.Studies
                .Where(s => categories.Contains(s.Category))
                .OrderBy(s => s.Order)
                .ThenBy(s => s.Id)
                .ToListAsync();

            return Results.Ok(filtered);
        })
            .WithSummary("Listar estudos")
            .WithDescription("Retorna todos os estudos. Filtre pelo parâmetro `section` (slug da seção, ex: `padroes`, `algoritmos`) para obter apenas os estudos daquela seção.")
            .Produces<Study[]>(200)
            .Produces(404);

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.Studies.FindAsync(id) is { } study
                ? Results.Ok(study)
                : Results.NotFound())
            .WithSummary("Buscar estudo por ID")
            .Produces<Study>(200)
            .Produces(404);

        group.MapPost("/", async (StudyRequest req, AppDbContext db) =>
        {
            var study = new Study
            {
                Slug        = req.Slug,
                Title       = req.Title,
                Category    = req.Category,
                Description = req.Description,
                Available   = req.Available,
                Icon        = req.Icon,
                Order       = req.Order,
            };
            db.Studies.Add(study);
            await db.SaveChangesAsync();
            return Results.Created($"/api/studies/{study.Id}", study);
        })
            .WithSummary("Criar estudo")
            .WithDescription("Cria um novo estudo. `slug` deve ser único e em kebab-case. `category` deve corresponder a uma das categorias registradas em uma seção.")
            .Produces<Study>(201)
            .ProducesValidationProblem();

        group.MapPut("/{id:int}", async (int id, StudyRequest req, AppDbContext db) =>
        {
            var study = await db.Studies.FindAsync(id);
            if (study is null) return Results.NotFound();

            study.Slug        = req.Slug;
            study.Title       = req.Title;
            study.Category    = req.Category;
            study.Description = req.Description;
            study.Available   = req.Available;
            study.Icon        = req.Icon;
            study.Order       = req.Order;
            await db.SaveChangesAsync();
            return Results.Ok(study);
        })
            .WithSummary("Atualizar estudo")
            .Produces<Study>(200)
            .Produces(404);

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var study = await db.Studies.FindAsync(id);
            if (study is null) return Results.NotFound();

            db.Studies.Remove(study);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
            .WithSummary("Excluir estudo")
            .Produces(204)
            .Produces(404);

        group.MapPost("/reset", async (AppDbContext db) =>
        {
            await db.Studies.ExecuteDeleteAsync();
            await CatalogSeedData.SeedAsync(db);
            var studies = await db.Studies.OrderBy(s => s.Order).ToListAsync();
            return Results.Ok(studies);
        })
            .WithSummary("Resetar estudos para o seed original")
            .WithDescription("Remove todos os estudos e reinsere os do seed padrão. **Operação destrutiva.**")
            .Produces<Study[]>(200);

        return app;
    }

    private record StudyRequest(
        string Slug,
        string Title,
        string Category,
        string Description,
        bool   Available,
        string Icon,
        int    Order);
}
