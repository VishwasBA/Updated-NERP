using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Models;

namespace EmployeeRecognition.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AwardCategory> AwardCategories => Set<AwardCategory>();
    public DbSet<Recognition> Recognitions => Set<Recognition>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RewardRedemption> RewardRedemptions => Set<RewardRedemption>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Recognition>()
            .HasOne(r => r.FromEmployee)
            .WithMany(e => e.RecognitionsGiven)
            .HasForeignKey(r => r.FromEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Recognition>()
            .HasOne(r => r.ToEmployee)
            .WithMany(e => e.RecognitionsReceived)
            .HasForeignKey(r => r.ToEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Recognition>()
            .HasOne(r => r.Category)
            .WithMany()
            .HasForeignKey(r => r.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Employee)
            .WithMany()
            .HasForeignKey(n => n.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RewardRedemption>()
            .HasOne(r => r.Employee)
            .WithMany()
            .HasForeignKey(r => r.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed award categories
        modelBuilder.Entity<AwardCategory>().HasData(
            new AwardCategory { Id = 1, Name = "Star of the Month", Description = "Outstanding performance and dedication", Points = 500, Icon = "⭐", ManagerOnly = true },
            new AwardCategory { Id = 2, Name = "Employee of the Month", Description = "Consistently exceeds expectations", Points = 1000, Icon = "🏆", ManagerOnly = true },
            new AwardCategory { Id = 3, Name = "Team Player", Description = "Exceptional collaboration and teamwork", Points = 200, Icon = "🤝", ManagerOnly = false },
            new AwardCategory { Id = 4, Name = "Innovation Champion", Description = "Creative solutions and new ideas", Points = 300, Icon = "💡", ManagerOnly = true },
            new AwardCategory { Id = 5, Name = "Helping Hand", Description = "Goes above and beyond to help others", Points = 150, Icon = "🙌", ManagerOnly = false },
            new AwardCategory { Id = 6, Name = "Quick Learner", Description = "Rapid skill development and growth", Points = 100, Icon = "🚀", ManagerOnly = false }
        );

        // Seed a default admin user (password: Admin@123)
        modelBuilder.Entity<Employee>().HasData(
            new Employee
            {
                Id = 1,
                Name = "Admin User",
                Email = "admin@company.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Department = "HR",
                Role = "HR Manager",
                UserRole = "admin",
                TotalPoints = 0,
                Avatar = "AU"
            }
        );
    }
}
