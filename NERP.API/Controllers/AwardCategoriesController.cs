using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AwardCategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AwardCategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.AwardCategories.ToListAsync();
        return Ok(categories);
    }
}
