using MiniJira.Api.Models;
using TaskStatus = MiniJira.Api.Models.TaskStatus;

namespace MiniJira.Api.DTOs;

public record UserMiniDto(string Id, string Email, List<string> Roles);

public record TaskDto(
    string Id,
    string ProjectId,
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate,
    DateTime CreatedAt,
    string? CreatedByUserId,
    string? CreatedByEmail,
    List<UserMiniDto> Assignees
);

public record CreateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTime? DueDate
);

public record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate
);

public record CommentDto(
    string Id,
    string TaskId,
    string? AuthorUserId,
    string? AuthorEmail,
    string Body,
    DateTime CreatedAt
);

public record CreateCommentRequest(string Body);
