using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Models;
using MiniJira.Api.Services;
using TaskStatus = MiniJira.Api.Models.TaskStatus;

namespace MiniJira.Api.Services;

public class TasksService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly ProjectAccessService _access;

    public TasksService(AppDbContext db, UserManager<AppUser> userManager, ProjectAccessService access)
    {
        _db = db;
        _userManager = userManager;
        _access = access;
    }

    public async Task<PagedResponse<TaskDto>> ListForProjectAsync(
        string callerId,
        List<string> roles,
        string projectId,
        TaskStatus? status,
        TaskPriority? priority,
        int page,
        int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanViewProjectAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        IQueryable<TaskItem> q = _db.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignees).ThenInclude(a => a.User)
            .Include(t => t.CreatedByUser);

        if (status != null) q = q.Where(t => t.Status == status);
        if (priority != null) q = q.Where(t => t.Priority == priority);

        var total = await q.CountAsync();

        var tasks = await q
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var roleCache = new Dictionary<string, List<string>>();

        List<UserMiniDto> MapAssignees(TaskItem t)
        {
            return t.Assignees
                .Where(a => a.User != null)
                .Select(a =>
                {
                    var u = a.User!;
                    if (!roleCache.TryGetValue(u.Id, out var r))
                    {
                        r = new List<string>();
                        roleCache[u.Id] = r;
                    }
                    return new UserMiniDto(u.Id, u.Email ?? "", new List<string>(roleCache[u.Id]));
                })
                .ToList();
        }

        var uniqueUsers = tasks
            .SelectMany(t => t.Assignees.Select(a => a.User))
            .Where(u => u != null)
            .Select(u => u!)
            .DistinctBy(u => u.Id)
            .ToList();

        foreach (var u in uniqueUsers)
        {
            if (roleCache.TryGetValue(u.Id, out var existing) && existing.Count > 0) continue;
            var r = await _userManager.GetRolesAsync(u);
            roleCache[u.Id] = r.ToList();
        }

        var items = tasks.Select(t => new TaskDto(
            t.Id,
            t.ProjectId,
            t.Title,
            t.Description,
            t.Status,
            t.Priority,
            t.DueDate,
            t.CreatedAt,
            t.CreatedByUserId,
            t.CreatedByUser != null ? t.CreatedByUser.Email : null,
            t.Assignees
                .Where(a => a.User != null)
                .Select(a =>
                {
                    var u = a.User!;
                    roleCache.TryGetValue(u.Id, out var rr);
                    rr ??= new List<string>();
                    return new UserMiniDto(u.Id, u.Email ?? "", new List<string>(rr));
                })
                .ToList()
        )).ToList();

        return new PagedResponse<TaskDto> { Page = page, PageSize = pageSize, Total = total, Items = items };
    }

    public async Task<TaskDto> CreateAsync(string callerId, List<string> roles, string projectId, CreateTaskRequest req)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanViewProjectAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var title = (req.Title ?? "").Trim();
        if (title.Length < 3) throw new ArgumentException("Title must be at least 3 characters.");
        if (project.Archived) throw new ArgumentException("Project is archived.");

        var task = new TaskItem
        {
            Id = Guid.NewGuid().ToString("N"),
            ProjectId = projectId,
            Title = title,
            Description = req.Description?.Trim(),
            Status = TaskStatus.TODO,
            Priority = req.Priority,
            DueDate = req.DueDate,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = callerId
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        var dto = await BuildTaskDtoAsync(task.Id);
        return dto!;
    }

    public async Task<TaskDto> GetByIdAsync(string callerId, List<string> roles, string taskId)
    {
        var dto = await BuildTaskDtoAsync(taskId);
        if (dto == null) throw new KeyNotFoundException("Task not found.");

        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == dto.ProjectId);
        if (!await _access.CanViewProjectAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        return dto;
    }

    public async Task UpdateAsync(string callerId, List<string> roles, string taskId, UpdateTaskRequest req)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);

        var canManage = await _access.CanManageProjectAsync(project, caller, roles);
        var canEdit = canManage || task.CreatedByUserId == callerId;
        if (!canEdit) throw new UnauthorizedAccessException("Forbidden");

        var title = (req.Title ?? "").Trim();
        if (title.Length < 3) throw new ArgumentException("Title must be at least 3 characters.");
        if (project.Archived) throw new ArgumentException("Project is archived.");

        task.Title = title;
        task.Description = req.Description?.Trim();
        task.Status = req.Status;
        task.Priority = req.Priority;
        task.DueDate = req.DueDate;

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(string callerId, List<string> roles, string taskId)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);

        var canManage = await _access.CanManageProjectAsync(project, caller, roles);
        var canEdit = canManage || task.CreatedByUserId == callerId;
        if (!canEdit) throw new UnauthorizedAccessException("Forbidden");

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
    }

    public async Task AssignAsync(string callerId, List<string> roles, string taskId, string userId)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);

        if (!await _access.CanManageProjectAsync(project, caller, roles) && task.CreatedByUserId != callerId)
            throw new UnauthorizedAccessException("Forbidden");

        var exists = await _db.TaskAssignees.AnyAsync(a => a.TaskId == taskId && a.UserId == userId);
        if (exists) return;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("Assignee not found.");

        _db.TaskAssignees.Add(new TaskAssignee
        {
            TaskId = taskId,
            UserId = userId,
            AssignedAt = DateTime.UtcNow,
            AssignedByUserId = callerId
        });

        await _db.SaveChangesAsync();
    }

    public async Task UnassignAsync(string callerId, List<string> roles, string taskId, string userId)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null) throw new KeyNotFoundException("Task not found.");

        var project = await _db.Projects.Include(p => p.Department).FirstAsync(p => p.Id == task.ProjectId);

        if (!await _access.CanManageProjectAsync(project, caller, roles) && task.CreatedByUserId != callerId)
            throw new UnauthorizedAccessException("Forbidden");

        var a = await _db.TaskAssignees.FirstOrDefaultAsync(x => x.TaskId == taskId && x.UserId == userId);
        if (a == null) return;

        _db.TaskAssignees.Remove(a);
        await _db.SaveChangesAsync();
    }

    private async Task<TaskDto?> BuildTaskDtoAsync(string taskId)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignees).ThenInclude(a => a.User)
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null) return null;

        var roleCache = new Dictionary<string, List<string>>();

        var assignees = new List<UserMiniDto>();
        foreach (var a in task.Assignees.Where(x => x.User != null))
        {
            var u = a.User!;
            if (!roleCache.TryGetValue(u.Id, out var roles))
            {
                var r = await _userManager.GetRolesAsync(u);
                roles = r.ToList();
                roleCache[u.Id] = roles;
            }
            assignees.Add(new UserMiniDto(u.Id, u.Email ?? "", new List<string>(roles)));
        }

        return new TaskDto(
            task.Id,
            task.ProjectId,
            task.Title,
            task.Description,
            task.Status,
            task.Priority,
            task.DueDate,
            task.CreatedAt,
            task.CreatedByUserId,
            task.CreatedByUser?.Email,
            assignees
        );
    }
}
