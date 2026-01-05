using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Errors;
using MiniJira.Api.Models;

namespace MiniJira.Api.Services;

public sealed class MeService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public MeService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<MeResponse> GetMeAsync(string userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new ApiException(StatusCodes.Status401Unauthorized, "User not found.");

        var depName = await _db.Departments.AsNoTracking()
            .Where(d => d.Id == user.DepartmentId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync();

        var roles = await _userManager.GetRolesAsync(user);

        return new MeResponse(
            user.Id,
            user.Email ?? "",
            user.Name ?? "",
            user.DepartmentId,
            depName,
            roles.ToList()
        );
    }
}