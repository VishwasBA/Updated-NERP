using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin,manager")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AnalyticsController(AppDbContext db) => _db = db;

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int months = 6)
    {
        var since = DateTime.UtcNow.AddMonths(-months);

        var recognitions = await _db.Recognitions
            .Include(r => r.Category)
            .Include(r => r.ToEmployee)
            .Where(r => r.CreatedAt >= since)
            .ToListAsync();

        var totalAppreciations = recognitions.Count;
        var pointsIssued = recognitions.Sum(r => r.Points);
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

        return Ok(new AnalyticsOverviewDto
        {
            TotalAppreciations = totalAppreciations,
            ActiveUsers = activeUsers,
            PointsIssued = pointsIssued,
            RedemptionRate = redemptionRate,
            AppreciationsOverTime = overTime,
            TopCategories = topCategories,
            DepartmentEngagement = deptEngagement
        });
    }
}
