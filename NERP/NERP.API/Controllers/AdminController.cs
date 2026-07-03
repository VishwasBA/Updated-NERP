using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

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
                IsActive = e.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequest req)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound(new { message = "User not found" });

        employee.UserRole = req.UserRole;
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
}
