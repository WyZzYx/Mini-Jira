namespace MiniJira.Api.Models;

public enum ProjectMemberRole
{
    OWNER,
    MEMBER,
    VIEWER
}

public class ProjectMember
{
    public string ProjectId { get; set; } = default!;
    public Project Project { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    public ProjectMemberRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}
