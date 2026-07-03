using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeamController(AppDbContext db) => _db = db;

    // Team = everyone in the manager's department. Good enough until a
    // dedicated manager->reports mapping exists in the schema.
    [HttpGet]
    public async Task<IActionResult> GetMyTeam()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var me = await _db.Employees.FindAsync(userId);
        if (me == null) return NotFound(new { message = "User not found" });

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var teammates = await _db.Employees
            .Where(e => e.Department == me.Department && e.Id != me.Id)
            .Include(e => e.RecognitionsGiven)
            .Include(e => e.RecognitionsReceived)
            .ToListAsync();

        var members = teammates.Select(e => new TeamMemberDto
        {
            Id = e.Id,
            Name = e.Name,
            Avatar = e.Avatar,
            Role = e.Role,
            Department = e.Department,
            AppreciationsGiven = e.RecognitionsGiven.Count,
            AppreciationsReceived = e.RecognitionsReceived.Count,
            Points = e.TotalPoints
        })
        .OrderByDescending(m => m.Points)
        .ToList();

        var monthAppreciations = teammates
            .SelectMany(e => e.RecognitionsReceived)
            .Count(r => r.CreatedAt >= startOfMonth);

        var pointsDistributed = teammates
            .SelectMany(e => e.RecognitionsReceived)
            .Where(r => r.CreatedAt >= startOfMonth)
            .Sum(r => r.Points);

        var allDeptsByPoints = await _db.Employees
            .GroupBy(e => e.Department)
            .Select(g => new { Department = g.Key, Points = g.Sum(e => e.TotalPoints) })
            .OrderByDescending(g => g.Points)
            .ToListAsync();

        var teamRank = allDeptsByPoints.FindIndex(d => d.Department == me.Department) + 1;

        return Ok(new TeamSummaryDto
        {
            TeamMembers = members.Count,
            ThisMonthAppreciations = monthAppreciations,
            PointsDistributed = pointsDistributed,
            TeamRank = teamRank <= 0 ? members.Count + 1 : teamRank,
            Members = members
        });
    }
}
