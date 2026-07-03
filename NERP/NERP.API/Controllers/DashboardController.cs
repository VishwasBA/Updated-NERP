using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var utcNow = DateTime.UtcNow;
        var currentMonthStart = new DateTime(utcNow.Year, utcNow.Month, 1);
        var nextMonthStart = currentMonthStart.AddMonths(1);

        // Execute queries sequentially on the same DbContext to avoid
        // concurrent operations which EF Core's DbContext does not allow.
        var totalRecognitions = await _db.Recognitions.AsNoTracking().CountAsync();
        var approvedRecognitionsCount = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Status == "approved").CountAsync();
        var totalPointsAwarded = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "nomination")
            .SumAsync(r => (int?)r.Points) ?? 0;
        var uniqueRecognizedEmployees = await _db.Recognitions.AsNoTracking()
            .Select(r => r.ToEmployeeId)
            .Distinct()
            .CountAsync();
        var activeEmployees = await _db.Employees.AsNoTracking().CountAsync();
        var monthlyPoints = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "nomination" && r.CreatedAt >= currentMonthStart && r.CreatedAt < nextMonthStart)
            .SumAsync(r => (int?)r.Points) ?? 0;

        var topPerformers = await _db.Employees
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Avatar,
                e.Department,
                Points = _db.Recognitions
                    .Where(r => r.ToEmployeeId == e.Id && r.Type == "nomination")
                    .Sum(r => (int?)r.Points) ?? 0
            })
            .OrderByDescending(x => x.Points)
            .ThenBy(x => x.Name)
            .Take(5)
            .ToListAsync();

        var pointsByEmployee = await _db.Employees
            .Select(e => new
            {
                e.Id,
                Points = _db.Recognitions
                    .Where(r => r.ToEmployeeId == e.Id && r.Type == "nomination")
                    .Sum(r => (int?)r.Points) ?? 0
            })
            .OrderByDescending(x => x.Points)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var currentUserRank = pointsByEmployee.FindIndex(x => x.Id == userId) + 1;
        if (currentUserRank == 0)
        {
            currentUserRank = pointsByEmployee.Count + 1;
        }

        var recentRecognitions = await _db.Recognitions
            .Where(r => r.Status == "approved")
            .OrderByDescending(r => r.CreatedAt)
            .Take(4)
            .Select(r => new RecognitionSummaryDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                FromEmployee = new EmployeeDto
                {
                    Id = r.FromEmployee.Id,
                    Name = r.FromEmployee.Name,
                    Avatar = r.FromEmployee.Avatar,
                    Department = r.FromEmployee.Department,
                    Role = r.FromEmployee.Role,
                    Email = r.FromEmployee.Email,
                    UserRole = r.FromEmployee.UserRole,
                    TotalPoints = r.FromEmployee.TotalPoints
                },
                ToEmployee = new EmployeeDto
                {
                    Id = r.ToEmployee.Id,
                    Name = r.ToEmployee.Name,
                    Avatar = r.ToEmployee.Avatar,
                    Department = r.ToEmployee.Department,
                    Role = r.ToEmployee.Role,
                    Email = r.ToEmployee.Email,
                    UserRole = r.ToEmployee.UserRole,
                    TotalPoints = r.ToEmployee.TotalPoints
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

        // summary variables (totalRecognitions, totalPointsAwarded, uniqueRecognizedEmployees,
        // activeEmployees, monthlyPoints, approvedRecognitionsCount) were already computed above.

        var summary = new DashboardSummaryDto
        {
            TotalRecognitions = totalRecognitions,
            TotalPointsAwarded = totalPointsAwarded,
            UniqueRecognizedEmployees = uniqueRecognizedEmployees,
            ActiveEmployees = activeEmployees,
            MonthlyPoints = monthlyPoints,
            RecognitionsCount = approvedRecognitionsCount,
            CurrentUserRank = currentUserRank,
            TopPerformers = topPerformers.Select(x => new LeaderboardEntryDto
            {
                Id = x.Id,
                Name = x.Name,
                Avatar = x.Avatar,
                Department = x.Department,
                Points = x.Points
            }).ToList(),
            RecentRecognitions = recentRecognitions
        };

        return Ok(summary);
    }
}
