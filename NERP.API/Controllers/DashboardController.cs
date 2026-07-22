using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using Microsoft.Extensions.Logging;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ILogger<DashboardController> _logger;
    private const string CacheKey = "dashboard:shared";

    public DashboardController(AppDbContext db, IMemoryCache cache, ILogger<DashboardController> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    // Everything in here is IDENTICAL for every user — only the
    // requester's own rank differs. Cached for a short window so 200
    // people opening the dashboard around the same time share one set of
    // queries instead of each running all 8.
    private record DashboardSharedData(
        int TotalRecognitions,
        int ApprovedRecognitionsCount,
        int TotalPointsAwarded,
        int UniqueRecognizedEmployees,
        int ActiveEmployees,
        int MonthlyPoints,
        List<LeaderboardEntryDto> TopPerformers,
        List<(int Id, int Points)> PointsByEmployee,
        List<RecognitionSummaryDto> RecentRecognitions,
        List<TrendPointDto> AppreciationsOverTime,
        List<CategoryCountDto> TopCategories);

    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation("GetSummary API started.");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var shared = await _cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(15);
            return await BuildSharedDataAsync();
        });

        var currentUserRank = shared!.PointsByEmployee.FindIndex(x => x.Id == userId) + 1;
        if (currentUserRank == 0)
        {
            currentUserRank = shared.PointsByEmployee.Count + 1;
        }

        var summary = new DashboardSummaryDto
        {
            TotalRecognitions = shared.TotalRecognitions,
            TotalPointsAwarded = shared.TotalPointsAwarded,
            UniqueRecognizedEmployees = shared.UniqueRecognizedEmployees,
            ActiveEmployees = shared.ActiveEmployees,
            MonthlyPoints = shared.MonthlyPoints,
            RecognitionsCount = shared.ApprovedRecognitionsCount,
            CurrentUserRank = currentUserRank,
            TopPerformers = shared.TopPerformers,
            RecentRecognitions = shared.RecentRecognitions,
            AppreciationsOverTime = shared.AppreciationsOverTime,
            TopCategories = shared.TopCategories
        };

        sw.Stop();
        _logger.LogInformation("GetSummary API completed in {ElapsedMs}ms total", sw.ElapsedMilliseconds);
        return Ok(summary);
    }

    private async Task<DashboardSharedData> BuildSharedDataAsync()
    {
        var utcNow = DateTime.UtcNow;
        var currentMonthStart = new DateTime(utcNow.Year, utcNow.Month, 1);
        var nextMonthStart = currentMonthStart.AddMonths(1);

        // Execute queries sequentially on the same DbContext to avoid
        // concurrent operations which EF Core's DbContext does not allow.
        var totalRecognitions = await _db.Recognitions.AsNoTracking().CountAsync();
        var approvedRecognitionsCount = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Status == "approved").CountAsync();
        var totalPointsAwarded = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "nomination" && r.Status == "approved")
            .SumAsync(r => (int?)r.Points) ?? 0;
        var uniqueRecognizedEmployees = await _db.Recognitions.AsNoTracking()
            .Select(r => r.ToEmployeeId)
            .Distinct()
            .CountAsync();
        var activeEmployees = await _db.Employees.AsNoTracking().CountAsync();
        var monthlyPoints = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "nomination" && r.Status == "approved" && r.CreatedAt >= currentMonthStart && r.CreatedAt < nextMonthStart)
            .SumAsync(r => (int?)r.Points) ?? 0;

        var topPerformers = await _db.Employees.AsNoTracking()
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Department,
                e.Role,
                Points = _db.Recognitions
                    .Where(r => r.ToEmployeeId == e.Id && r.Type == "nomination" && r.Status == "approved")
                    .Sum(r => (int?)r.Points) ?? 0
            })
            .OrderByDescending(x => x.Points)
            .ThenBy(x => x.Name)
            .Take(5)
            .ToListAsync();

        var pointsByEmployee = await _db.Employees.AsNoTracking()
            .Select(e => new
            {
                e.Id,
                Points = _db.Recognitions
                    .Where(r => r.ToEmployeeId == e.Id && r.Type == "nomination" && r.Status == "approved")
                    .Sum(r => (int?)r.Points) ?? 0
            })
            .OrderByDescending(x => x.Points)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var recentRecognitions = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "appreciation" || (r.Type == "nomination" && r.Status == "approved"))
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecognitionSummaryDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                FromEmployee = new EmployeeDto
                {
                    Id = r.FromEmployee.Id,
                    Name = r.FromEmployee.Name,
                    Department = r.FromEmployee.Department,
                    Role = r.FromEmployee.Role,
                    Email = r.FromEmployee.Email,
                    UserRole = r.FromEmployee.UserRole,
                    TotalPoints = r.FromEmployee.TotalPoints,
                    Location = r.FromEmployee.Location,
                    BirthDate = r.FromEmployee.BirthDate,
                    JoiningDate = r.FromEmployee.JoiningDate
                },
                ToEmployee = new EmployeeDto
                {
                    Id = r.ToEmployee.Id,
                    Name = r.ToEmployee.Name,
                    Department = r.ToEmployee.Department,
                    Role = r.ToEmployee.Role,
                    Email = r.ToEmployee.Email,
                    UserRole = r.ToEmployee.UserRole,
                    TotalPoints = r.ToEmployee.TotalPoints,
                    Location = r.ToEmployee.Location,
                    BirthDate = r.ToEmployee.BirthDate,
                    JoiningDate = r.ToEmployee.JoiningDate
                },
                Message = r.Message,
                CategoryId = r.CategoryId,
                Category = r.Category == null ? null : new RecognitionCategoryDto
                {
                    Id = r.Category.Id,
                    Name = r.Category.Name,
                    Icon = r.Category.Icon
                },
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                Type = r.Type,
                Status = r.Status
            })
            .ToListAsync();

        var since = utcNow.AddMonths(-6);

        // Fetch recent 6 months data for trend and categories
        var allRecognitionsForStats = await _db.Recognitions.AsNoTracking()
            .Where(r => r.CreatedAt >= since && r.Status == "approved")
            .Select(r => new { r.CreatedAt, CategoryName = r.Category != null ? r.Category.Name : "Appreciation" })
            .ToListAsync();

        var overTime = new List<TrendPointDto>();
        for (int i = 5; i >= 0; i--)
        {
            var d = utcNow.AddMonths(-i);
            var label = d.ToString("MMM");
            var count = allRecognitionsForStats.Count(r => r.CreatedAt.Year == d.Year && r.CreatedAt.Month == d.Month);
            overTime.Add(new TrendPointDto { Label = label, Value = count });
        }

        var topCategories = allRecognitionsForStats
            .GroupBy(r => r.CategoryName)
            .Select(g => new CategoryCountDto { Name = g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .Take(6)
            .ToList();

        return new DashboardSharedData(
            totalRecognitions,
            approvedRecognitionsCount,
            totalPointsAwarded,
            uniqueRecognizedEmployees,
            activeEmployees,
            monthlyPoints,
            topPerformers.Select(x => new LeaderboardEntryDto
            {
                Id = x.Id,
                Name = x.Name,
                Department = x.Department,
                Role = x.Role,
                Points = x.Points
            }).ToList(),
            pointsByEmployee.Select(x => (x.Id, x.Points)).ToList(),
            recentRecognitions,
            overTime,
            topCategories);
    }
}
