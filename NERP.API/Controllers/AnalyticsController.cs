using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin,manager")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    public AnalyticsController(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int months = 6)
    {
        // Same numbers for every admin/manager who opens this screen within
        // the same minute — cache per `months` value instead of re-scanning
        // and re-grouping the whole Recognitions/Employees tables per click.
        var cacheKey = $"analytics:overview:{months}";
        var result = await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60);
            return await BuildOverviewAsync(months);
        });

        return Ok(result);
    }

    private async Task<AnalyticsOverviewDto> BuildOverviewAsync(int months)
    {
        var since = DateTime.UtcNow.AddMonths(-months);

        var recognitions = await _db.Recognitions
            .Include(r => r.Category)
            .Include(r => r.ToEmployee)
            .Where(r => r.CreatedAt >= since)
            .ToListAsync();

        var totalAppreciations = recognitions.Count;
        // Only count points that were actually credited (approved), so this
        // matches Employee.TotalPoints / the dashboard leaderboard instead
        // of also counting still-pending or rejected nominations.
        var pointsIssued = recognitions.Where(r => r.Status == "approved").Sum(r => r.Points);
        var activeUsers = recognitions.Select(r => r.FromEmployeeId).Distinct().Count();

        var redemptions = await _db.RewardRedemptions.CountAsync();
        var redemptionRate = activeUsers == 0 ? 0 : Math.Round((double)redemptions / activeUsers * 100, 1);

        var overTime = recognitions
            .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new TrendPointDto
            {
                Label = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                Value = g.Count()
            })
            .ToList();

        var topCategories = recognitions
            .Where(r => r.Category != null)
            .GroupBy(r => r.Category!.Name)
            .Select(g => new CategoryCountDto { Name = g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .Take(5)
            .ToList();

        var employeeStats = await _db.Employees
            .Select(e => new
            {
                e.Department,
                HasGiven = e.RecognitionsGiven.Any(),
                ReceivedCount = e.RecognitionsReceived.Count
            })
            .ToListAsync();

        var deptEngagement = employeeStats
            .GroupBy(e => e.Department)
            .Select(g => new DepartmentEngagementDto
            {
                Department = g.Key,
                Employees = g.Count(),
                Recognitions = g.Sum(e => e.ReceivedCount),
                ParticipationRate = g.Count() == 0 ? 0 :
                    Math.Round((double)g.Count(e => e.HasGiven) / g.Count() * 100, 1)
            })
            .ToList();

        return new AnalyticsOverviewDto
        {
            TotalAppreciations = totalAppreciations,
            ActiveUsers = activeUsers,
            PointsIssued = pointsIssued,
            RedemptionRate = redemptionRate,
            AppreciationsOverTime = overTime,
            TopCategories = topCategories,
            DepartmentEngagement = deptEngagement
        };
    }
}
