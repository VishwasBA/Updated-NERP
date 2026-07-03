using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using EmployeeRecognition.API.Models;
using System.Security.Claims;
using EmployeeRecognition.API.Services;

namespace EmployeeRecognition.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecognitionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RecognitionsController> _logger;

    public RecognitionsController(
        AppDbContext db,
        EmailService emailService,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RecognitionsController> logger)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet]
public async Task<IActionResult> GetRecognitions()
{
    var data = await _db.Recognitions
        .Select(r => new
        {
            r.Id,
            r.Points,
            r.Message,
            r.Type,
            r.Status,
            r.CreatedAt,

            FromEmployee = new
            {
                r.FromEmployee.Id,
                r.FromEmployee.Name,
                r.FromEmployee.Avatar
            },

            ToEmployee = new
            {
                r.ToEmployee.Id,
                r.ToEmployee.Name,
                r.ToEmployee.Avatar
            },

            Category = r.Category == null ? null : new
            {
                r.Category.Id,
                r.Category.Name,
                r.Category.Icon
            }
        })
        .OrderByDescending(r => r.CreatedAt)
        .ToListAsync();

    return Ok(data);
}

[HttpGet("my")]
public async Task<IActionResult> GetMy()
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var userRole = User.FindFirstValue("userRole")!;

    var query = _db.Recognitions
        .Include(r => r.FromEmployee)
        .Include(r => r.ToEmployee)
        .Include(r => r.Category)
        .OrderByDescending(r => r.CreatedAt);

    if (userRole == "admin")
    {
        // ✅ ONLY pending nominations for admin
        return Ok(await query
            .Where(r => r.Type == "nomination" && r.Status == "pending")
            .ToListAsync());
    }
    else
    {
        // ✅ Normal users see their own data
        return Ok(await query
            .Where(r => r.FromEmployeeId == userId || r.ToEmployeeId == userId)
            .ToListAsync());
    }
}

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecognitionRequest req)
    {
        _logger.LogInformation("Create recognition request received for ToEmployeeId=%d", req.ToEmployeeId);

        var toEmployee = await _db.Employees.FindAsync(req.ToEmployeeId);
        if (toEmployee == null)
        {
            _logger.LogWarning("Recognition create failed because recipient employee {EmployeeId} was not found", req.ToEmployeeId);
            return BadRequest(new { message = "Recipient employee not found." });
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        int points = 0; // default appreciation points
        string status = "approved";

        if (req.CategoryId.HasValue)
        {
            var category = await _db.AwardCategories.FindAsync(req.CategoryId.Value);
            if (category == null) return BadRequest(new { message = "Invalid category" });

            if (category.ManagerOnly && userRole == "employee")
                return Forbid();
            
            // ✅ Only assign points for nomination
            if (req.Type == "nomination")
            {
                points = category.Points;
            }
            else
            {
                points = 0; // appreciation → no points
            }

        }

        if (req.Type == "nomination")
            status = "pending";

        var recognition = new Recognition
        {
            FromEmployeeId = userId,
            ToEmployeeId = req.ToEmployeeId,
            Message = req.Message,
            CategoryId = req.CategoryId,
            Points = points,
            Type = req.Type,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

        _db.Recognitions.Add(recognition);


        await _db.SaveChangesAsync();
        var teamWebhookUrl = _configuration["Teams:WebhookUrl"];

        if (req.Type == "appreciation" && req.ShareToTeams && !string.IsNullOrWhiteSpace(teamWebhookUrl))
        {
            var fromEmployee = await _db.Employees.FindAsync(userId);
            var category = req.CategoryId.HasValue
                ? await _db.AwardCategories.FindAsync(req.CategoryId.Value)
                : null;

            var card = new
            {
        type = "message",
        attachments = new[]
        {
            new
            {
                contentType = "application/vnd.microsoft.card.adaptive",
                content = new
                {
                    type = "AdaptiveCard",
                    version = "1.4",

                    body = new object[]
{
    // 🌟 TITLE
    new
    {
        type = "TextBlock",
        text = "🌟 Nexer Employee Appreciation",
        weight = "Bolder",
        size = "Large",
        color = "Accent",
        wrap = true
    },

    // 👤 PROFILE + APPRECIATION ROW
    new
    {
        type = "ColumnSet",
        columns = new object[]
        {
            new
            {
                type = "Column",
                width = "auto",
                items = new object[]
                {
                    new
                    {
                        type = "Image",
                        url = "https://ui-avatars.com/api/?name=" + recognition.ToEmployee.Name,
                        size = "Medium",
                        style = "Person"
                    }
                }
            },
            new
            {
                type = "Column",
                width = "stretch",
                items = new object[]
                {
                    new
                    {
                        type = "TextBlock",
                        text = $"{recognition.ToEmployee.Name} has been appreciated 👏",
                        weight = "Bolder",
                        wrap = true
                    },
                    new
                    {
                        type = "TextBlock",
                        text = $"{category?.Name}",
                        color = "Accent",
                        weight = "Bolder",
                        size = "Medium",
                        wrap = true
                    }
                }
            }
        }
    },

    // 🙌 Appreciated By
    new
    {
        type = "TextBlock",
        text = $"👏 Appreciated by: {fromEmployee?.Name}",
        wrap = true
    },

    // 💬 Appreciation Message
    new
    {
        type = "Container",
        style = "emphasis",
        items = new object[]
        {
            new
            {
                type = "TextBlock",
                text = $"Message: {req.Message}",
                wrap = true,
                size = "Medium"
            }
        }
    }
},

                    actions = new object[]
                    {
                        new
                        {
                            type = "Action.OpenUrl",
                            title = "🔗 View in App",
                            url = "https://agreeable-grass-0a19b3703.7.azurestaticapps.net" // Azure portal NERP application link
                        }
                    }
                }
            }
        }
    };

            using var httpClient = _httpClientFactory.CreateClient();
            try
            {
                await httpClient.PostAsJsonAsync(teamWebhookUrl, card);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to post appreciation card to Teams webhook.");
            }
        }

        if (req.Type == "nomination")
        {
            var admins = await _db.Employees
            .Where(e => e.UserRole == "admin")
            .ToListAsync();

            var fromEmployee = await _db.Employees.FindAsync(userId);
            var category = req.CategoryId.HasValue
            ? await _db.AwardCategories.FindAsync(req.CategoryId.Value)
            : null;

            foreach (var admin in admins)
            {
                _ = Task.Run(async () =>
                {
                await _emailService.SendEmailAsync(
                admin.Email,
                "📢 New Nomination Needs Approval",
                $@"
                <h3>Hello {admin.Name}</h3>
                <p><b>{fromEmployee?.Name}</b> nominated <b>{toEmployee?.Name}</b></p>
                <p><b>Award:</b> {category?.Name}</p>
                <p>Status: Pending Approval</p>
                "
                );
                });
            }
        }

        // Reload with includes
        var result = await _db.Recognitions
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .FirstAsync(r => r.Id == recognition.Id);

        return Ok(result);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "manager" && userRole != "admin")
            return Forbid();

        var recognition = await _db.Recognitions
     .Include(r => r.ToEmployee)
     .Include(r => r.Category)
     .FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        recognition.Status = "approved";

// ✅ Add this condition here
        if (recognition.Points > 0)
        {
            recognition.ToEmployee.TotalPoints += recognition.Points;
        }
        await _db.SaveChangesAsync();

        var teamWebhookUrl = _configuration["Teams:WebhookUrl"];
        var fromEmployee = await _db.Employees.FindAsync(recognition.FromEmployeeId);
        if (!string.IsNullOrWhiteSpace(teamWebhookUrl) && fromEmployee != null)
        {
            var card = new
            {
    type = "message",
    attachments = new[]
    {
        new
        {
            contentType = "application/vnd.microsoft.card.adaptive",
            content = new
            {
                type = "AdaptiveCard",
                version = "1.4",
                body = new object[]
                {
                    // 🎉 TITLE
                    new
                    {
                        type = "TextBlock",
                        text = $"🎉 Congratulations on this milestone, {recognition.ToEmployee.Name}!",
                        weight = "Bolder",
                        size = "Large",
                        color = "Good",
                        wrap = true
                    },

                    // 👤 PROFILE + AWARD ROW
                    new
                    {
                        type = "ColumnSet",
                        columns = new object[]
                        {
                            new
                            {
                                type = "Column",
                                width = "auto",
                                items = new object[]
                                {
                                    new
                                    {
                                        type = "Image",
                                        url = "https://ui-avatars.com/api/?name=" + recognition.ToEmployee.Name,
                                        size = "Medium",
                                        style = "Person"
                                    }
                                }
                            },
                            new
                            {
                                type = "Column",
                                width = "stretch",
                                items = new object[]
                                {
                                    new
                                    {
                                        type = "TextBlock",
                                        text = $"{recognition.ToEmployee.Name} has been awarded",
                                        weight = "Bolder",
                                        wrap = true
                                    },
                                    new
                                    {
                                        type = "TextBlock",
                                        text = $"🏅 {recognition.Category?.Name}",
                                        color = "Accent",
                                        weight = "Bolder",
                                        size = "Medium",
                                        wrap = true
                                    }
                                }
                            }
                        }
                    },

                    // 🙌 NOMINATOR
                    new
                    {
                        type = "TextBlock",
                        text = $"👏 Nominated by: {fromEmployee?.Name}",
                        wrap = true
                    },

                    // 💬 MESSAGE (styled box)
                    new
                    {
                        type = "Container",
                        style = "emphasis",
                        items = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = $"Reason: {recognition.Message}",
                                wrap = true,
                                size = "Medium"
                            }
                        }
                    }
                },

                // 🔘 BUTTON
                actions = new object[]
                {
                    new
                    {
                        type = "Action.OpenUrl",
                        title = "🔗 View in App",
                        url = "https://agreeable-grass-0a19b3703.7.azurestaticapps.net" // Azure portal NERP application link
                    }
                }
            }
        }
    }
};

            using var httpClient = _httpClientFactory.CreateClient();
            await httpClient.PostAsJsonAsync(teamWebhookUrl, card);
        }

        //         await _emailService.SendEmailAsync(
