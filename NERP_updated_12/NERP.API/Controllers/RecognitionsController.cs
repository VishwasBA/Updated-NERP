using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.DTOs;
using EmployeeRecognition.API.Models;
using System.Security.Claims;
using EmployeeRecognition.API.Services;
using EmployeeRecognition.API.Helpers;

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
    private readonly IMemoryCache _cache;

    public RecognitionsController(
        AppDbContext db,
        EmailService emailService,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RecognitionsController> logger,
        IMemoryCache cache)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetRecognitions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation("GetRecognitions API started: Page={Page}, PageSize={PageSize}, Status={Status}, Type={Type}", page, pageSize, status, type);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var query = _db.Recognitions.AsNoTracking();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(r => r.Type == type);
        }

        var querySw = System.Diagnostics.Stopwatch.StartNew();
        var data = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon },
                LikeCount = r.Likes.Count,
                CommentCount = r.Comments.Count,
                LikedByMe = r.Likes.Any(l => l.EmployeeId == userId)
            })
            .ToListAsync();
        querySw.Stop();
        _logger.LogInformation("GetRecognitions DB query executed in {ElapsedMs}ms", querySw.ElapsedMilliseconds);

        sw.Stop();
        _logger.LogInformation("GetRecognitions API completed in {ElapsedMs}ms total", sw.ElapsedMilliseconds);
        return Ok(data);
    }

    [HttpGet("recent-approved-nominations")]
    public async Task<IActionResult> GetRecentApprovedNominations()
    {
        _logger.LogInformation("GetRecentApprovedNominations API started");

        var data = await _db.Recognitions.AsNoTracking()
            .Where(r => r.Type == "nomination" && r.Status == "approved")
            .OrderByDescending(r => r.CreatedAt)
            .Take(4)
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon }
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? direction = null,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        _logger.LogInformation("GetMy API started: Page={Page}, PageSize={PageSize}, Direction={Direction}, Status={Status}, Type={Type}", page, pageSize, direction, status, type);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        var query = _db.Recognitions.AsNoTracking();

        if (direction == "sent")
        {
            if (userRole == "admin")
            {
                query = query.Where(r => r.FromEmployeeId == userId && (r.Type == "appreciation" || (r.Type == "nomination" && r.Status == "approved")));
            }
            else
            {
                query = query.Where(r => r.FromEmployeeId == userId && r.Type == "appreciation");
            }
        }
        else if (direction == "received")
        {
            query = query.Where(r => r.ToEmployeeId == userId && (r.Type == "appreciation" || (r.Type == "nomination" && r.Status == "approved")));
        }
        else
        {
            if (userRole == "admin")
            {
                query = query.Where(r => r.Type == "nomination" && r.Status == "pending");
            }
            else
            {
                query = query.Where(r => (r.FromEmployeeId == userId && r.Type == "appreciation") || (r.ToEmployeeId == userId && (r.Type == "appreciation" || (r.Type == "nomination" && r.Status == "approved"))));
            }
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(r => r.Type == type);
        }

        var querySw = System.Diagnostics.Stopwatch.StartNew();
        var data = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon }
            })
            .ToListAsync();
        querySw.Stop();
        _logger.LogInformation("GetMy DB query executed in {ElapsedMs}ms", querySw.ElapsedMilliseconds);

        sw.Stop();
        _logger.LogInformation("GetMy API completed in {ElapsedMs}ms total", sw.ElapsedMilliseconds);
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecognitionRequest req)
    {
        _logger.LogInformation("Create recognition request received for ToEmployeeId={ToEmployeeId}", req.ToEmployeeId);

        var toEmployee = await _db.Employees.FindAsync(req.ToEmployeeId);
        if (toEmployee == null)
        {
            _logger.LogWarning("Recognition create failed because recipient employee {EmployeeId} was not found", req.ToEmployeeId);
            return BadRequest(new { message = "Recipient employee not found." });
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        // Nominations (category-based, points-bearing recognitions) are a
        // manager/admin action — the wizard already hides this from
        // employees, but that's UI only, so enforce it here too rather
        // than trusting the client's declared type/category.
        if (req.Type == "nomination" && userRole == "employee")
        {
            _logger.LogWarning("Blocked employee {UserId} from creating a nomination directly via the API", userId);
            return Forbid();
        }

        int points = 0; // default appreciation points
        string status = "approved";

        if (req.CategoryId.HasValue)
        {
            var category = await _db.AwardCategories.FindAsync(req.CategoryId.Value);
            if (category == null) return BadRequest(new { message = "Invalid category" });

            if (category.ManagerOnly && userRole == "employee")
                return Forbid();

            if (req.Type == "nomination")
            {
                // Rising Star is only open to employees within their first
                // few months (per AwardCategory.RecentJoinerMaxMonths).
                if (category.RequiresRecentJoiner)
                {
                    if (toEmployee.JoiningDate == null)
                    {
                        return BadRequest(new { message = $"{toEmployee.Name} doesn't have a joining date on file, so eligibility for {category.Name} can't be confirmed." });
                    }

                    var monthsSinceJoining =
                        (DateOnly.FromDateTime(DateTime.UtcNow).Year - toEmployee.JoiningDate.Value.Year) * 12 +
                        (DateOnly.FromDateTime(DateTime.UtcNow).Month - toEmployee.JoiningDate.Value.Month);

                    if (monthsSinceJoining > category.RecentJoinerMaxMonths)
                    {
                        return BadRequest(new { message = $"{toEmployee.Name} joined more than {category.RecentJoinerMaxMonths} months ago, so they're not eligible for {category.Name}." });
                    }
                }

                // Self Development records its 100-pt training increment on
                // the recognition itself; the 500-pt payout only happens
                // once the recipient's running total crosses the threshold
                // (see Approve()) rather than being credited here.
                points = category.IsAccumulative ? category.AccumulationIncrement : category.Points;

                // A 2-level category (Employee of the Quarter, Rising Star)
                // needs a peer manager's review before it ever reaches the
                // Admin approval queue; a 1-level category (Spot Awards)
                // goes straight to that same Admin queue.
                status = category.ApprovalLevel >= 2 ? "pending_peer_review" : "pending";
            }
            else
            {
                points = 0; // appreciation → no points
            }
        }
        else if (req.Type == "nomination")
        {
            // No category selected but somehow flagged as a nomination —
            // shouldn't happen from the wizard, but fail safe rather than
            // silently auto-approving an uncategorized, unpointed "award".
            return BadRequest(new { message = "A nomination requires an award category." });
        }

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

        // BUG FIX: the Notifications table + GET/markRead endpoints already
        // existed and worked correctly, but nothing in the whole codebase
        // ever inserted a row into that table — so a recipient's
        // notifications list was always empty, no matter what happened.
        // This is what actually notifies the recipient that they were
        // appreciated / nominated.
        var fromEmployeeForNotification = await _db.Employees.FindAsync(userId);
        var categoryForNotification = req.CategoryId.HasValue
            ? await _db.AwardCategories.FindAsync(req.CategoryId.Value)
            : null;

        var notificationTitle = req.Type == "nomination"
            ? "You've been nominated!"
            : "You've been appreciated!";
        var notificationMessage = categoryForNotification != null
            ? $"{fromEmployeeForNotification?.Name} recognized you for \"{categoryForNotification.Name}\": {req.Message}"
            : $"{fromEmployeeForNotification?.Name} sent you an appreciation: {req.Message}";

        _db.Notifications.Add(new Notification
        {
            EmployeeId = recognition.ToEmployeeId,
            Title = notificationTitle,
            Message = notificationMessage,
            Type = req.Type == "nomination" ? "award" : "appreciation",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        // The Dashboard/Employees endpoints cache their (shared, same-for-
        // everyone) query results for a short TTL to survive 200 concurrent
        // users. That's great for load, but without this, a brand-new
        // appreciation would still not show up on the Dashboard until the
        // old cache entry expired on its own (15-30s) — on top of the
        // separate frontend cache issue. Busting it here means the very
        // next dashboard/leaderboard request after this one is fresh.
        _cache.Remove("dashboard:shared");
        _cache.Remove("employees:all");

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
                        url = AvatarHelper.GetAvatarUrl(recognition.ToEmployee.Name, recognition.ToEmployee.Avatar),
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
        var result = await _db.Recognitions.AsNoTracking()
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon }
            })
            .FirstAsync(r => r.Id == recognition.Id);

        return Ok(result);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        // Final approval (whether the category needed 1 level or reached
        // here after a level-2 peer review) is an Admin/HR action per HR
        // policy — not something a manager does themselves.
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "admin")
            return Forbid();

        var recognition = await _db.Recognitions
     .Include(r => r.ToEmployee)
     .Include(r => r.Category)
     .FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        // Guard against double-processing: without this check, calling
        // approve twice (double click, retried request, race condition)
        // would add recognition.Points to ToEmployee.TotalPoints a second
        // time. Only a pending nomination can be approved.
        if (recognition.Type != "nomination" || recognition.Status != "pending")
            return Conflict(new { message = "Only a pending nomination can be approved." });

        recognition.Status = "approved";

        string? accumulationNote = null;
        if (recognition.Points > 0)
        {
            if (recognition.Category?.IsAccumulative == true)
            {
                // Self Development: the 100-pt increment goes into a running
                // total, not straight into the spendable wallet. Only once
                // that total reaches the category's threshold does a chunk
                // of it get credited — using a while loop (rather than a
                // single if) so it's still correct in the unlikely case the
                // threshold gets crossed by more than one increment at once.
                var threshold = recognition.Category.AccumulationThreshold;
                recognition.ToEmployee.SelfDevelopmentAccumulatedPoints += recognition.Points;
                var credited = 0;
                while (threshold > 0 && recognition.ToEmployee.SelfDevelopmentAccumulatedPoints >= threshold)
                {
                    recognition.ToEmployee.SelfDevelopmentAccumulatedPoints -= threshold;
                    recognition.ToEmployee.TotalPoints += threshold;
                    credited += threshold;
                }
                accumulationNote = credited > 0
                    ? $" {credited} points were credited to your wallet."
                    : $" {recognition.ToEmployee.SelfDevelopmentAccumulatedPoints}/{threshold} training points accumulated so far — credited once you reach {threshold}.";
            }
            else
            {
                recognition.ToEmployee.TotalPoints += recognition.Points;
            }
        }

        _db.Notifications.Add(new Notification
        {
            EmployeeId = recognition.ToEmployeeId,
            Title = "Your nomination was approved!",
            Message = recognition.Points > 0
                ? $"Your \"{recognition.Category?.Name}\" nomination was approved!{accumulationNote ?? $" You earned {recognition.Points} points!"}"
                : "Your nomination was approved!",
            Type = "award",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Same reason as in Create(): approving changes points/leaderboard
        // data, which is served from the shared cache — bust it now so it
        // doesn't wait out the TTL.
        _cache.Remove("dashboard:shared");
        _cache.Remove("employees:all");

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
                                        url = AvatarHelper.GetAvatarUrl(recognition.ToEmployee.Name, recognition.ToEmployee.Avatar),
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
        if (userRole != "admin")
            return Forbid();

        var recognition = await _db.Recognitions
    .Include(r => r.ToEmployee)
    .Include(r => r.Category)
    .FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        if (recognition.Type != "nomination" || recognition.Status != "pending")
            return Conflict(new { message = "Only a pending nomination can be rejected." });

        recognition.Status = "rejected";
        await _db.SaveChangesAsync();
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

    // ---- Peer review (2-level-approval categories only) ----
    // Employee of the Quarter / Rising Star need a second manager's sign-off
    // before Admin/HR ever sees them. This queue is cross-team by design —
    // any manager other than whoever submitted the nomination can review it.

    [HttpGet("peer-review-queue")]
    public async Task<IActionResult> GetPeerReviewQueue()
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "manager" && userRole != "admin")
            return Forbid();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var items = await _db.Recognitions
            .AsNoTracking()
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Where(r => r.Type == "nomination" && r.Status == "pending_peer_review" && r.FromEmployeeId != userId)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new RecognitionResponseDto
            {
                Id = r.Id,
                FromEmployeeId = r.FromEmployeeId,
                ToEmployeeId = r.ToEmployeeId,
                Message = r.Message,
                Type = r.Type,
                Status = r.Status,
                Points = r.Points,
                CreatedAt = r.CreatedAt,
                FromEmployee = new EmployeeSimpleDto { Id = r.FromEmployee.Id, Name = r.FromEmployee.Name, Department = r.FromEmployee.Department, Location = r.FromEmployee.Location, Avatar = r.FromEmployee.Avatar },
                ToEmployee = new EmployeeSimpleDto { Id = r.ToEmployee.Id, Name = r.ToEmployee.Name, Department = r.ToEmployee.Department, Location = r.ToEmployee.Location, Avatar = r.ToEmployee.Avatar },
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon }
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPut("{id}/peer-approve")]
    public async Task<IActionResult> PeerApprove(int id)
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "manager" && userRole != "admin")
            return Forbid();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var recognition = await _db.Recognitions.FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        if (recognition.Type != "nomination" || recognition.Status != "pending_peer_review")
            return Conflict(new { message = "Only a nomination awaiting peer review can be peer-approved." });

        if (recognition.FromEmployeeId == userId)
            return BadRequest(new { message = "You can't peer-review your own nomination." });

        recognition.PeerReviewerId = userId;
        recognition.PeerReviewedAt = DateTime.UtcNow;
        // Moves into the same queue a 1-level category lands in straight
        // away — Admin/HR gives the final approval from here either way.
        recognition.Status = "pending";

        await _db.SaveChangesAsync();
        _cache.Remove("dashboard:shared");

        return Ok(new { success = true });
    }

    [HttpPut("{id}/peer-reject")]
    public async Task<IActionResult> PeerReject(int id)
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "manager" && userRole != "admin")
            return Forbid();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var recognition = await _db.Recognitions
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (recognition == null) return NotFound();

        if (recognition.Type != "nomination" || recognition.Status != "pending_peer_review")
            return Conflict(new { message = "Only a nomination awaiting peer review can be peer-rejected." });

        if (recognition.FromEmployeeId == userId)
            return BadRequest(new { message = "You can't peer-review your own nomination." });

        recognition.PeerReviewerId = userId;
        recognition.PeerReviewedAt = DateTime.UtcNow;
        recognition.Status = "rejected";

        await _db.SaveChangesAsync();

        var fromEmployee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == recognition.FromEmployeeId);
        if (fromEmployee != null)
        {
            _ = Task.Run(async () =>
            {
                await _emailService.SendEmailAsync(
                    fromEmployee.Email,
                    "❌ Your Nomination Was Rejected",
                    $@"
            <h3>Hello {fromEmployee.Name}</h3>
            <p>Your nomination for <b>{recognition.ToEmployee.Name}</b> was rejected during peer review.</p>
            <p><b>Award:</b> {recognition.Category?.Name}</p>
            "
                );
            });
        }

        return Ok(new { success = true });
    }

    // ---- Reactions (Recognition Page: like button + comments) ----

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var recognitionExists = await _db.Recognitions.AsNoTracking().AnyAsync(r => r.Id == id);
        if (!recognitionExists) return NotFound(new { message = "Recognition not found" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existing = await _db.RecognitionLikes
            .FirstOrDefaultAsync(l => l.RecognitionId == id && l.EmployeeId == userId);

        if (existing != null)
        {
            _db.RecognitionLikes.Remove(existing);
        }
        else
        {
            _db.RecognitionLikes.Add(new RecognitionLike { RecognitionId = id, EmployeeId = userId });
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two rapid clicks racing each other on the same like — the
            // unique index already prevents a duplicate row, so just
            // report the current state rather than surfacing a 500.
        }

        var likeCount = await _db.RecognitionLikes.CountAsync(l => l.RecognitionId == id);
        var likedByMe = await _db.RecognitionLikes.AnyAsync(l => l.RecognitionId == id && l.EmployeeId == userId);

        return Ok(new LikeStatusDto { LikeCount = likeCount, LikedByMe = likedByMe });
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var recognitionExists = await _db.Recognitions.AsNoTracking().AnyAsync(r => r.Id == id);
        if (!recognitionExists) return NotFound(new { message = "Recognition not found" });

        var comments = await _db.RecognitionComments
            .AsNoTracking()
            .Where(c => c.RecognitionId == id)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new RecognitionCommentDto
            {
                Id = c.Id,
                RecognitionId = c.RecognitionId,
                Message = c.Message,
                CreatedAt = c.CreatedAt,
                Employee = new EmployeeSimpleDto
                {
                    Id = c.Employee.Id,
                    Name = c.Employee.Name,
                    Department = c.Employee.Department,
                    Location = c.Employee.Location,
                    Avatar = c.Employee.Avatar
                }
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { message = "Comment cannot be empty." });
        if (req.Message.Length > 500)
            return BadRequest(new { message = "Comment must be 500 characters or fewer." });

        var recognitionExists = await _db.Recognitions.AsNoTracking().AnyAsync(r => r.Id == id);
        if (!recognitionExists) return NotFound(new { message = "Recognition not found" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var comment = new RecognitionComment
        {
            RecognitionId = id,
            EmployeeId = userId,
            Message = req.Message.Trim(),
        };
        _db.RecognitionComments.Add(comment);
        await _db.SaveChangesAsync();

        var employee = await _db.Employees.AsNoTracking().FirstAsync(e => e.Id == userId);

        return Ok(new RecognitionCommentDto
        {
            Id = comment.Id,
            RecognitionId = id,
            Message = comment.Message,
            CreatedAt = comment.CreatedAt,
            Employee = new EmployeeSimpleDto
            {
                Id = employee.Id,
                Name = employee.Name,
                Department = employee.Department,
                Location = employee.Location,
                Avatar = employee.Avatar
            }
        });
    }
}