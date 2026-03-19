namespace StudyDash.Api.Features.Catalog;

public class Study
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Category { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Available { get; set; }
    public string Icon { get; set; } = "";
    public int Order { get; set; }
}
