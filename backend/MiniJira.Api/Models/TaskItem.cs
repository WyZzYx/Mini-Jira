namespace MiniJira.Api.Models;

public enum TaskStatus
{
    TODO,
    IN_PROGRESS,
    REVIEW,
    DONE
}

public enum TaskPriority
{
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

public class TaskItem
{
    public string Id { get; set; } = default!;
    public string ProjectId { get; set; } = default!;
    public Project Project { get; set; } = default!;

    public string Title { get; set; } = default!;
    public string? Description { get; set; }

    public TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? CreatedByUserId { get; set; }
    public AppUser? CreatedByUser { get; set; }

    public List<TaskAssignee> Assignees { get; set; } = new();
    public List<Comment> Comments { get; set; } = new();
}
