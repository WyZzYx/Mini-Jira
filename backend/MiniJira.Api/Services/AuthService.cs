using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Errors;
using MiniJira.Api.Models;

namespace MiniJira.Api.Services;

public sealed class AuthService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signIn;
    private readonly JwtTokenService _jwt;

    public AuthService(AppDbContext db, UserManager<AppUser> userManager, SignInManager<AppUser> signIn, JwtTokenService jwt)
    {
        _db = db;
        _userManager = userManager;
        _signIn = signIn;
        _jwt = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains("@"))
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid email.");
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 4)
            throw new ApiException(StatusCodes.Status400BadRequest, "Password is too short.");
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length < 2)
            throw new ApiException(StatusCodes.Status400BadRequest, "Name is too short.");

        var depExists = await _db.Departments.AnyAsync(d => d.Id == req.DepartmentId);
        if (!depExists)
            throw new ApiException(StatusCodes.Status400BadRequest, "Unknown departmentId.");

        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
            throw new ApiException(StatusCodes.Status409Conflict, "User already exists.");

        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString("N"),
            UserName = req.Email,
            Email = req.Email,
            Name = req.Name,
            DepartmentId = req.DepartmentId,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            throw new ApiException(StatusCodes.Status400BadRequest, string.Join("; ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, "USER");
        var roles = await _userManager.GetRolesAsync(user);

        var (token, exp) = _jwt.CreateAccessToken(user, roles);
        return new AuthResponse(token, exp);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid credentials.");

        var ok = await _signIn.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: false);
        if (!ok.Succeeded)
            throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid credentials.");

        var roles = await _userManager.GetRolesAsync(user);
        var (token, exp) = _jwt.CreateAccessToken(user, roles);
        return new AuthResponse(token, exp);
    }
}
