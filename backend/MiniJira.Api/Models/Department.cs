namespace MiniJira.Api.Models;

public class Department
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;

    public List<Project> Projects { get; set; } = new();
    public List<AppUser> Users { get; set; } = new();
}
