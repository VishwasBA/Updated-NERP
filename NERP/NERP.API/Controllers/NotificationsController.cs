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
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public NotificationsController(AppDbContext db) => _db = db;

    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = CurrentUserId();
        var notifications = await _db.Notifications
            .Where(n => n.EmployeeId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    // NEW, additive endpoint (does not change GetAll above). Powers the
    // Wall of Fame "Milestones" tab with org-wide birthday / work
    // anniversary cards for every employee, sourced from the same
    // Notifications rows the milestone scheduler already writes — no
    // dummy data, no new tables.
    [HttpGet("milestones/feed")]
    public async Task<IActionResult> GetMilestonesFeed([FromQuery] string? type = null)
    {
        var query = _db.Notifications
            .AsNoTracking()
            .Where(n => n.Type == "birthday" || n.Type == "anniversary");

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            query = query.Where(n => n.Type == type);
        }

        var feed = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new MilestoneFeedItemDto
            {
                Id = n.Id,
                EmployeeId = n.EmployeeId,
                EmployeeName = n.Employee.Name,
                Department = n.Employee.Department,
                Role = n.Employee.Role,
                Location = n.Employee.Location,
                Avatar = n.Employee.Avatar,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(feed);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = CurrentUserId();
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.EmployeeId == userId);
        if (notification == null) return NotFound(new { message = "Notification not found" });

        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = CurrentUserId();
        var notifications = await _db.Notifications
            .Where(n => n.EmployeeId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in notifications) n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true, count = notifications.Count });
    }
}
