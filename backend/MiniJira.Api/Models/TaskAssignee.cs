namespace MiniJira.Api.Models;

public class TaskAssignee
{
    public string TaskId { get; set; } = default!;
    public TaskItem Task { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    public DateTime AssignedAt { get; set; }

    public string? AssignedByUserId { get; set; }
    public AppUser? AssignedByUser { get; set; }
}