//     recognition.ToEmployee.Email,
//     "🏆 Recognition Approved!",
//     $@"
//     <h3>Congratulations {recognition.ToEmployee.Name} 🎉</h3>
//     <p>Your nomination has been <b style='color:green;'>APPROVED</b></p>
//     <p><b>Award:</b> {recognition.Category?.Name}</p>
//     "
// );
        
        // var fromEmployee = await _db.Employees
        // .FirstOrDefaultAsync(e => e.Id == recognition.FromEmployeeId);

        if (fromEmployee != null)
        {
            _ = Task.Run(async () =>
            {
            await _emailService.SendEmailAsync(
            fromEmployee.Email,
            "✅ Your Nomination Was Approved",
            $@"
            <h3>Hello {fromEmployee.Name}</h3>
            <p>Your nomination for <b>{recognition.ToEmployee.Name}</b> has been approved.</p>
            <p><b>Award:</b> {recognition.Category?.Name}</p>
        "
        );
        });
        };

        return NoContent();
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "manager" && userRole != "admin")
            return Forbid();

        var recognition = await _db.Recognitions
    .Include(r => r.ToEmployee)
    .Include(r => r.Category)
    .FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        recognition.Status = "rejected";
        await _db.SaveChangesAsync();
//         await _emailService.SendEmailAsync(
//     recognition.ToEmployee.Email,
//     "❌ Recognition Update",
//     $@"
//     <h3>Hello {recognition.ToEmployee.Name}</h3>
//     <p>Your nomination has been <b style='color:red;'>REJECTED</b></p>
//     <p><b>Award:</b> {recognition.Category?.Name}</p>
//     <br/>
//     <p>Keep improving and try again 💪</p>
//     "
// );   
         var fromEmployee = await _db.Employees
        .FirstOrDefaultAsync(e => e.Id == recognition.FromEmployeeId);

        if (fromEmployee != null)
        {
            _ = Task.Run(async () =>
            {
            await _emailService.SendEmailAsync(
            fromEmployee.Email,
            "❌ Your Nomination Was Rejected",
            $@"
            <h3>Hello {fromEmployee.Name}</h3>
            <p>Your nomination for <b>{recognition.ToEmployee.Name}</b> was rejected.</p>
            <p><b>Award:</b> {recognition.Category?.Name}</p>
            "
            );
            });
        }

        return NoContent();
    }
}