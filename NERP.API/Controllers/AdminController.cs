using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using EmployeeRecognition.API.Services;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly MilestoneNotificationService _milestoneService;

    public AdminController(AppDbContext db, MilestoneNotificationService milestoneService)
    {
        _db = db;
        _milestoneService = milestoneService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] string? department)
    {
        var query = _db.Employees.AsQueryable();
        if (!string.IsNullOrEmpty(role) && role != "all") query = query.Where(e => e.UserRole == role);
        if (!string.IsNullOrEmpty(department) && department != "all") query = query.Where(e => e.Department == department);

        var users = await query
            .OrderBy(e => e.Name)
            .Select(e => new AdminUserDto
            {
                Id = e.Id,
                Name = e.Name,
                Email = e.Email,
                UserRole = e.UserRole,
                Department = e.Department,
                IsActive = e.IsActive,
                ManagerId = e.ManagerId,
                ManagerName = e.Manager != null ? e.Manager.Name : null
            })
            .ToListAsync();

        return Ok(users);
    }

    // Employees eligible to be picked as "manager" in the assign-manager
    // dropdown. Anyone with userRole manager or admin qualifies.
    [HttpGet("managers")]
    public async Task<IActionResult> GetManagerOptions()
    {
        var managers = await _db.Employees
            .Where(e => e.UserRole == "cu_manager" || e.UserRole == "bu_manager" || e.UserRole == "admin")
            .OrderBy(e => e.Name)
            .Select(e => new ManagerOptionDto { Id = e.Id, Name = e.Name, Department = e.Department })
            .ToListAsync();

        return Ok(managers);
    }

    [HttpPatch("users/{id}/manager")]
    public async Task<IActionResult> UpdateManager(int id, [FromBody] UpdateUserManagerRequest req)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "User not found" });

        if (req.ManagerId.HasValue)
        {
            if (req.ManagerId.Value == id)
                return BadRequest(new { message = "An employee cannot be their own manager." });

            var manager = await _db.Employees.FindAsync(req.ManagerId.Value);
            if (manager == null) return BadRequest(new { message = "Selected manager was not found." });
            if (manager.UserRole != "cu_manager" && manager.UserRole != "bu_manager" && manager.UserRole != "admin")
                return BadRequest(new { message = "Selected employee is not a manager or admin." });


            // Prevent creating a reporting cycle (e.g. assigning someone's
            // own descendant as their manager).
            var cursor = manager.ManagerId;
            var guard = 0;
            while (cursor.HasValue && guard++ < 100)
            {
                if (cursor.Value == id)
                    return BadRequest(new { message = "This assignment would create a circular reporting chain." });
                cursor = (await _db.Employees.FindAsync(cursor.Value))?.ManagerId;
            }
        }

        employee.ManagerId = req.ManagerId;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequest req)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "User not found" });

        employee.UserRole = req.UserRole;

        // An "employee" can't have direct reports — if someone is demoted
        // out of manager/admin, whoever reported to them needs to be
        // re-assigned by an admin rather than silently keep pointing at a
        // manager who can no longer act on the Manager Dashboard.
        if (req.UserRole == "employee")
        {
            var directReports = await _db.Employees.Where(e => e.ManagerId == id).ToListAsync();
            foreach (var report in directReports)
            {
                report.ManagerId = null;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPatch("users/{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest req)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "User not found" });

        employee.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "User not found" });

        // The Manager->DirectReports FK is Restrict (deliberately — deleting
        // a manager should never silently cascade-delete their reports). So
        // before removing this employee, un-assign anyone who currently
        // reports to them; otherwise SaveChanges would throw a constraint
        // violation the admin has no way to interpret from the UI.
        var directReports = await _db.Employees.Where(e => e.ManagerId == id).ToListAsync();
        foreach (var report in directReports)
        {
            report.ManagerId = null;
        }

        // Remove any recognitions that reference this employee (either as sender or receiver)
        var recognitions = await _db.Recognitions
            .Where(r => r.FromEmployeeId == id || r.ToEmployeeId == id)
            .ToListAsync();

        if (recognitions.Any())
        {
            _db.Recognitions.RemoveRange(recognitions);
        }

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("trigger-milestones")]
    public async Task<IActionResult> TriggerMilestones()
    {
        await _milestoneService.ProcessMilestonesAsync();
        return Ok(new { success = true, message = "Milestones scan triggered and completed successfully." });
    }
}
