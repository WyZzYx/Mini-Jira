using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniJira.Api.Models;

namespace MiniJira.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskAssignee> TaskAssignees => Set<TaskAssignee>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Department>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(64);
            e.Property(x => x.Name).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<AppUser>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(128);
            e.Property(x => x.DepartmentId).HasMaxLength(64);
            e.HasOne(x => x.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Project>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(64);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Key).HasMaxLength(12).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.CreatedAt).IsRequired();

            e.Property(x => x.DepartmentId).HasMaxLength(64).IsRequired();
            e.HasOne(x => x.Department)
                .WithMany(d => d.Projects)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.Property(x => x.CreatedByUserId).HasMaxLength(255);
            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<ProjectMember>(e =>
        {
            e.HasKey(x => new { x.ProjectId, x.UserId });
            e.Property(x => x.ProjectId).HasMaxLength(64);
            e.Property(x => x.UserId).HasMaxLength(255);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(16).IsRequired();
            e.Property(x => x.JoinedAt).IsRequired();

            e.HasOne(x => x.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
                .WithMany(u => u.ProjectMemberships)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<TaskItem>(e =>
        {
            e.ToTable("Tasks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(64);
            e.Property(x => x.ProjectId).HasMaxLength(64).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Description).HasMaxLength(4000);

            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(24).IsRequired();
            e.Property(x => x.Priority).HasConversion<string>().HasMaxLength(24).IsRequired();

            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            e.Property(x => x.CreatedByUserId).HasMaxLength(255);
            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<TaskAssignee>(e =>
        {
            e.HasKey(x => new { x.TaskId, x.UserId });
            e.Property(x => x.TaskId).HasMaxLength(64);
            e.Property(x => x.UserId).HasMaxLength(255);
            e.Property(x => x.AssignedAt).IsRequired();
            e.Property(x => x.AssignedByUserId).HasMaxLength(255);

            e.HasOne(x => x.Task)
                .WithMany(t => t.Assignees)
                .HasForeignKey(x => x.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
                .WithMany(u => u.TaskAssignments)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.AssignedByUser)
                .WithMany()
                .HasForeignKey(x => x.AssignedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Comment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(64);
            e.Property(x => x.TaskId).HasMaxLength(64).IsRequired();
            e.Property(x => x.AuthorUserId).HasMaxLength(255);
            e.Property(x => x.Body).HasMaxLength(4000).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(x => x.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.AuthorUser)
                .WithMany()
                .HasForeignKey(x => x.AuthorUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
