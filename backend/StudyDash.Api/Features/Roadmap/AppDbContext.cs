using Microsoft.EntityFrameworkCore;
using StudyDash.Api.Features.Catalog;

namespace StudyDash.Api.Features.Roadmap;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<RoadmapTask> RoadmapTasks => Set<RoadmapTask>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Study> Studies => Set<Study>();
}
