using Microsoft.EntityFrameworkCore;
using StudyDash.Api.Features.Roadmap;

namespace StudyDash.Api.Features.Catalog;

/// <summary>
/// Vertical slice: CRUD de seções do catálogo
/// Base route: /api/sections
/// </summary>
public static class SectionsFeature
{
    public static IEndpointRouteBuilder MapSectionsFeature(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sections").WithTags("Catalog");

        group.MapGet("/", async (AppDbContext db) =>
            await db.Sections.OrderBy(s => s.Order).ThenBy(s => s.Id).ToListAsync())
            .WithSummary("Listar seções")
            .WithDescription("Retorna todas as seções do catálogo ordenadas por Order. Usado pelo frontend para construir a navegação (Server-Driven UI).")
            .Produces<Section[]>(200);

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.Sections.FindAsync(id) is { } section
                ? Results.Ok(section)
                : Results.NotFound())
            .WithSummary("Buscar seção por ID")
            .Produces<Section>(200)
            .Produces(404);

        group.MapPost("/", async (SectionRequest req, AppDbContext db) =>
        {
            var section = new Section
            {
                Slug        = req.Slug,
                Title       = req.Title,
                Icon        = req.Icon,
                Description = req.Description,
                Categories  = req.Categories,
                Order       = req.Order,
            };
            db.Sections.Add(section);
            await db.SaveChangesAsync();
            return Results.Created($"/api/sections/{section.Id}", section);
        })
            .WithSummary("Criar seção")
            .WithDescription("Cria uma nova seção do catálogo. `slug` deve ser único e em kebab-case. `categories` são as categorias de estudos que pertencem a esta seção.")
            .Produces<Section>(201)
            .ProducesValidationProblem();

        group.MapPut("/{id:int}", async (int id, SectionRequest req, AppDbContext db) =>
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return Results.NotFound();

            section.Slug        = req.Slug;
            section.Title       = req.Title;
            section.Icon        = req.Icon;
            section.Description = req.Description;
            section.Categories  = req.Categories;
            section.Order       = req.Order;
            await db.SaveChangesAsync();
            return Results.Ok(section);
        })
            .WithSummary("Atualizar seção")
            .Produces<Section>(200)
            .Produces(404);

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var section = await db.Sections.FindAsync(id);
            if (section is null) return Results.NotFound();

            db.Sections.Remove(section);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
            .WithSummary("Excluir seção")
            .Produces(204)
            .Produces(404);

        group.MapPost("/reset", async (AppDbContext db) =>
        {
            await db.Sections.ExecuteDeleteAsync();
            await CatalogSeedData.SeedAsync(db);
            var sections = await db.Sections.OrderBy(s => s.Order).ToListAsync();
            return Results.Ok(sections);
        })
            .WithSummary("Resetar seções para o seed original")
            .WithDescription("Remove todas as seções e reinsere as do seed padrão. **Operação destrutiva.**")
            .Produces<Section[]>(200);

        return app;
    }

    private record SectionRequest(
        string   Slug,
        string   Title,
        string   Icon,
        string   Description,
        string[] Categories,
        int      Order);
}
