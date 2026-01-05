using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.Models;

namespace MiniJira.Api.Services;

public class ProjectAccessService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public ProjectAccessService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<AppUser> GetUserAsync(string userId)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
        if (u == null) throw new KeyNotFoundException("User not found");
        return u;
    }

    public async Task<Project?> GetProjectAsync(string projectId)
        => await _db.Projects.Include(p => p.Department).FirstOrDefaultAsync(p => p.Id == projectId);

    public async Task<ProjectMemberRole?> GetMyRoleAsync(string projectId, string userId)
    {
        return await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId == userId)
            .Select(m => (ProjectMemberRole?)m.Role)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CanViewProjectAsync(Project project, AppUser user, IList<string> roles)
    {
        if (roles.Contains("ADMIN")) return true;

        var myRole = await GetMyRoleAsync(project.Id, user.Id);
        if (myRole != null) return true;

        if (roles.Contains("MANAGER") && user.DepartmentId != null && user.DepartmentId == project.DepartmentId)
            return true;

        return false;
    }

    public async Task<bool> CanManageProjectAsync(Project project, AppUser user, IList<string> roles)
    {
        if (roles.Contains("ADMIN")) return true;

        var myRole = await GetMyRoleAsync(project.Id, user.Id);
        if (myRole == ProjectMemberRole.OWNER) return true;

        if (roles.Contains("MANAGER") && user.DepartmentId != null && user.DepartmentId == project.DepartmentId)
            return true;

        return false;
    }

    public async Task<bool> CanManageMembersAsync(Project project, AppUser user, IList<string> roles)
    {
        if (roles.Contains("ADMIN")) return true;

        var myRole = await GetMyRoleAsync(project.Id, user.Id);
        return myRole == ProjectMemberRole.OWNER;
    }
}
