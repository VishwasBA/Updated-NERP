using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
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
    public DbSet<RecognitionLike> RecognitionLikes => Set<RecognitionLike>();
    public DbSet<RecognitionComment> RecognitionComments => Set<RecognitionComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // BUG FIX: SQL Server's datetime2 columns carry no timezone info,
        // so EF Core always hands back DateTime values with
        // Kind = Unspecified — even though we only ever write
        // DateTime.UtcNow into them. System.Text.Json only appends the "Z"
        // suffix (marking a value as UTC) when Kind == Utc; for
        // Kind == Unspecified it serializes e.g. "2026-07-05T02:30:00" with
        // no "Z". The browser's `new Date(...)` then parses that string as
        // LOCAL time instead of UTC, which silently shifts every timestamp
        // by exactly the browser's UTC offset — which is why every single
        // appreciation showed the same "~5h ago" (IST is UTC+5:30) no
        // matter how long ago it actually happened. This converter forces
        // Kind back to Utc on the way out of the database, for every
        // DateTime/DateTime? column on every entity, so the API always
        // emits a correct "...Z" timestamp.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(new ValueConverter<DateTime, DateTime>(
                        toDb => toDb,
                        fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc)));
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new ValueConverter<DateTime?, DateTime?>(
                        toDb => toDb,
                        fromDb => fromDb.HasValue ? DateTime.SpecifyKind(fromDb.Value, DateTimeKind.Utc) : fromDb));
                }
            }
        }

        modelBuilder.Entity<Recognition>()
            .HasOne(r => r.FromEmployee)
            .WithMany(e => e.RecognitionsGiven)
            .HasForeignKey(r => r.FromEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Email uniqueness was previously only enforced by an app-level
        // "does this email already exist?" check before insert in
        // AuthController.Register. Under concurrent requests that check is
        // a race condition: two requests can both pass the check before
        // either has saved, producing two accounts with the same email.
        // A unique index makes the database itself the source of truth.
        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.Email)
            .IsUnique();

        // Reporting hierarchy: self-referencing FK. Restrict delete so
        // removing a manager never cascades into silently deleting their
        // reports; AdminController explicitly re-parents/clears reports
        // before allowing a manager to be deleted.
        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Manager)
            .WithMany(e => e.DirectReports)
            .HasForeignKey(e => e.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.ManagerId);

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

        // Peer reviewer for 2-level-approval categories — same Restrict
        // reasoning as FromEmployee/ToEmployee above.
        modelBuilder.Entity<Recognition>()
            .HasOne(r => r.PeerReviewer)
            .WithMany()
            .HasForeignKey(r => r.PeerReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        // PERFORMANCE: these composite indexes replace five separate
        // single-column indexes that used to exist here (CreatedAt,
        // FromEmployeeId, ToEmployeeId, Status, Type individually).
        // SQL Server can only really use one single-column index per query,
        // so those forced a seek-then-sort-the-rest pattern for every real
        // query in this app, which always filters on a *combination* of
        // these columns and sorts by CreatedAt. Each index below is sized
        // to match an actual WHERE+ORDER BY shape seen in the controllers:
        //   - (ToEmployeeId, CreatedAt)       -> GetMy "received" direction
        //   - (FromEmployeeId, CreatedAt)     -> GetMy "sent" direction
        //   - (Type, Status, CreatedAt)       -> pending-nomination queue,
        //                                        GetRecognitions Type+Status,
        //                                        Dashboard's global point sums
        //   - (ToEmployeeId, Type, Status)    -> the per-employee leaderboard
        //                                        subquery (run once per row)
        //   - (Status, CreatedAt)             -> the public feed's default
        //                                        "approved only" query and
        //                                        Analytics' date-range scan
        modelBuilder.Entity<Recognition>()
            .HasIndex(r => new { r.ToEmployeeId, r.CreatedAt });
        modelBuilder.Entity<Recognition>()
            .HasIndex(r => new { r.FromEmployeeId, r.CreatedAt });
        modelBuilder.Entity<Recognition>()
            .HasIndex(r => new { r.Type, r.Status, r.CreatedAt });
        modelBuilder.Entity<Recognition>()
            .HasIndex(r => new { r.ToEmployeeId, r.Type, r.Status });
        modelBuilder.Entity<Recognition>()
            .HasIndex(r => new { r.Status, r.CreatedAt });

        // Reactions on the Recognition feed / Wall of Fame cards. Deleting
        // the recognition itself should clean up its likes/comments
        // (Cascade); deleting the liking/commenting employee should not
        // (Restrict — same reasoning as recognitions above, avoids
        // multiple-cascade-path errors on the Employee->* graph).
        modelBuilder.Entity<RecognitionLike>()
            .HasOne(l => l.Recognition)
            .WithMany(r => r.Likes)
            .HasForeignKey(l => l.RecognitionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RecognitionLike>()
            .HasOne(l => l.Employee)
            .WithMany()
            .HasForeignKey(l => l.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // One like per employee per recognition.
        modelBuilder.Entity<RecognitionLike>()
            .HasIndex(l => new { l.RecognitionId, l.EmployeeId })
            .IsUnique();

        modelBuilder.Entity<RecognitionComment>()
            .HasOne(c => c.Recognition)
            .WithMany(r => r.Comments)
            .HasForeignKey(c => c.RecognitionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RecognitionComment>()
            .HasOne(c => c.Employee)
            .WithMany()
            .HasForeignKey(c => c.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RecognitionComment>()
            .HasIndex(c => new { c.RecognitionId, c.CreatedAt });

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Employee)
            .WithMany()
            .HasForeignKey(n => n.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Both queried as "WHERE EmployeeId = X ORDER BY CreatedAt DESC" —
        // EF Core auto-indexes the bare FK column by convention, but that
        // alone doesn't cover the sort; this composite does both in one
        // index seek instead of seek-then-sort.
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.EmployeeId, n.CreatedAt });

        modelBuilder.Entity<RewardRedemption>()
            .HasOne(r => r.Employee)
            .WithMany()
            .HasForeignKey(r => r.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RewardRedemption>()
            .HasIndex(r => new { r.EmployeeId, r.CreatedAt });

        // The employee list/leaderboard default sort is
        // "ORDER BY TotalPoints DESC" — indexing it means that ordering
        // comes straight from the index instead of a full table sort as
        // the Employees table grows past a few hundred rows.
        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.TotalPoints);

        // Seed award categories — mirrors the HR "Policy & Category" sheet:
        // Kudos (instant, no approval, no points), Spot Awards (manager-
        // initiated, single Admin/HR approval, 500 pts — Self Development
        // instead accumulates 100 pts per training up to a 500 pt payout),
        // and the quarterly awards (manager -> peer manager -> Admin/HR,
        // i.e. 2-level approval).
        modelBuilder.Entity<AwardCategory>().HasData(
            new AwardCategory { Id = 1, Name = "Kudos", Description = "A simple gesture can brighten up someone's day — give a shout-out to recognize a peer for their work.", Points = 0, Icon = "👏", ManagerOnly = false, ApprovalLevel = 0 },
            new AwardCategory { Id = 2, Name = "Customer Focus", Description = "Any significant effort towards producing customer delight, internal or external, adding value to customers or stakeholders.", Points = 500, Icon = "🎯", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 3, Name = "Manages Ambiguity", Description = "Operating effectively even when things are not certain, or the way forward is not clear.", Points = 500, Icon = "🧭", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 4, Name = "Self Development", Description = "Learning & development award — points accumulate 100 per completed training, redeemable once you reach 500.", Points = 100, Icon = "📚", ManagerOnly = true, ApprovalLevel = 1, IsAccumulative = true, AccumulationIncrement = 100, AccumulationThreshold = 500 },
            new AwardCategory { Id = 5, Name = "Action Oriented", Description = "Taking on new opportunities and tough challenges with a sense of urgency, high energy and enthusiasm.", Points = 500, Icon = "⚡", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 6, Name = "Ensures Accountability", Description = "Taking responsibility, owning up to commitments and being answerable for your actions.", Points = 500, Icon = "🛡️", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 7, Name = "Drives Result", Description = "Consistently achieving results, even under tough circumstances.", Points = 500, Icon = "📈", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 8, Name = "Innovation Award", Description = "Innovative solution to overcome a challenge, or innovation of process.", Points = 500, Icon = "💡", ManagerOnly = true, ApprovalLevel = 1 },
            new AwardCategory { Id = 9, Name = "Employee of the Quarter", Description = "Demonstrate exemplary individual achievements, contributions, and outstanding job performance in a very demanding project or delivery.", Points = 2000, Icon = "🏆", ManagerOnly = true, ApprovalLevel = 2 },
            new AwardCategory { Id = 10, Name = "Rising Star", Description = "For new joinees — recognizes strong impact within their first 6 months.", Points = 3000, Icon = "🌟", ManagerOnly = true, ApprovalLevel = 2, RequiresRecentJoiner = true, RecentJoinerMaxMonths = 6 }
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
