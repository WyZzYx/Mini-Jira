namespace MiniJira.Api.DTOs;

public record DepartmentDto(string Id, string Name);


public record CreateDepartmentRequest(string Id, string Name);
public record UpdateDepartmentRequest(string Name);

public record AdminUserDto(
    string Id,
    string Email,
    string Name,
    string? DepartmentId,
    string? DepartmentName,
    IList<string> Roles
);

public record UpdateUserRolesRequest(IReadOnlyList<string> Roles);
public record UpdateUserDepartmentRequest(string DepartmentId);
public record ResetUserPasswordRequest(string NewPassword);