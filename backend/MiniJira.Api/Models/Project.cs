namespace MiniJira.Api.Models;

public class Project
{
    public string Id { get; set; } = default!;
    public string Key { get; set; } = default!;
    public string Name { get; set; } = default!;

    public string DepartmentId { get; set; } = default!;
    public Department Department { get; set; } = default!;

    public bool Archived { get; set; }
    public DateTime CreatedAt { get; set; }

    public string? CreatedByUserId { get; set; }
    public AppUser? CreatedByUser { get; set; }

    public List<ProjectMember> Members { get; set; } = new();
    public List<TaskItem> Tasks { get; set; } = new();
}
