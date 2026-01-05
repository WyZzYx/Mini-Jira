namespace MiniJira.Api.DTOs;

public record LoginRequest(string Email, string Password);

public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);

public record MeResponse(
    string Id,
    string Email,
    string Name,
    string? DepartmentId,
    string? DepartmentName,
    List<string> Roles
);
