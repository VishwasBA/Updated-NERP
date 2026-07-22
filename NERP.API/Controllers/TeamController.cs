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
        var managerRole = User.FindFirstValue("userRole")!;

        List<Employee> reports = new();
        List<Employee> subReports = new();

        if (managerRole == "admin")
        {
            reports = await _db.Employees
                .AsNoTracking()
                .Include(e => e.RecognitionsGiven)
                .Include(e => e.RecognitionsReceived)
                .ToListAsync();
        }
        else
        {
            reports = await _db.Employees
                .AsNoTracking()
                .Where(e => e.ManagerId == managerId)
                .Include(e => e.RecognitionsGiven)
                .Include(e => e.RecognitionsReceived)
                .ToListAsync();

            if (managerRole == "bu_manager")
            {
                var cuIds = reports.Select(e => e.Id).ToList();
                subReports = await _db.Employees
                    .AsNoTracking()
                    .Where(e => e.ManagerId.HasValue && cuIds.Contains(e.ManagerId.Value))
                    .Include(e => e.RecognitionsGiven)
                    .Include(e => e.RecognitionsReceived)
                    .ToListAsync();
            }
        }

        var reportIds = reports.Select(e => e.Id).Concat(subReports.Select(s => s.Id)).ToHashSet();

        if (reportIds.Count == 0)
        {
            return Ok(new ManagerDashboardDto());
        }

        var receivedRecognitions = await _db.Recognitions
            .AsNoTracking()
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Where(r => reportIds.Contains(r.ToEmployeeId))
            .ToListAsync();

        var approvedReceived = receivedRecognitions.Where(r => r.Status == "approved" || r.Status == "Approved" || r.Status == "Approved Winner").ToList();

        var allEmployees = reports.Concat(subReports).ToList();

        var employeesWithoutRecognition = allEmployees
            .Where(e => e.TotalPoints == 0 && (e.RecognitionsReceived == null || !e.RecognitionsReceived.Any(r => r.Status == "approved" || r.Status == "Approved" || r.Status == "Approved Winner")))
            .Select(e => new EmployeeWithoutRecognitionDto
            {
                Id = e.Id,
                Name = e.Name,
                Department = e.Department,
                Avatar = e.Avatar,
                DaysSinceLastAppreciation = null,
                CurrentPoints = 0
            })
            .ToList();

        var stats = new ManagerDashboardStatsDto
        {
            TotalTeamMembers = reports.Count + subReports.Count,
            AppreciatedEmployees = approvedReceived.Select(r => r.ToEmployeeId).Distinct().Count(),
            EmployeesWithoutRecognition = employeesWithoutRecognition.Count,
            PendingNominations = receivedRecognitions.Count(r => r.Type == "nomination" && (r.Status == "Pending BU Approval" || r.Status == "Pending BU Review" || r.Status == "BU Shortlisted")),
            TotalTeamPoints = reports.Sum(e => e.TotalPoints) + subReports.Sum(e => e.TotalPoints)
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
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType }
            })
            .ToList();


        List<TeamMemberDto> members;
        if (managerRole == "admin")
        {
            var roots = reports.Where(e => e.ManagerId == managerId).ToList();
            members = roots.Select(e => MapToTeamMemberDto(e, reports)).ToList();
        }
        else
        {
            members = reports.Select(e => MapToTeamMemberDto(e, allEmployees)).ToList();
        }

        var topPerformers = members.OrderByDescending(m => m.Points).Take(5).ToList();
        var bottomPerformers = members.OrderBy(m => m.Points).Take(5).ToList();

        return Ok(new ManagerDashboardDto
        {
            Stats = stats,
            RecentAppreciations = recentAppreciations,
            EmployeesWithoutRecognition = employeesWithoutRecognition,
            TopPerformers = topPerformers,
            BottomPerformers = bottomPerformers,
            Members = members.OrderByDescending(m => m.Points).ToList()
        });
    }

    private static TeamMemberDto MapToTeamMemberDto(Employee e, List<Employee> allList)
    {
        var givenCount = e.RecognitionsGiven != null ? e.RecognitionsGiven.Count(r => r.Status == "approved" || r.Status == "Approved" || r.Status == "Approved Winner") : 0;
        var receivedCount = e.RecognitionsReceived != null ? e.RecognitionsReceived.Count(r => r.Status == "approved" || r.Status == "Approved" || r.Status == "Approved Winner") : 0;
        var awardsCount = e.RecognitionsReceived != null ? e.RecognitionsReceived.Count(r => r.Type == "nomination" && (r.Status == "Approved" || r.Status == "Approved Winner")) : 0;

        return new TeamMemberDto
        {
            Id = e.Id,
            Name = e.Name,
            Role = e.Role,
            Department = e.Department,
            Avatar = e.Avatar,
            AppreciationsGiven = givenCount,
            AppreciationsReceived = receivedCount,
            Points = e.TotalPoints,
            RecognitionCount = receivedCount,
            AwardsCount = awardsCount,
            ManagerId = e.ManagerId,
            Reports = allList
                .Where(child => child.ManagerId == e.Id)
                .Select(child => MapToTeamMemberDto(child, allList))
                .ToList()
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
            Points = e.TotalPoints,
            RecognitionCount = e.RecognitionsReceived.Count(r => r.Status == "approved" || r.Status == "Approved" || r.Status == "Approved Winner"),
            AwardsCount = e.RecognitionsReceived.Count(r => r.Type == "nomination" && (r.Status == "Approved" || r.Status == "Approved Winner"))
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
        var managerRole = User.FindFirstValue("userRole")!;
        var query = _db.Employees.AsNoTracking().Where(e => e.ManagerId == null);

        if (managerRole == "cu_manager")
        {
            query = query.Where(e => e.UserRole == "employee");
        }
        else if (managerRole == "bu_manager")
        {
            query = query.Where(e => e.UserRole == "cu_manager");
        }
        else
        {
            query = query.Where(e => e.UserRole == "employee");
        }

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
                Points = e.TotalPoints,
                RecognitionCount = 0,
                AwardsCount = 0
            })
            .Take(50)
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost("members/{employeeId}")]
    public async Task<IActionResult> AddTeamMember(int employeeId)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var managerRole = User.FindFirstValue("userRole")!;
        var employee = await _db.Employees.FindAsync(employeeId);
        if (employee == null) return NotFound(new { message = "Employee not found." });

        if (employee.Id == managerId)
            return BadRequest(new { message = "You can't add yourself to your own team." });

        if (employee.ManagerId != null)
            return BadRequest(new { message = "This employee already reports to a manager. Ask an admin to reassign them." });

        if (managerRole == "cu_manager" && employee.UserRole != "employee")
        {
            return BadRequest(new { message = "Only employees can report directly to a CU Manager." });
        }
        if (managerRole == "bu_manager" && employee.UserRole != "cu_manager")
        {
            return BadRequest(new { message = "Only CU Managers can report directly to a BU Manager." });
        }
        if (managerRole != "cu_manager" && managerRole != "bu_manager" && employee.UserRole != "employee")
        {
            return BadRequest(new { message = "Only employees can report to you." });
        }

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
