using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private const string CacheKey = "employees:all";

    public EmployeesController(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Every user sees the exact same list (it's the leaderboard feed),
        // so one shared 30-second cache entry serves 200 people instead of
        // 200 people each triggering their own full-table scan + subquery.
        var employees = await _cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30);

            return await _db.Employees
                .AsNoTracking()
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Email = e.Email,
                    Department = e.Department,
                    Role = e.Role,
                    UserRole = e.UserRole,
                    TotalPoints = e.TotalPoints,
                    NominationCount = e.RecognitionsReceived.Count(r => r.Type == "nomination" && r.Status == "approved"),
                    Location = e.Location,
                    BirthDate = e.BirthDate,
                    JoiningDate = e.JoiningDate,
                    Avatar = e.Avatar,
                    ManagerId = e.ManagerId
                })
                .OrderByDescending(e => e.TotalPoints)
                .ToListAsync();
        });

        return Ok(employees);
    }
}
