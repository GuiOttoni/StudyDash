using Microsoft.EntityFrameworkCore;

namespace StudyDash.Api.Features.Roadmap;

public static class RoadmapTasksFeature
{
    public static IEndpointRouteBuilder MapRoadmapTasksFeature(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/roadmap/tasks").WithTags("Roadmap");

        group.MapGet("/", async (AppDbContext db) =>
            await db.RoadmapTasks.OrderBy(t => t.Id).ToListAsync())
            .WithSummary("Listar todas as tarefas")
            .WithDescription("Retorna todas as tarefas do roadmap ordenadas por ID, incluindo concluídas e pendentes de todas as seções.")
            .Produces<RoadmapTask[]>(200);

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.RoadmapTasks.FindAsync(id) is { } task
                ? Results.Ok(task)
                : Results.NotFound())
            .WithSummary("Buscar tarefa por ID")
            .Produces<RoadmapTask>(200)
            .Produces(404);

        group.MapPost("/", async (RoadmapTask task, AppDbContext db) =>
        {
            task.Id = 0;
            task.CreatedAt = DateTime.UtcNow;
            db.RoadmapTasks.Add(task);
            await db.SaveChangesAsync();
            return Results.Created($"/api/roadmap/tasks/{task.Id}", task);
        })
            .WithSummary("Criar nova tarefa")
            .WithDescription("Cria uma nova tarefa no roadmap. O campo `section` deve ser o slug de uma seção válida (ex: `padroes`, `algoritmos`). Os campos `id` e `createdAt` são ignorados no body.")
            .Produces<RoadmapTask>(201)
            .ProducesValidationProblem();

        group.MapPut("/{id:int}", async (int id, RoadmapTask updated, AppDbContext db) =>
        {
            var task = await db.RoadmapTasks.FindAsync(id);
            if (task is null) return Results.NotFound();

            task.Title = updated.Title;
            task.Description = updated.Description;
            task.Completed = updated.Completed;
            await db.SaveChangesAsync();
            return Results.Ok(task);
        })
            .WithSummary("Atualizar tarefa")
            .WithDescription("Atualiza título, descrição e status de conclusão de uma tarefa existente.")
            .Produces<RoadmapTask>(200)
            .Produces(404);

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var task = await db.RoadmapTasks.FindAsync(id);
            if (task is null) return Results.NotFound();

            db.RoadmapTasks.Remove(task);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
            .WithSummary("Excluir tarefa")
            .Produces(204)
            .Produces(404);

        group.MapPost("/reset", async (AppDbContext db) =>
        {
            await db.RoadmapTasks.ExecuteDeleteAsync();
            await RoadmapSeedData.SeedAsync(db);
            var tasks = await db.RoadmapTasks.OrderBy(t => t.Id).ToListAsync();
            return Results.Ok(tasks);
        })
            .WithSummary("Resetar para o seed original")
            .WithDescription("Remove todas as tarefas e reinsere as tarefas do seed padrão. **Atenção: operação destrutiva** — todo progresso personalizado será perdido.")
            .Produces<RoadmapTask[]>(200);

        return app;
    }
}
