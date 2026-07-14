using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "manager,admin")]
public class TeamController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeamController(AppDbContext db) => _db = db;

    // Everything here is scoped strictly to Employee.ManagerId == the
    // logged-in manager's Id — direct reports only, never the wider
    // department and never anyone further down the chain. This is the
    // hierarchy boundary the Manager Dashboard is required to respect.
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetManagerDashboard()
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var dto = await BuildManagerDashboardAsync(managerId);
        return Ok(dto);
    }

    // ---- Admin: cross-manager oversight ----
    // Admins generally have no direct reports of their own, so "My Team"
    // doesn't make sense for that role — instead they get a roster of every
    // manager in the org plus the ability to drill into any one manager's
    // team using the exact same dashboard shape as GetManagerDashboard.
    [HttpGet("all-teams")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAllTeams()
    {
        var managers = await _db.Employees
            .AsNoTracking()
            .Where(e => e.UserRole == "manager")
            .OrderBy(e => e.Name)
            .ToListAsync();

        var reportCounts = await _db.Employees
            .AsNoTracking()
            .Where(e => e.ManagerId != null)
            .GroupBy(e => e.ManagerId!.Value)
            .Select(g => new { ManagerId = g.Key, Count = g.Count(), TotalPoints = g.Sum(e => e.TotalPoints) })
            .ToListAsync();

        var reportsByManager = reportCounts.ToDictionary(g => g.ManagerId);

        var reportIdsByManager = await _db.Employees
            .AsNoTracking()
            .Where(e => e.ManagerId != null)
            .Select(e => new { e.Id, e.ManagerId })
            .ToListAsync();

        var approvedSet = (await _db.Recognitions
            .AsNoTracking()
            .Where(r => r.Status == "approved")
            .Select(r => r.ToEmployeeId)
            .ToListAsync()).ToHashSet();

        var pendingNomsByRecipient = await _db.Recognitions
            .AsNoTracking()
            .Where(r => r.Type == "nomination" && r.Status == "pending")
            .Select(r => r.ToEmployeeId)
            .ToListAsync();

        var result = managers.Select(m =>
        {
            var reportIds = reportIdsByManager.Where(r => r.ManagerId == m.Id).Select(r => r.Id).ToHashSet();
            reportsByManager.TryGetValue(m.Id, out var agg);

            return new AllTeamsEntryDto
            {
                ManagerId = m.Id,
                ManagerName = m.Name,
                Department = m.Department,
                Avatar = m.Avatar,
                TeamSize = reportIds.Count,
                AppreciatedEmployees = reportIds.Count(id => approvedSet.Contains(id)),
                EmployeesWithoutRecognition = reportIds.Count(id => !approvedSet.Contains(id)),
                PendingNominations = reportIds.Count(id => pendingNomsByRecipient.Contains(id)),
                TotalTeamPoints = agg?.TotalPoints ?? 0
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("all-teams/{managerId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetTeamForManager(int managerId)
    {
        var managerExists = await _db.Employees.AsNoTracking().AnyAsync(e => e.Id == managerId && e.UserRole == "manager");
        if (!managerExists) return NotFound(new { message = "Manager not found." });

        var dto = await BuildManagerDashboardAsync(managerId);
        return Ok(dto);
    }

    // Shared by both a manager viewing their own dashboard and an admin
    // drilling into a specific manager's team from "All Teams" — same
    // shape, same rules, just a different source for whose reports count.
    private async Task<ManagerDashboardDto> BuildManagerDashboardAsync(int managerId)
    {
        var reports = await _db.Employees
            .AsNoTracking()
            .Where(e => e.ManagerId == managerId)
            .Include(e => e.RecognitionsGiven)
            .Include(e => e.RecognitionsReceived)
            .ToListAsync();

        var reportIds = reports.Select(e => e.Id).ToHashSet();

        if (reportIds.Count == 0)
        {
            return new ManagerDashboardDto();
        }

        // All recognitions where a direct report is the recipient — this is
        // what "the team was appreciated" means for stats/trend/recent.
        var receivedRecognitions = await _db.Recognitions
            .AsNoTracking()
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Where(r => reportIds.Contains(r.ToEmployeeId))
            .ToListAsync();

        var approvedReceived = receivedRecognitions.Where(r => r.Status == "approved").ToList();

        var stats = new ManagerDashboardStatsDto
        {
            TotalTeamMembers = reports.Count,
            AppreciatedEmployees = approvedReceived.Select(r => r.ToEmployeeId).Distinct().Count(),
            EmployeesWithoutRecognition = reports.Count(e => !approvedReceived.Any(r => r.ToEmployeeId == e.Id)),
            PendingNominations = receivedRecognitions.Count(r => r.Type == "nomination" && r.Status == "pending"),
            TotalTeamPoints = reports.Sum(e => e.TotalPoints)
        };

        var recentAppreciations = receivedRecognitions
            .OrderByDescending(r => r.CreatedAt)
            .Take(8)
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon }
            })
            .ToList();

        var lastAppreciationByEmployee = approvedReceived
            .GroupBy(r => r.ToEmployeeId)
            .ToDictionary(g => g.Key, g => g.Max(r => r.CreatedAt));

        var employeesWithoutRecognition = reports
            .Select(e =>
            {
                lastAppreciationByEmployee.TryGetValue(e.Id, out var lastDate);
                var hasAny = lastAppreciationByEmployee.ContainsKey(e.Id);
                return new EmployeeWithoutRecognitionDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Department = e.Department,
                    Avatar = e.Avatar,
                    DaysSinceLastAppreciation = hasAny ? (int)(DateTime.UtcNow - lastDate).TotalDays : null,
                    CurrentPoints = e.TotalPoints
                };
            })
            // Never-appreciated first, then longest-waiting next.
            .OrderByDescending(e => e.DaysSinceLastAppreciation ?? int.MaxValue)
            .ToList();

        var members = reports
            .Select(e => new TeamMemberDto
            {
                Id = e.Id,
                Name = e.Name,
                Role = e.Role,
                Department = e.Department,
                Avatar = e.Avatar,
                AppreciationsGiven = e.RecognitionsGiven.Count(r => r.Status == "approved"),
                AppreciationsReceived = e.RecognitionsReceived.Count(r => r.Status == "approved"),
                Points = e.TotalPoints
            })
            .ToList();

        var topPerformers = members.OrderByDescending(m => m.Points).Take(5).ToList();
        var bottomPerformers = members.OrderBy(m => m.Points).Take(5).ToList();

        return new ManagerDashboardDto
        {
            Stats = stats,
            RecentAppreciations = recentAppreciations,
            EmployeesWithoutRecognition = employeesWithoutRecognition,
            TopPerformers = topPerformers,
            BottomPerformers = bottomPerformers,
            Members = members.OrderByDescending(m => m.Points).ToList()
        };
    }

    // Kept for backward compatibility with any existing "my team" widgets;
    // now scoped by direct-report hierarchy instead of department.
    [HttpGet]
    public async Task<IActionResult> GetMyTeam()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var reports = await _db.Employees
            .AsNoTracking()
            .Where(e => e.ManagerId == userId)
            .Include(e => e.RecognitionsGiven)
            .Include(e => e.RecognitionsReceived)
            .ToListAsync();

        var members = reports.Select(e => new TeamMemberDto
        {
            Id = e.Id,
            Name = e.Name,
            Role = e.Role,
            Department = e.Department,
            Avatar = e.Avatar,
            AppreciationsGiven = e.RecognitionsGiven.Count,
            AppreciationsReceived = e.RecognitionsReceived.Count,
            Points = e.TotalPoints
        })
        .OrderByDescending(m => m.Points)
        .ToList();

        var monthAppreciations = reports
            .SelectMany(e => e.RecognitionsReceived)
            .Count(r => r.CreatedAt >= startOfMonth);

        var pointsDistributed = reports
            .SelectMany(e => e.RecognitionsReceived)
            .Where(r => r.CreatedAt >= startOfMonth)
            .Sum(r => r.Points);

        return Ok(new TeamSummaryDto
        {
            TeamMembers = members.Count,
            ThisMonthAppreciations = monthAppreciations,
            PointsDistributed = pointsDistributed,
            TeamRank = 0,
            Members = members
        });
    }

    // ---- Manager self-service team membership ----
    // Distinct from Admin's cross-hierarchy "assign any manager to any
    // employee" — a manager can only pull in employees who don't already
    // report to someone, and can only remove people who report to
    // themselves. Reassigning someone already on another manager's team
    // stays an Admin-only action (AdminController.UpdateManager).

    [HttpGet("available-employees")]
    public async Task<IActionResult> GetAvailableEmployees([FromQuery] string? search = null)
    {
        var query = _db.Employees
            .AsNoTracking()
            .Where(e => e.ManagerId == null && e.UserRole == "employee");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(term) || e.Department.ToLower().Contains(term));
        }

        var results = await query
            .OrderBy(e => e.Name)
            .Select(e => new TeamMemberDto
            {
                Id = e.Id,
                Name = e.Name,
                Role = e.Role,
                Department = e.Department,
                Avatar = e.Avatar,
                Points = e.TotalPoints
            })
            .Take(50)
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost("members/{employeeId}")]
    public async Task<IActionResult> AddTeamMember(int employeeId)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employee = await _db.Employees.FindAsync(employeeId);
        if (employee == null) return NotFound(new { message = "Employee not found." });

        if (employee.Id == managerId)
            return BadRequest(new { message = "You can't add yourself to your own team." });

        if (employee.ManagerId != null)
            return BadRequest(new { message = "This employee already reports to a manager. Ask an admin to reassign them." });

        if (employee.UserRole != "employee")
            return BadRequest(new { message = "Only employees (not managers or admins) can be added as direct reports here." });

        employee.ManagerId = managerId;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("members/{employeeId}")]
    public async Task<IActionResult> RemoveTeamMember(int employeeId)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employee = await _db.Employees.FindAsync(employeeId);
        if (employee == null) return NotFound(new { message = "Employee not found." });

        if (employee.ManagerId != managerId)
            return Forbid();

        employee.ManagerId = null;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
