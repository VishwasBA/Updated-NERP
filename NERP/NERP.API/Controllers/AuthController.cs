using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using EmployeeRecognition.API.Models;
using EmployeeRecognition.API.Services;
using System.Security.Claims;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuthService _auth;

    public AuthController(AppDbContext db, AuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Email == req.Email);
        if (employee == null || !BCrypt.Net.BCrypt.Verify(req.Password, employee.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        var token = _auth.GenerateToken(employee);
        return Ok(new AuthResponse
        {
            Token = token,
            User = MapToDto(employee)
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _db.Employees.AnyAsync(e => e.Email == req.Email))
            return BadRequest(new { message = "Email already registered" });

        var employee = new Employee
        {
            Name = req.Name,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Department = req.Department,
            Role = req.Role,
           UserRole = req.Role.ToLower() switch
          {
            "admin" => "admin",
            "manager" => "manager",
                     _=> "employee"
        },
            Avatar = string.Concat(req.Name.Split(' ').Select(w => w[0])).ToUpper()
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        var token = _auth.GenerateToken(employee);
        return Ok(new AuthResponse
        {
            Token = token,
            User = MapToDto(employee)
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employee = await _db.Employees.FindAsync(userId);
        if (employee == null) return NotFound();
        return Ok(MapToDto(employee));
    }

    private static EmployeeDto MapToDto(Employee e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Email = e.Email,
        Department = e.Department,
        Role = e.Role,
        UserRole = e.UserRole,
        TotalPoints = e.TotalPoints,
        Avatar = e.Avatar
    };
}
