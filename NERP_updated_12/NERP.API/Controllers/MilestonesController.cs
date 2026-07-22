using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using EmployeeRecognition.API.Models;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MilestonesController(AppDbContext db) => _db = db;

    // Personal achievement grid for the logged-in employee: recurring
    // date-based milestones (birthday/anniversary) plus lifetime
    // points/appreciation-count thresholds. Everything here is derived
    // from real data — earned dates for points/appreciation milestones are
    // back-computed from the actual recognition history, not hardcoded.
    [HttpGet("me")]
    public async Task<IActionResult> GetMyMilestones()
    {
        var employeeId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == employeeId);
        if (employee == null) return NotFound();

        return Ok(await BuildMilestonesAsync(employee));
    }

    // Same achievement grid as GetMyMilestones, but for any employee — used
    // by the Employee Profile page (viewing a colleague, not yourself).
    // Everything here was already public-ish (recognition score, award
    // counts) or already surfaced org-wide elsewhere (birthdays/anniversaries
    // via the Wall of Fame milestones feed), so exposing it per-employee
    // doesn't leak anything new.
    [HttpGet("{employeeId:int}")]
    public async Task<IActionResult> GetEmployeeMilestones(int employeeId)
    {
        var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == employeeId);
        if (employee == null) return NotFound();

        return Ok(await BuildMilestonesAsync(employee));
    }

    private async Task<List<MilestoneDto>> BuildMilestonesAsync(Employee employee)
    {
        var employeeId = employee.Id;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var receivedApproved = await _db.Recognitions
            .AsNoTracking()
            .Where(r => r.ToEmployeeId == employeeId && r.Status == "approved")
            .OrderBy(r => r.CreatedAt)
            .Select(r => new { r.CreatedAt, r.Points, r.CategoryId })
            .ToListAsync();

        var milestones = new List<MilestoneDto>();

        // ---- Date-based recurring milestones ----
        // Per HR policy, Work Anniversary is only a named milestone at the
        // 3, 5, and 10 year marks (not every single year), so these are
        // three independent cards rather than one that re-fires annually.
        foreach (var yearsThreshold in new[] { 3, 5, 10 })
        {
            milestones.Add(BuildYearsOfServiceMilestone(
                key: $"work_anniversary_{yearsThreshold}",
                title: $"{yearsThreshold}-Year Work Anniversary",
                icon: yearsThreshold >= 10 ? "🏵️" : yearsThreshold >= 5 ? "🎖️" : "🎉",
                joiningDate: employee.JoiningDate,
                today: today,
                yearsThreshold: yearsThreshold));
        }

        milestones.Add(BuildDateMilestone(
            key: "birthday",
            title: "Birthday",
            icon: "🎂",
            anniversaryOf: employee.BirthDate,
            today: today,
            describe: _ => "Wishing you a fantastic day."));

        // ---- Points milestones ----
        foreach (var threshold in new[] { 100, 500, 1000 })
        {
            milestones.Add(BuildCumulativeMilestone(
                key: $"points_{threshold}",
                title: $"{threshold} Points",
                description: $"Earn {threshold} total recognition points.",
                icon: threshold >= 1000 ? "💎" : threshold >= 500 ? "🏅" : "⭐",
                category: "points",
                threshold: threshold,
                runningValues: receivedApproved.Select(r => (r.CreatedAt, (long)r.Points)).ToList(),
                progressLabelSuffix: "pts",
                currentTotal: employee.TotalPoints));
        }

        // ---- Appreciation-count milestones ----
        var appreciationSteps = new (int threshold, string title, string icon)[]
        {
            (1, "First Appreciation", "🌱"),
            (10, "10 Appreciations", "🔥"),
            (25, "25 Appreciations", "🚀"),
            (50, "50 Appreciations", "👑"),
        };
        foreach (var (threshold, title, icon) in appreciationSteps)
        {
            milestones.Add(BuildCumulativeMilestone(
                key: $"appreciations_{threshold}",
                title: title,
                description: $"Receive {threshold} appreciation{(threshold == 1 ? "" : "s")} from colleagues.",
                icon: icon,
                category: "appreciations",
                threshold: threshold,
                runningValues: receivedApproved.Select(r => (r.CreatedAt, 1L)).ToList(),
                progressLabelSuffix: "received",
                currentTotal: receivedApproved.Count));
        }

        // ---- Employee of the Quarter ----
        var eomCategory = await _db.AwardCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name == "Employee of the Quarter");

        var eomWins = eomCategory == null
            ? new List<DateTime>()
            : receivedApproved.Where(r => r.CategoryId == eomCategory.Id).Select(r => r.CreatedAt).ToList();

        milestones.Add(new MilestoneDto
        {
            Key = "employee_of_quarter",
            Title = "Employee of the Quarter",
            Description = "Awarded for exemplary individual achievement in a demanding project or delivery.",
            Icon = "🏆",
            Category = "award",
            Earned = eomWins.Count > 0,
            EarnedDate = eomWins.Count > 0 ? eomWins.Max() : null,
            ProgressPercent = eomWins.Count > 0 ? 100 : 0,
            ProgressLabel = eomWins.Count > 0 ? $"Won {eomWins.Count} time{(eomWins.Count == 1 ? "" : "s")}" : "Not yet awarded",
        });

        return milestones;
    }

    private static MilestoneDto BuildYearsOfServiceMilestone(
        string key, string title, string icon, DateOnly? joiningDate, DateOnly today, int yearsThreshold)
    {
        if (joiningDate == null)
        {
            return new MilestoneDto
            {
                Key = key,
                Title = title,
                Description = "Add your joining date in your profile to track this.",
                Icon = icon,
                Category = "date",
                Earned = false,
                ProgressPercent = 0,
                ProgressLabel = "Date not set",
            };
        }

        var joined = joiningDate.Value;
        var thisYearAnniversary = new DateOnly(today.Year, joined.Month, joined.Day == 29 && !DateTime.IsLeapYear(today.Year) ? 28 : joined.Day);
        var completedYears = today.Year - joined.Year - (today < thisYearAnniversary ? 1 : 0);

        var earned = completedYears >= yearsThreshold;
        var milestoneDate = joined.AddYears(yearsThreshold);
        var progress = earned ? 100 : Math.Clamp((int)Math.Round((double)Math.Max(completedYears, 0) / yearsThreshold * 100), 0, 100);

        return new MilestoneDto
        {
            Key = key,
            Title = title,
            Description = $"Celebrating {yearsThreshold} year{(yearsThreshold == 1 ? "" : "s")} with the company.",
            Icon = icon,
            Category = "date",
            Earned = earned,
            EarnedDate = earned ? milestoneDate.ToDateTime(TimeOnly.MinValue) : null,
            ProgressPercent = progress,
            ProgressLabel = earned ? "Reached" : $"{Math.Max(completedYears, 0)}/{yearsThreshold} years",
        };
    }

    private static MilestoneDto BuildDateMilestone(
        string key, string title, string icon, DateOnly? anniversaryOf, DateOnly today, Func<int, string> describe)
    {
        if (anniversaryOf == null)
        {
            return new MilestoneDto
            {
                Key = key,
                Title = title,
                Description = "Add this date in your profile to track it.",
                Icon = icon,
                Category = "date",
                Earned = false,
                ProgressPercent = 0,
                ProgressLabel = "Date not set",
            };
        }

        var baseDate = anniversaryOf.Value;
        var thisYear = new DateOnly(today.Year, baseDate.Month, baseDate.Day == 29 && !DateTime.IsLeapYear(today.Year) ? 28 : baseDate.Day);
        var years = today.Year - baseDate.Year;

        // "Earned" for the current cycle means the date has occurred at
        // some point this calendar year already (today is on/after it).
        var earnedThisYear = today >= thisYear;
        var lastOccurrence = earnedThisYear ? thisYear : thisYear.AddYears(-1);
        var nextOccurrence = earnedThisYear ? thisYear.AddYears(1) : thisYear;

        var totalSpan = (nextOccurrence.ToDateTime(TimeOnly.MinValue) - lastOccurrence.ToDateTime(TimeOnly.MinValue)).TotalDays;
        var elapsed = (today.ToDateTime(TimeOnly.MinValue) - lastOccurrence.ToDateTime(TimeOnly.MinValue)).TotalDays;
        var progress = totalSpan <= 0 ? 100 : Math.Clamp((int)Math.Round(elapsed / totalSpan * 100), 0, 100);

        return new MilestoneDto
        {
            Key = key,
            Title = title,
            Description = describe(years),
            Icon = icon,
            Category = "date",
            Earned = earnedThisYear && years >= 0,
            EarnedDate = earnedThisYear && years >= 0 ? thisYear.ToDateTime(TimeOnly.MinValue) : null,
            ProgressPercent = earnedThisYear ? 100 : progress,
            ProgressLabel = earnedThisYear
                ? "Celebrated this year"
                : $"{(nextOccurrence.ToDateTime(TimeOnly.MinValue) - today.ToDateTime(TimeOnly.MinValue)).Days} days to go",
        };
    }

    private static MilestoneDto BuildCumulativeMilestone(
        string key, string title, string description, string icon, string category,
        int threshold, List<(DateTime CreatedAt, long Value)> runningValues, string progressLabelSuffix, long currentTotal)
    {
        long running = 0;
        DateTime? earnedDate = null;
        foreach (var (createdAt, value) in runningValues)
        {
            running += value;
            if (running >= threshold)
            {
                earnedDate = createdAt;
                break;
            }
        }

        var earned = earnedDate.HasValue;
        var progress = earned ? 100 : (int)Math.Clamp(Math.Round((double)currentTotal / threshold * 100), 0, 100);

        return new MilestoneDto
        {
            Key = key,
            Title = title,
            Description = description,
            Icon = icon,
            Category = category,
            Earned = earned,
            EarnedDate = earnedDate,
            ProgressPercent = progress,
            ProgressLabel = earned ? "Completed" : $"{currentTotal}/{threshold} {progressLabelSuffix}",
        };
    }
}
