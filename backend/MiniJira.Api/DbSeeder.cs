using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Data;
using MiniJira.Api.Models;
using TaskStatus = MiniJira.Api.Models.TaskStatus;

namespace MiniJira.Api;

public static class DbSeeder
{
    
    private const string DemoPassword = "Demo123!";

    public static async Task SeedAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        
        

        await db.Database.EnsureCreatedAsync();

        // Roles
        foreach (var r in new[] { "USER", "MANAGER", "ADMIN" })
        {
            if (!await roleManager.RoleExistsAsync(r))
                await roleManager.CreateAsync(new IdentityRole(r));
        }
        

        // Departments
        var deps = new[]
        {
            new Department { Id = "dep_eng", Name = "Engineering" },
            new Department { Id = "dep_ops", Name = "Operations" },
            new Department { Id = "dep_sales", Name = "Sales" }
        };
        foreach (var d in deps)
        {
            if (!await db.Departments.AnyAsync(x => x.Id == d.Id))
                db.Departments.Add(d);
        }
        await db.SaveChangesAsync();

        // Demo users (password: Demo123!)
        await EnsureUserAsync(userManager, "u_user", "user@demo.com", "Demo User", "dep_eng", new[] { "USER" });
        await EnsureUserAsync(userManager, "u_mgr", "manager@demo.com", "Demo Manager", "dep_eng", new[] { "MANAGER" });
        await EnsureUserAsync(userManager, "u_admin", "admin@demo.com", "Demo Admin", "dep_ops", new[] { "ADMIN" });

        // Projects
        if (!await db.Projects.AnyAsync(p => p.Id == "p_acme"))
        {
            db.Projects.Add(new Project
            {
                Id = "p_acme",
                Key = "ACME",
                Name = "ACME Platform",
                DepartmentId = "dep_eng",
                Archived = false,
                CreatedAt = DateTime.UtcNow.AddDays(-12),
                CreatedByUserId = "u_user"
            });
        }
        if (!await db.Projects.AnyAsync(p => p.Id == "p_ops"))
        {
            db.Projects.Add(new Project
            {
                Id = "p_ops",
                Key = "OPS",
                Name = "Ops Dashboard",
                DepartmentId = "dep_ops",
                Archived = false,
                CreatedAt = DateTime.UtcNow.AddDays(-6),
                CreatedByUserId = "u_admin"
            });
        }
        await db.SaveChangesAsync();

        // Members (M:N + extra column Role)
        await EnsureMemberAsync(db, "p_acme", "u_user", ProjectMemberRole.OWNER);
        await EnsureMemberAsync(db, "p_acme", "u_mgr", ProjectMemberRole.MEMBER);
        await EnsureMemberAsync(db, "p_ops", "u_admin", ProjectMemberRole.OWNER);

        // Tasks
        await EnsureTaskAsync(db, new TaskItem
        {
            Id = "t_1",
            ProjectId = "p_acme",
            Title = "Implement JWT auth",
            Description = "Add login/register + JWT configuration + protected endpoints.",
            Status = TaskStatus.IN_PROGRESS,
            Priority = TaskPriority.HIGH,
            DueDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            CreatedByUserId = "u_user"
        });

        await EnsureTaskAsync(db, new TaskItem
        {
            Id = "t_2",
            ProjectId = "p_acme",
            Title = "Create ProjectMembers (M:N + role)",
            Description = "Join table with Role + JoinedAt.",
            Status = TaskStatus.TODO,
            Priority = TaskPriority.MEDIUM,
            DueDate = DateTime.UtcNow.AddDays(14),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            CreatedByUserId = "u_mgr"
        });

        await EnsureTaskAsync(db, new TaskItem
        {
            Id = "t_3",
            ProjectId = "p_ops",
            Title = "Add departments page",
            Description = "Admin-only CRUD for departments.",
            Status = TaskStatus.REVIEW,
            Priority = TaskPriority.LOW,
            DueDate = null,
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            CreatedByUserId = "u_admin"
        });

        // Assignees (M:N + extra column AssignedAt)
        await EnsureAssigneeAsync(db, "t_1", "u_user", "u_user");
        await EnsureAssigneeAsync(db, "t_2", "u_mgr", "u_user");
        await EnsureAssigneeAsync(db, "t_3", "u_admin", "u_admin");

        // Comments
        if (!await db.Comments.AnyAsync(c => c.Id == "c_1"))
        {
            db.Comments.Add(new Comment
            {
                Id = "c_1",
                TaskId = "t_1",
                AuthorUserId = "u_mgr",
                Body = "Keep access tokens short-lived; refresh tokens should be HttpOnly cookies in production.",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            });
            await db.SaveChangesAsync();
        }
    }

    private static async Task EnsureUserAsync(
        UserManager<AppUser> um,
        string id,
        string email,
        string name,
        string deptId,
        string[] roles)
    {
        var user = await um.FindByEmailAsync(email);

        if (user == null)
        {
            user = new AppUser
            {
                Id = id,
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                Name = name,
                DepartmentId = deptId
            };

            var created = await um.CreateAsync(user, DemoPassword);
            if (!created.Succeeded)
                throw new Exception("Seed user create failed: " +
                                    string.Join("; ", created.Errors.Select(e => e.Description)));
        }
        else
        {
            user.EmailConfirmed = true;
            user.Name = name;
            user.DepartmentId = deptId;

            var updated = await um.UpdateAsync(user);
            if (!updated.Succeeded)
                throw new Exception("Seed user update failed: " +
                                    string.Join("; ", updated.Errors.Select(e => e.Description)));

            // ✅ force known password even if user existed already
            var resetToken = await um.GeneratePasswordResetTokenAsync(user);
            var reset = await um.ResetPasswordAsync(user, resetToken, DemoPassword);
            if (!reset.Succeeded)
                throw new Exception("Seed user password reset failed: " +
                                    string.Join("; ", reset.Errors.Select(e => e.Description)));
        }

        foreach (var r in roles)
        {
            if (!await um.IsInRoleAsync(user, r))
            {
                var add = await um.AddToRoleAsync(user, r);
                if (!add.Succeeded)
                    throw new Exception($"Seed add role '{r}' failed for {email}: " +
                                        string.Join("; ", add.Errors.Select(e => e.Description)));
            }
        }
    }


    private static async Task EnsureMemberAsync(AppDbContext db, string projectId, string userId, ProjectMemberRole role)
    {
        var exists = await db.ProjectMembers.AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);
        if (!exists)
        {
            db.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = projectId,
                UserId = userId,
                Role = role,
                JoinedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
    }

    private static async Task EnsureTaskAsync(AppDbContext db, TaskItem task)
    {
        var exists = await db.Tasks.AnyAsync(t => t.Id == task.Id);
        if (!exists)
        {
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
        }
    }

    private static async Task EnsureAssigneeAsync(AppDbContext db, string taskId, string userId, string assignedBy)
    {
        var exists = await db.TaskAssignees.AnyAsync(a => a.TaskId == taskId && a.UserId == userId);
        if (!exists)
        {
            db.TaskAssignees.Add(new TaskAssignee
            {
                TaskId = taskId,
                UserId = userId,
                AssignedAt = DateTime.UtcNow,
                AssignedByUserId = assignedBy
            });
            await db.SaveChangesAsync();
        }
    }
}
