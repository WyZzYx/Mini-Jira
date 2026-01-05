using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Models;
using MiniJira.Api.Services;

namespace MiniJira.Api.Services;

public class CommentsService
{
    private readonly AppDbContext _db;
    private readonly ProjectAccessService _access;

    public CommentsService(AppDbContext db, ProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async Task<List<CommentDto>> ListAsync(string callerId, List<string> roles, string taskId)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);
        if (!await _access.CanViewProjectAsync(project, user, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var comments = await _db.Comments
            .Where(c => c.TaskId == taskId)
            .Include(c => c.AuthorUser)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id,
                c.TaskId,
                c.AuthorUserId,
                c.AuthorUser != null ? c.AuthorUser.Email : null,
                c.Body,
                c.CreatedAt
            ))
            .ToListAsync();

        return comments;
    }

    public async Task<CommentDto> CreateAsync(string callerId, List<string> roles, string taskId, CreateCommentRequest req)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);
        if (!await _access.CanViewProjectAsync(project, user, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var body = (req.Body ?? "").Trim();
        if (body.Length < 1) throw new ArgumentException("Empty comment.");
        if (body.Length > 4000) throw new ArgumentException("Comment too long.");

        var c = new Comment
        {
            Id = Guid.NewGuid().ToString("N"),
            TaskId = taskId,
            AuthorUserId = callerId,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(c);
        await _db.SaveChangesAsync();

        return new CommentDto(c.Id, c.TaskId, c.AuthorUserId, user.Email, c.Body, c.CreatedAt);
    }
}
