using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Errors;
using MiniJira.Api.Models;

namespace MiniJira.Api.Services;

public sealed class AdminUsersService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
        { "USER", "MANAGER", "ADMIN" };

    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public AdminUsersService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<PagedResponse<AdminUserDto>> ListAsync(string? query, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 5, 100);

        var q = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var s = query.Trim().ToLower();
            q = q.Where(u =>
                (u.Email != null && u.Email.ToLower().Contains(s)) ||
                (u.Name != null && u.Name.ToLower().Contains(s)));
        }

        var total = await q.CountAsync();

        var users = await q
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var depIds = users.Where(u => u.DepartmentId != null).Select(u => u.DepartmentId!).Distinct().ToList();
        var depMap = await _db.Departments.AsNoTracking()
            .Where(d => depIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name);

        var items = new List<AdminUserDto>(users.Count);

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            depMap.TryGetValue(u.DepartmentId ?? "", out var depName);

            items.Add(new AdminUserDto(
                u.Id,
                u.Email ?? "",
                u.Name ?? "",
                u.DepartmentId,
                depName,
                roles.ToList()
            ));
        }

        return new PagedResponse<AdminUserDto>
        {
            Page = page,
            PageSize = pageSize,
            Total = total,
            Items = items
        };
    }

    public async Task UpdateRolesAsync(string id, UpdateUserRolesRequest req)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) throw new ApiException(404, "User not found.");

        var desired = (req.Roles ?? Array.Empty<string>())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        if (desired.Any(r => !AllowedRoles.Contains(r)))
            throw new ApiException(400, "Invalid role in request.");

        if (desired.Count == 0) desired.Add("USER");

        var current = (await _userManager.GetRolesAsync(user)).Select(r => r.ToUpperInvariant()).ToList();

        var toRemove = current.Except(desired).ToList();
        var toAdd = desired.Except(current).ToList();

        if (toRemove.Count > 0)
        {
            var rem = await _userManager.RemoveFromRolesAsync(user, toRemove);
            if (!rem.Succeeded) throw new ApiException(400, string.Join("; ", rem.Errors.Select(e => e.Description)));
        }

        if (toAdd.Count > 0)
        {
            var add = await _userManager.AddToRolesAsync(user, toAdd);
            if (!add.Succeeded) throw new ApiException(400, string.Join("; ", add.Errors.Select(e => e.Description)));
        }
    }

    public async Task UpdateDepartmentAsync(string id, UpdateUserDepartmentRequest req)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) throw new ApiException(404, "User not found.");

        var depId = (req.DepartmentId ?? "").Trim();
        var depExists = await _db.Departments.AnyAsync(d => d.Id == depId);
        if (!depExists) throw new ApiException(400, "Unknown departmentId.");

        user.DepartmentId = depId;

        var upd = await _userManager.UpdateAsync(user);
        if (!upd.Succeeded) throw new ApiException(400, string.Join("; ", upd.Errors.Select(e => e.Description)));
    }

    public async Task ResetPasswordAsync(string id, ResetUserPasswordRequest req)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) throw new ApiException(404, "User not found.");

        var newPass = req.NewPassword ?? "";
        if (newPass.Length < 4) throw new ApiException(400, "Password too short.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var reset = await _userManager.ResetPasswordAsync(user, token, newPass);
        if (!reset.Succeeded) throw new ApiException(400, string.Join("; ", reset.Errors.Select(e => e.Description)));
    }
}
