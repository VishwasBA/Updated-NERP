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
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Name, email, and password are required." });

        if (await _db.Employees.AnyAsync(e => e.Email == req.Email))
            return BadRequest(new { message = "Email already registered" });

        // SECURITY: Self-service registration must never grant elevated
        // privileges. The client-supplied "Role" is a job-title label only;
        // UserRole (the value actually used for authorization) is always
        // "employee" for public sign-ups. Promotions to manager/admin must
        // go through AdminController.UpdateRole, which requires an
        // authenticated admin.
        var initials = req.Name
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]));
        var avatar = string.Concat(initials);
        if (string.IsNullOrEmpty(avatar)) avatar = "NA";

        var employee = new Employee
        {
            Name = req.Name,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Department = req.Department,
            Role = req.Role,
            UserRole = "employee",
            Avatar = avatar
        };

        _db.Employees.Add(employee);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two concurrent registrations for the same email can both pass
            // the AnyAsync check above before either commits; the unique
            // index on Employee.Email is what actually prevents the
            // duplicate, and we turn that into a normal 400 instead of a
            // 500.
            return BadRequest(new { message = "Email already registered" });
        }

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

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employee = await _db.Employees.FindAsync(userId);
        if (employee == null) return NotFound();

        employee.Name = req.Name;
        employee.Department = req.Department;
        employee.Location = req.Location;
        employee.BirthDate = req.BirthDate;
        employee.JoiningDate = req.JoiningDate;
        employee.Avatar = req.Avatar;

        await _db.SaveChangesAsync();

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
        NominationCount = 0,
        Location = e.Location,
        BirthDate = e.BirthDate,
        JoiningDate = e.JoiningDate,
        Avatar = e.Avatar
    };
}
