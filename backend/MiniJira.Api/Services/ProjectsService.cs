using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Models;
using MiniJira.Api.Services;

namespace MiniJira.Api.Services;

public class ProjectsService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly ProjectAccessService _access;

    public ProjectsService(AppDbContext db, UserManager<AppUser> userManager, ProjectAccessService access)
    {
        _db = db;
        _userManager = userManager;
        _access = access;
    }

    public async Task<PagedResponse<ProjectListItemDto>> ListAsync(
        string userId,
        List<string> roles,
        string? query,
        int page,
        int pageSize,
        bool includeArchived)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var user = await _db.Users.AsNoTracking().FirstAsync(u => u.Id == userId);

        var memberProjectIds = _db.ProjectMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.ProjectId);

        IQueryable<Project> q = _db.Projects.Include(p => p.Department);

        if (!includeArchived)
            q = q.Where(p => !p.Archived);

        if (roles.Contains("ADMIN"))
        {
            // all
        }
        else if (roles.Contains("MANAGER"))
        {
            q = q.Where(p => p.DepartmentId == user.DepartmentId || memberProjectIds.Contains(p.Id));
        }
        else
        {
            q = q.Where(p => memberProjectIds.Contains(p.Id));
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(term) || p.Key.ToLower().Contains(term));
        }

        var total = await q.CountAsync();

        var items = await q
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectListItemDto(
                p.Id,
                p.Key,
                p.Name,
                p.DepartmentId,
                p.Department.Name,
                p.Archived,
                _db.ProjectMembers
                    .Where(m => m.ProjectId == p.Id && m.UserId == userId)
                    .Select(m => (ProjectMemberRole?)m.Role)
                    .FirstOrDefault()
            ))
            .ToListAsync();

        return new PagedResponse<ProjectListItemDto>
        {
            Page = page,
            PageSize = pageSize,
            Total = total,
            Items = items
        };
    }

    public async Task<ProjectDetailDto> GetAsync(string userId, List<string> roles, string projectId)
    {
        var user = await _db.Users.Include(u => u.Department).FirstAsync(u => u.Id == userId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanViewProjectAsync(project, user, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var myRole = await _access.GetMyRoleAsync(project.Id, user.Id);

        return new ProjectDetailDto(
            project.Id,
            project.Key,
            project.Name,
            project.DepartmentId,
            project.Department.Name,
            project.Archived,
            myRole
        );
    }

    public async Task<ProjectDetailDto> CreateAsync(string userId, List<string> roles, CreateProjectRequest req)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == userId);

        var key = (req.Key ?? "").Trim().ToUpper();
        var name = (req.Name ?? "").Trim();

        if (name.Length < 3) throw new ArgumentException("Project name must be at least 3 characters.");
        if (!Regex.IsMatch(key, "^[A-Z][A-Z0-9]{1,9}$"))
            throw new ArgumentException("Key must be 2–10 chars: A–Z, 0–9, starting with a letter.");

        if (await _db.Projects.AnyAsync(p => p.Key == key))
            throw new InvalidOperationException("Project key already exists.");

        string departmentId;
        if (roles.Contains("ADMIN"))
        {
            departmentId = req.DepartmentId ?? user.DepartmentId ?? "";
        }
        else if (roles.Contains("MANAGER"))
        {
            departmentId = user.DepartmentId ?? "";
            if (!string.IsNullOrEmpty(req.DepartmentId) && req.DepartmentId != departmentId)
                throw new UnauthorizedAccessException("Forbidden");
        }
        else
        {
            departmentId = user.DepartmentId ?? "";
        }

        if (string.IsNullOrEmpty(departmentId))
            throw new ArgumentException("User has no department assigned.");

        var dep = await _db.Departments.FirstOrDefaultAsync(d => d.Id == departmentId);
        if (dep == null) throw new ArgumentException("Unknown department.");

        var project = new Project
        {
            Id = Guid.NewGuid().ToString("N"),
            Key = key,
            Name = name,
            DepartmentId = departmentId,
            Archived = false,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _db.Projects.Add(project);
        _db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = project.Id,
            UserId = userId,
            Role = ProjectMemberRole.OWNER,
            JoinedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return new ProjectDetailDto(
            project.Id,
            project.Key,
            project.Name,
            project.DepartmentId,
            dep.Name,
            project.Archived,
            ProjectMemberRole.OWNER
        );
    }

    public async Task UpdateAsync(string userId, List<string> roles, string projectId, UpdateProjectRequest req)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == userId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanManageProjectAsync(project, user, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var name = (req.Name ?? "").Trim();
        if (name.Length < 3) throw new ArgumentException("Project name must be at least 3 characters.");

        project.Name = name;
        project.Archived = req.Archived;

        await _db.SaveChangesAsync();
    }

    // ---------------- Members ----------------

    public async Task<List<MemberDto>> ListMembersAsync(string userId, List<string> roles, string projectId)
    {
        var user = await _db.Users.Include(u => u.Department).FirstAsync(u => u.Id == userId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanViewProjectAsync(project, user, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var members = await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId)
            .Include(m => m.User).ThenInclude(u => u.Department)
            .OrderByDescending(m => m.Role)
            .ToListAsync();

        // cache global roles for speed
        var roleCache = new Dictionary<string, List<string>>();

        var result = new List<MemberDto>();
        foreach (var m in members)
        {
            if (!roleCache.TryGetValue(m.UserId, out var globalRoles))
            {
                var r = await _userManager.GetRolesAsync(m.User);
                globalRoles = r.ToList();
                roleCache[m.UserId] = globalRoles;
            }

            result.Add(new MemberDto(
                m.UserId,
                m.User.Email ?? "",
                m.User.Name,
                m.User.DepartmentId,
                m.User.Department?.Name,
                globalRoles,
                m.Role,
                m.JoinedAt
            ));
        }

        return result;
    }

    public async Task AddMemberAsync(string callerId, List<string> roles, string projectId, AddMemberRequest req)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanManageMembersAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        var email = (req.Email ?? "").Trim();
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email required.");

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) throw new KeyNotFoundException("User not found.");

        var exists = await _db.ProjectMembers.AnyAsync(m => m.ProjectId == projectId && m.UserId == user.Id);
        if (exists) throw new InvalidOperationException("Already a member.");

        _db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = projectId,
            UserId = user.Id,
            Role = req.ProjectRole,
            JoinedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task UpdateMemberRoleAsync(string callerId, List<string> roles, string projectId, string memberUserId, UpdateMemberRoleRequest req)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanManageMembersAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        if (callerId == memberUserId) throw new ArgumentException("You can't change your own role in this API.");

        var member = await _db.ProjectMembers.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == memberUserId);
        if (member == null) throw new KeyNotFoundException("Member not found.");

        member.Role = req.ProjectRole;
        await _db.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(string callerId, List<string> roles, string projectId, string memberUserId)
    {
        var caller = await _db.Users.FirstAsync(u => u.Id == callerId);

        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        if (!await _access.CanManageMembersAsync(project, caller, roles))
            throw new UnauthorizedAccessException("Forbidden");

        if (callerId == memberUserId) throw new ArgumentException("You can't remove yourself in this API.");

        var member = await _db.ProjectMembers.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == memberUserId);
        if (member == null) throw new KeyNotFoundException("Member not found.");

        _db.ProjectMembers.Remove(member);
        await _db.SaveChangesAsync();
    }

    // ---------------- Admin delete project ----------------

    public async Task DeleteProjectAdminAsync(string projectId)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var taskIds = await _db.Tasks
            .Where(t => t.ProjectId == projectId)
            .Select(t => t.Id)
            .ToListAsync();

        if (taskIds.Count > 0)
        {
            var comments = await _db.Comments
                .Where(c => taskIds.Contains(c.TaskId))
                .ToListAsync();
            _db.Comments.RemoveRange(comments);

            var assignees = await _db.TaskAssignees
                .Where(a => taskIds.Contains(a.TaskId))
                .ToListAsync();
            _db.TaskAssignees.RemoveRange(assignees);

            var tasks = await _db.Tasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();
            _db.Tasks.RemoveRange(tasks);
        }

        var members = await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId)
            .ToListAsync();
        _db.ProjectMembers.RemoveRange(members);

        _db.Projects.Remove(project);

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
    }
}
