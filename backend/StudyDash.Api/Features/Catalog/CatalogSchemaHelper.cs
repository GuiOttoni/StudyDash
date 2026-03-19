using Microsoft.EntityFrameworkCore;
using StudyDash.Api.Features.Roadmap;

namespace StudyDash.Api.Features.Catalog;

/// <summary>
/// Garante que as tabelas do catálogo existam no banco de dados.
/// EnsureCreatedAsync só cria o schema em bancos novos; para bancos
/// já existentes (com RoadmapTasks), este helper cria as tabelas ausentes
/// com CREATE TABLE IF NOT EXISTS.
/// </summary>
public static class CatalogSchemaHelper
{
    public static async Task EnsureTablesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "Sections" (
                "Id"          SERIAL  PRIMARY KEY,
                "Slug"        TEXT    NOT NULL DEFAULT '',
                "Title"       TEXT    NOT NULL DEFAULT '',
                "Icon"        TEXT    NOT NULL DEFAULT '',
                "Description" TEXT    NOT NULL DEFAULT '',
                "Categories"  TEXT[]  NOT NULL DEFAULT '{{}}',
                "Order"       INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS "Studies" (
                "Id"          SERIAL  PRIMARY KEY,
                "Slug"        TEXT    NOT NULL DEFAULT '',
                "Title"       TEXT    NOT NULL DEFAULT '',
                "Category"    TEXT    NOT NULL DEFAULT '',
                "Description" TEXT    NOT NULL DEFAULT '',
                "Available"   BOOLEAN NOT NULL DEFAULT FALSE,
                "Icon"        TEXT    NOT NULL DEFAULT '',
                "Order"       INTEGER NOT NULL DEFAULT 0
            );
            """);
    }
}
