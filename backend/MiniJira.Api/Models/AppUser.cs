using Microsoft.AspNetCore.Identity;

namespace MiniJira.Api.Models;

public class AppUser : IdentityUser
{
    public string? Name { get; set; }

    public string? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public List<ProjectMember> ProjectMemberships { get; set; } = new();
    public List<TaskAssignee> TaskAssignments { get; set; } = new();
}
