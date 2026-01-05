using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.DTOs;
using MiniJira.Api.Errors;
using MiniJira.Api.Models;

namespace MiniJira.Api.Services;

public sealed class AdminDepartmentsService
{
    private readonly AppDbContext _db;

    public AdminDepartmentsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<DepartmentDto>> ListAsync()
    {
        return await _db.Departments
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name))
            .ToListAsync();
    }

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentRequest req)
    {
        var id = (req.Id ?? "").Trim();
        var name = (req.Name ?? "").Trim();

        if (name.Length < 2) throw new ApiException(400, "Department name too short.");

        if (string.IsNullOrWhiteSpace(id))
            id = $"dep_{Guid.NewGuid():N}";

        var exists = await _db.Departments.AnyAsync(d => d.Id == id);
        if (exists) throw new ApiException(409, "Department id already exists.");

        var dep = new Department { Id = id, Name = name };
        _db.Departments.Add(dep);
        await _db.SaveChangesAsync();

        return new DepartmentDto(dep.Id, dep.Name);
    }

    public async Task UpdateAsync(string id, UpdateDepartmentRequest req)
    {
        id = (id ?? "").Trim();
        if (string.IsNullOrWhiteSpace(id)) throw new ApiException(400, "Invalid department id.");

        var name = (req.Name ?? "").Trim();
        if (name.Length < 2) throw new ApiException(400, "Department name too short.");

        var dep = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id);
        if (dep == null) throw new ApiException(404, "Department not found.");

        dep.Name = name;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(string id)
    {
        id = (id ?? "").Trim();
        if (string.IsNullOrWhiteSpace(id)) throw new ApiException(400, "Invalid department id.");

        var dep = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id);
        if (dep == null) return; 

        var usedByUsers = await _db.Users.AnyAsync(u => u.DepartmentId == id);
        var usedByProjects = await _db.Projects.AnyAsync(p => p.DepartmentId == id);
        if (usedByUsers || usedByProjects)
            throw new ApiException(400, "Department is used by users/projects.");

        _db.Departments.Remove(dep);
        await _db.SaveChangesAsync();
    }
}
