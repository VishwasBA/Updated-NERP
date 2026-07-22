using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketplaceController : ControllerBase
{
    private readonly AppDbContext _db;

    public MarketplaceController(AppDbContext db)
    {
        _db = db;
    }

    // Sample product catalog. In a real app this would be stored in the DB.
    private static readonly ProductDto[] SampleProducts = new[]
    {
        new ProductDto { Id = 1, Title = "Coffee Mug", Description = "Branded ceramic mug", Price = 250, InStock = true },
        new ProductDto { Id = 2, Title = "Wireless Headphones", Description = "Noise-cancelling", Price = 3500, InStock = true },
        new ProductDto { Id = 3, Title = "Amazon Gift Card", Description = "$50 gift card", Price = 5000, InStock = true },
        new ProductDto { Id = 4, Title = "Extra Day Off", Description = "One paid day off", Price = 10000, InStock = true },
    };

    [HttpGet("products")]
    public IActionResult GetProducts()
    {
        return Ok(SampleProducts);
    }

    [Authorize]
    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] RedeemRequest req)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var employee = await _db.Employees.FindAsync(userId);
        if (employee == null) return NotFound(new { message = "User not found" });

        var product = SampleProducts.FirstOrDefault(p => p.Id == req.ProductId);
        if (product == null) return NotFound(new { message = "Product not found" });
        if (!product.InStock) return BadRequest(new { message = "Out of stock" });

        if (employee.TotalPoints < product.Price)
            return BadRequest(new { message = "Insufficient points" });

        employee.TotalPoints -= product.Price;

        _db.RewardRedemptions.Add(new Models.RewardRedemption
        {
            EmployeeId = employee.Id,
            ProductId = product.Id,
            ProductTitle = product.Title,
            Points = product.Price,
            Status = "processing"
        });

        await _db.SaveChangesAsync();

        return Ok(new RedeemResponse { Success = true, RemainingPoints = employee.TotalPoints });
    }

    [Authorize]
    [HttpGet("redeem/history")]
    public async Task<IActionResult> GetHistory()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var history = await _db.RewardRedemptions
            .Where(r => r.EmployeeId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.ProductTitle,
                r.Points,
                r.Status,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(history);
    }
}
