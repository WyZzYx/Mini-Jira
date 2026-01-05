using MiniJira.Api.Models;

namespace MiniJira.Api.DTOs;

public record ProjectListItemDto(
    string Id,
    string Key,
    string Name,
    string DepartmentId,
    string DepartmentName,
    bool Archived,
    ProjectMemberRole? MyProjectRole
);

public record ProjectDetailDto(
    string Id,
    string Key,
    string Name,
    string DepartmentId,
    string DepartmentName,
    bool Archived,
    ProjectMemberRole? MyProjectRole
);

public record CreateProjectRequest(string Key, string Name, string? DepartmentId);
public record UpdateProjectRequest(string Name, bool Archived);

public record MemberDto(
    string UserId,
    string Email,
    string? Name,
    string? DepartmentId,
    string? DepartmentName,
    List<string> GlobalRoles,
    ProjectMemberRole ProjectRole,
    DateTime JoinedAt
);

public record AddMemberRequest(string Email, ProjectMemberRole ProjectRole);
public record UpdateMemberRoleRequest(ProjectMemberRole ProjectRole);
