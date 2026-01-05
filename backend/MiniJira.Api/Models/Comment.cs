namespace MiniJira.Api.Models;

public class Comment
{
    public string Id { get; set; } = default!;
    public string TaskId { get; set; } = default!;
    public TaskItem Task { get; set; } = default!;

    public string? AuthorUserId { get; set; }
    public AppUser? AuthorUser { get; set; }

    public string Body { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}
