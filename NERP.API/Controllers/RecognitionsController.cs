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
            if (status.Equals("approved", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == "Approved" || r.Status == "Approved Winner" || r.Status == "approved");
            }
            else
            {
                query = query.Where(r => r.Status == status);
            }
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
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType },
                CustomCategory = r.CustomCategory,
                AwardCycle = r.AwardCycle,
                BUManagerId = r.BUManagerId,
                BUManagerName = r.BUManager != null ? r.BUManager.Name : null,
                BUDecisionDate = r.BUDecisionDate,
                HRAdminId = r.HRAdminId,
                HRAdminName = r.HRAdmin != null ? r.HRAdmin.Name : null,
                HRDecisionDate = r.HRDecisionDate,
                Audits = r.Audits.Select(a => new NominationAuditDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    PerformedBy = a.PerformedBy,
                    Role = a.Role,
                    Comments = a.Comments,
                    CreatedDate = a.CreatedDate
                }).ToList(),
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
            .Where(r => r.Type == "nomination" && (r.Status == "Approved" || r.Status == "Approved Winner" || r.Status == "approved"))
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
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType },
                CustomCategory = r.CustomCategory,
                AwardCycle = r.AwardCycle,
                BUManagerId = r.BUManagerId,
                BUManagerName = r.BUManager != null ? r.BUManager.Name : null,
                BUDecisionDate = r.BUDecisionDate,
                HRAdminId = r.HRAdminId,
                HRAdminName = r.HRAdmin != null ? r.HRAdmin.Name : null,
                HRDecisionDate = r.HRDecisionDate
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
            query = query.Where(r => r.FromEmployeeId == userId);
        }
        else if (direction == "received")
        {
            query = query.Where(r => r.ToEmployeeId == userId && (r.Type == "appreciation" || (r.Type == "nomination" && (r.Status == "Approved" || r.Status == "Approved Winner" || r.Status == "approved"))));
        }
        else
        {
            query = query.Where(r => (r.FromEmployeeId == userId && r.Type == "appreciation") || (r.ToEmployeeId == userId && (r.Type == "appreciation" || (r.Type == "nomination" && (r.Status == "Approved" || r.Status == "Approved Winner" || r.Status == "approved")))));
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Equals("approved", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == "Approved" || r.Status == "Approved Winner" || r.Status == "approved");
            }
            else
            {
                query = query.Where(r => r.Status == status);
            }
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
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType },
                CustomCategory = r.CustomCategory,
                AwardCycle = r.AwardCycle,
                BUManagerId = r.BUManagerId,
                BUManagerName = r.BUManager != null ? r.BUManager.Name : null,
                BUDecisionDate = r.BUDecisionDate,
                HRAdminId = r.HRAdminId,
                HRAdminName = r.HRAdmin != null ? r.HRAdmin.Name : null,
                HRDecisionDate = r.HRDecisionDate,
                Audits = r.Audits.Select(a => new NominationAuditDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    PerformedBy = a.PerformedBy,
                    Role = a.Role,
                    Comments = a.Comments,
                    CreatedDate = a.CreatedDate
                }).ToList()
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

        if (req.Type == "nomination" && userRole == "employee")
        {
            _logger.LogWarning("Blocked employee {UserId} from creating a nomination directly via the API", userId);
            return Forbid();
        }

        int points = 0;
        string status = "approved";
        string? customCategory = null;
        string? awardCycle = null;
        AwardCategory? category = null;
        bool isSpotAward = false;

        if (req.Type == "nomination")
        {
            if (!string.IsNullOrWhiteSpace(req.CustomCategory))
            {
                customCategory = req.CustomCategory.Trim();
                points = 500;
                isSpotAward = true;
                status = (userRole == "bu_manager" || userRole == "admin") ? "Approved" : "Pending BU Approval";
            }
            else
            {
                if (!req.CategoryId.HasValue)
                {
                    return BadRequest(new { message = "Category is required for nomination." });
                }

                category = await _db.AwardCategories.FindAsync(req.CategoryId.Value);
                if (category == null) return BadRequest(new { message = "Invalid category" });

                if (category.ManagerOnly && userRole == "employee")
                    return Forbid();

                if (category.AwardType == "spot")
                {
                    points = 500;
                    isSpotAward = true;
                    status = (userRole == "bu_manager" || userRole == "admin") ? "Approved" : "Pending BU Approval";
                }
                else if (category.AwardType == "performance")
                {
                    if (string.IsNullOrWhiteSpace(req.AwardCycle))
                    {
                        return BadRequest(new { message = "Award cycle is required for performance nominations." });
                    }

                    awardCycle = req.AwardCycle.Trim();
                    points = category.Points;
                    status = "Pending BU Review";

                    if (category.Id == 15 || category.Name.Contains("Rising Star"))
                    {
                        if (toEmployee.JoiningDate.HasValue)
                        {
                            var tenureDays = (DateTime.UtcNow - toEmployee.JoiningDate.Value.ToDateTime(TimeOnly.MinValue)).TotalDays;
                            var tenureMonths = tenureDays / 30.4375;
                            if (tenureMonths > 6)
                            {
                                return BadRequest(new { message = "Rising Star (BA) nominees must have completed a maximum of 6 months tenure." });
                            }
                        }
                    }

                    var exists = await _db.Recognitions.AnyAsync(r =>
                        r.FromEmployeeId == userId &&
                        r.CategoryId == category.Id &&
                        r.AwardCycle == awardCycle &&
                        r.Status != "Rejected");

                    if (exists)
                    {
                        return BadRequest(new { message = $"You have already nominated an employee for the category '{category.Name}' in cycle '{awardCycle}'." });
                    }
                }
                else
                {
                    points = category.Points;
                    status = "pending";
                }
            }
        }
        else
        {
            if (req.CategoryId.HasValue)
            {
                category = await _db.AwardCategories.FindAsync(req.CategoryId.Value);
                if (category == null) return BadRequest(new { message = "Invalid category" });
                if (category.ManagerOnly && userRole == "employee")
                    return Forbid();
            }
            points = 0;
            status = "approved";
        }

        bool isAutoApproved = req.Type == "nomination" && isSpotAward && (userRole == "bu_manager" || userRole == "admin");

        if (isAutoApproved)
        {
            toEmployee.TotalPoints += 500;
        }

        var recognition = new Recognition
        {
            FromEmployeeId = userId,
            ToEmployeeId = req.ToEmployeeId,
            Message = req.Message,
            CategoryId = customCategory != null ? null : req.CategoryId,
            CustomCategory = customCategory,
            AwardCycle = awardCycle,
            Points = points,
            Type = req.Type,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            BUManagerId = (isAutoApproved && userRole == "bu_manager") ? userId : null,
            BUDecisionDate = (isAutoApproved && userRole == "bu_manager") ? DateTime.UtcNow : null,
            HRAdminId = (isAutoApproved && userRole == "admin") ? userId : null,
            HRDecisionDate = (isAutoApproved && userRole == "admin") ? DateTime.UtcNow : null
        };

        _db.Recognitions.Add(recognition);
        await _db.SaveChangesAsync();

        var nominator = await _db.Employees.FindAsync(userId);

        if (req.Type == "nomination")
        {
            if (isAutoApproved)
            {
                var auditNominated = new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Nominated",
                    PerformedBy = nominator?.Name ?? (userRole == "admin" ? "Admin" : "BU Manager"),
                    Role = userRole == "admin" ? "Admin" : "BU Manager",
                    Comments = $"Nominated {toEmployee.Name} for {category?.Name ?? customCategory} (Cycle: {awardCycle ?? "N/A"})",
                    CreatedDate = DateTime.UtcNow
                };
                _db.NominationAudits.Add(auditNominated);

                var auditAutoApproved = new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Auto Approved",
                    PerformedBy = nominator?.Name ?? (userRole == "admin" ? "Admin" : "BU Manager"),
                    Role = userRole == "admin" ? "Admin" : "BU Manager",
                    Comments = "Auto Approved Spot Award",
                    CreatedDate = DateTime.UtcNow
                };
                _db.NominationAudits.Add(auditAutoApproved);

                var pointsAudit = new PointsAudit
                {
                    EmployeeId = recognition.ToEmployeeId,
                    Points = 500,
                    Reason = $"Approved Spot Award: {category?.Name ?? customCategory}",
                    RecognitionId = recognition.Id,
                    CreatedDate = DateTime.UtcNow
                };
                _db.PointsAudits.Add(pointsAudit);
            }
            else
            {
                var audit = new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Nominated",
                    PerformedBy = nominator?.Name ?? "CU Manager",
                    Role = userRole == "admin" ? "HR/Admin" : (userRole == "bu_manager" ? "BU Manager" : "CU Manager"),
                    Comments = $"Nominated {toEmployee.Name} for {category?.Name ?? customCategory} (Cycle: {awardCycle ?? "N/A"})",
                    CreatedDate = DateTime.UtcNow
                };
                _db.NominationAudits.Add(audit);
            }
            await _db.SaveChangesAsync();
        }

        var notificationTitle = req.Type == "nomination"
            ? "You've been nominated!"
            : "You've been appreciated!";
        var notificationMessage = (category != null || customCategory != null)
            ? $"{nominator?.Name} recognized you for \"{category?.Name ?? customCategory}\": {req.Message}"
            : $"{nominator?.Name} sent you an appreciation: {req.Message}";

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

        if (isAutoApproved)
        {
            _db.Notifications.Add(new Notification
            {
                EmployeeId = recognition.ToEmployeeId,
                Title = "Your Spot Award nomination was approved!",
                Message = $"Your nomination for \"{category?.Name ?? customCategory}\" was approved — you earned 500 points!",
                Type = "award",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        _cache.Remove("dashboard:shared");
        _cache.Remove("employees:all");

        var teamWebhookUrl = _configuration["Teams:WebhookUrl"];
        if (req.Type == "appreciation" && req.ShareToTeams && !string.IsNullOrWhiteSpace(teamWebhookUrl))
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
                                new { type = "TextBlock", text = "🌟 Nexer Employee Appreciation", weight = "Bolder", size = "Large", color = "Accent", wrap = true },
                                new
                                {
                                    type = "ColumnSet",
                                    columns = new object[]
                                    {
                                        new
                                        {
                                            type = "Column",
                                            width = "auto",
                                            items = new object[] { new { type = "Image", url = AvatarHelper.GetAvatarUrl(toEmployee.Name, toEmployee.Avatar), size = "Medium", style = "Person" } }
                                        },
                                        new
                                        {
                                            type = "Column",
                                            width = "stretch",
                                            items = new object[]
                                            {
                                                new { type = "TextBlock", text = $"{toEmployee.Name} has been appreciated 👏", weight = "Bolder", wrap = true },
                                                new { type = "TextBlock", text = $"{category?.Name ?? customCategory}", color = "Accent", weight = "Bolder", size = "Medium", wrap = true }
                                            }
                                        }
                                    }
                                },
                                new { type = "TextBlock", text = $"👏 Appreciated by: {nominator?.Name}", wrap = true },
                                new { type = "Container", style = "emphasis", items = new object[] { new { type = "TextBlock", text = $"Message: {req.Message}", wrap = true, size = "Medium" } } }
                            },
                            actions = new object[] { new { type = "Action.OpenUrl", title = "🔗 View in App", url = "https://agreeable-grass-0a19b3703.7.azurestaticapps.net" } }
                        }
                    }
                }
            };

            using var httpClient = _httpClientFactory.CreateClient();
            try { await httpClient.PostAsJsonAsync(teamWebhookUrl, card); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to post appreciation card to Teams webhook."); }
        }

        if (req.Type == "nomination" && !isAutoApproved)
        {
            var admins = await _db.Employees.Where(e => e.UserRole == "admin").ToListAsync();
            foreach (var admin in admins)
            {
                _ = Task.Run(async () =>
                {
                    await _emailService.SendEmailAsync(
                        admin.Email,
                        "📢 New Nomination Needs Approval",
                        $@"
                        <h3>Hello {admin.Name}</h3>
                        <p><b>{nominator?.Name}</b> nominated <b>{toEmployee.Name}</b></p>
                        <p><b>Award:</b> {category?.Name ?? customCategory}</p>
                        <p>Status: Pending Approval</p>
                        "
                    );
                });
            }
        }

        if (isAutoApproved)
        {
            recognition.ToEmployee = toEmployee;
            recognition.Category = category;
            await SendTeamsAwardNotification(recognition, nominator?.Name ?? (userRole == "admin" ? "Admin" : "BU Manager"));
        }

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
                Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType },
                CustomCategory = r.CustomCategory,
                AwardCycle = r.AwardCycle,
                BUManagerId = r.BUManagerId,
                BUDecisionDate = r.BUDecisionDate,
                HRAdminId = r.HRAdminId,
                HRDecisionDate = r.HRDecisionDate
            })
            .FirstAsync(r => r.Id == recognition.Id);

        return Ok(result);
    }

    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        var query = _db.Recognitions
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Include(r => r.Audits)
            .AsNoTracking();

        if (userRole == "admin")
        {
            query = query.Where(r => r.Type == "nomination" && r.Status == "BU Shortlisted");
        }
        else if (userRole == "bu_manager")
        {
            query = query.Where(r => r.Type == "nomination" &&
                r.FromEmployee.ManagerId == userId &&
                (r.Status == "Pending BU Approval" || r.Status == "Pending BU Review"));
        }

        else
        {
            return Ok(new List<RecognitionResponseDto>());
        }

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = list.Select(r => new RecognitionResponseDto
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
            Category = r.Category == null ? null : new CategorySimpleDto { Id = r.Category.Id, Name = r.Category.Name, Icon = r.Category.Icon, AwardType = r.Category.AwardType },
            CustomCategory = r.CustomCategory,
            AwardCycle = r.AwardCycle,
            BUManagerId = r.BUManagerId,
            BUDecisionDate = r.BUDecisionDate,
            HRAdminId = r.HRAdminId,
            HRDecisionDate = r.HRDecisionDate,
            Audits = r.Audits.Select(a => new NominationAuditDto
            {
                Id = a.Id,
                Action = a.Action,
                PerformedBy = a.PerformedBy,
                Role = a.Role,
                Comments = a.Comments,
                CreatedDate = a.CreatedDate
            }).ToList()
        }).ToList();

        return Ok(dtos);
    }

    private async Task<IActionResult> ProcessBuDecisionInternal(int id, BUDecisionRequest req, int userId, string userRole)
    {
        _logger.LogInformation("Processing BU Decision: NominationId={NominationId}, Decision={Decision}, PerformedBy={UserId}, Role={UserRole}", id, req.Decision, userId, userRole);

        var recognition = await _db.Recognitions
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Include(r => r.Audits)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recognition == null)
        {
            _logger.LogWarning("BU Decision failed: Nomination {NominationId} was not found", id);
            return NotFound(new { message = "Nomination not found." });
        }

        if (userRole == "bu_manager" && recognition.FromEmployee.ManagerId != userId)
        {
            _logger.LogWarning("BU Decision forbidden: User {UserId} is not the manager for nominator {NominatorId}", userId, recognition.FromEmployeeId);
            return Forbid();
        }

        var manager = await _db.Employees.FindAsync(userId);
        var managerName = manager?.Name ?? "BU Manager";

        _logger.LogInformation("BU Review details: CurrentStatus={Status}, CategoryId={CategoryId}, AwardType={AwardType}, CustomCategory={CustomCategory}", 
            recognition.Status, recognition.CategoryId, recognition.Category?.AwardType, recognition.CustomCategory);

        if (recognition.Status == "Pending BU Approval") // Spot Award
        {
            if (req.Decision == "approve")
            {
                recognition.Status = "Approved";
                recognition.BUManagerId = userId;
                recognition.BUDecisionDate = DateTime.UtcNow;
                recognition.Points = 500;
                recognition.ToEmployee.TotalPoints += 500;

                _db.PointsAudits.Add(new PointsAudit
                {
                    EmployeeId = recognition.ToEmployeeId,
                    Points = 500,
                    Reason = $"Approved Spot Award: {recognition.Category?.Name ?? recognition.CustomCategory}",
                    RecognitionId = recognition.Id,
                    CreatedDate = DateTime.UtcNow
                });

                _db.NominationAudits.Add(new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Approved",
                    PerformedBy = managerName,
                    Role = "BU Manager",
                    Comments = req.Comments ?? "Approved Spot Award",
                    CreatedDate = DateTime.UtcNow
                });

                _db.Notifications.Add(new Notification
                {
                    EmployeeId = recognition.ToEmployeeId,
                    Title = "Your Spot Award nomination was approved!",
                    Message = $"Your nomination for \"{recognition.Category?.Name ?? recognition.CustomCategory}\" was approved — you earned 500 points!",
                    Type = "award",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
                _cache.Remove("dashboard:shared");
                _cache.Remove("employees:all");

                await SendTeamsAwardNotification(recognition, recognition.FromEmployee.Name);
            }
            else if (req.Decision == "reject")
            {
                recognition.Status = "Rejected";
                recognition.BUManagerId = userId;
                recognition.BUDecisionDate = DateTime.UtcNow;

                _db.NominationAudits.Add(new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Rejected",
                    PerformedBy = managerName,
                    Role = "BU Manager",
                    Comments = req.Comments ?? "Rejected Spot Award",
                    CreatedDate = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
            }
            else
            {
                _logger.LogWarning("BU Decision failed: Invalid decision '{Decision}' for Spot Award", req.Decision);
                return BadRequest(new { message = $"Invalid decision '{req.Decision}' for Spot Award." });
            }
        }
        else if (recognition.Status == "Pending BU Review") // Performance Award
        {
            if (req.Decision == "shortlist")
            {
                var categoryId = recognition.CategoryId;
                var cycle = recognition.AwardCycle;

                var cuManagerIds = await _db.Employees
                    .Where(e => e.ManagerId == userId)
                    .Select(e => e.Id)
                    .ToListAsync();

                var buNominatorIds = new List<int> { userId };
                buNominatorIds.AddRange(cuManagerIds);

                var alreadyShortlisted = await _db.Recognitions
                    .AnyAsync(r => buNominatorIds.Contains(r.FromEmployeeId) &&
                                   r.CategoryId == categoryId &&
                                   r.AwardCycle == cycle &&
                                   r.Status == "BU Shortlisted");

                if (alreadyShortlisted)
                {
                    _logger.LogWarning("BU Decision failed: Category '{Category}' already shortlisted for cycle '{Cycle}' under BU Manager {UserId}", recognition.Category?.Name, cycle, userId);
                    return BadRequest(new { message = $"You have already shortlisted a nominee for this performance category in cycle '{cycle}'." });
                }

                recognition.Status = "BU Shortlisted";
                recognition.BUManagerId = userId;
                recognition.BUDecisionDate = DateTime.UtcNow;

                _db.NominationAudits.Add(new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Shortlisted",
                    PerformedBy = managerName,
                    Role = "BU Manager",
                    Comments = req.Comments ?? "Shortlisted for HR review",
                    CreatedDate = DateTime.UtcNow
                });

                var otherPendingNominations = await _db.Recognitions
                    .Where(r => r.Id != recognition.Id &&
                               buNominatorIds.Contains(r.FromEmployeeId) &&
                               r.CategoryId == categoryId &&
                               r.AwardCycle == cycle &&
                               r.Status == "Pending BU Review")
                    .ToListAsync();

                foreach (var other in otherPendingNominations)
                {
                    other.Status = "Not Selected";
                    other.BUManagerId = userId;
                    other.BUDecisionDate = DateTime.UtcNow;

                    _db.NominationAudits.Add(new NominationAudit
                    {
                        RecognitionId = other.Id,
                        Action = "Not Selected",
                        PerformedBy = managerName,
                        Role = "BU Manager",
                        Comments = "Not shortlisted by BU Manager",
                        CreatedDate = DateTime.UtcNow
                    });
                }

                await _db.SaveChangesAsync();
            }
            else if (req.Decision == "reject")
            {
                recognition.Status = "Rejected";
                recognition.BUManagerId = userId;
                recognition.BUDecisionDate = DateTime.UtcNow;

                _db.NominationAudits.Add(new NominationAudit
                {
                    RecognitionId = recognition.Id,
                    Action = "Rejected",
                    PerformedBy = managerName,
                    Role = "BU Manager",
                    Comments = req.Comments ?? "Rejected Performance Award nomination",
                    CreatedDate = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
            }
            else
            {
                _logger.LogWarning("BU Decision failed: Invalid decision '{Decision}' for Performance Award", req.Decision);
                return BadRequest(new { message = $"Invalid decision '{req.Decision}' for Performance Award." });
            }
        }
        else
        {
            _logger.LogWarning("BU Decision failed: Nomination {NominationId} is in status '{Status}', not pending BU review", id, recognition.Status);
            return BadRequest(new { message = $"Nomination is not in a status that allows BU decision. Current status: '{recognition.Status}'" });
        }

        return NoContent();
    }

    private async Task<IActionResult> ProcessHrDecisionInternal(int id, HRDecisionRequest req, int userId)
    {
        _logger.LogInformation("Processing HR Decision: NominationId={NominationId}, Decision={Decision}, PerformedBy={UserId}", id, req.Decision, userId);

        var recognition = await _db.Recognitions
            .Include(r => r.FromEmployee)
            .Include(r => r.ToEmployee)
            .Include(r => r.Category)
            .Include(r => r.Audits)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recognition == null)
        {
            _logger.LogWarning("HR Decision failed: Nomination {NominationId} was not found", id);
            return NotFound(new { message = "Nomination not found." });
        }

        if (recognition.Status != "BU Shortlisted")
        {
            _logger.LogWarning("HR Decision failed: Nomination {NominationId} status is '{Status}', expected 'BU Shortlisted'", id, recognition.Status);
            return BadRequest(new { message = $"Only BU Shortlisted nominations can be processed by HR/Admin. Current status: '{recognition.Status}'" });
        }

        var admin = await _db.Employees.FindAsync(userId);
        var adminName = admin?.Name ?? "HR/Admin";

        if (req.Decision == "select")
        {
            var categoryId = recognition.CategoryId;
            var cycle = recognition.AwardCycle;

            var alreadyWinner = await _db.Recognitions
                .AnyAsync(r => r.CategoryId == categoryId &&
                               r.AwardCycle == cycle &&
                               r.Status == "Approved Winner");

            if (alreadyWinner)
            {
                _logger.LogWarning("HR Decision failed: Winner already selected for category '{Category}' in cycle '{Cycle}'", recognition.Category?.Name, cycle);
                return BadRequest(new { message = $"A winner has already been selected for this performance category in cycle '{cycle}'." });
            }

            recognition.Status = "Approved Winner";
            recognition.HRAdminId = userId;
            recognition.HRDecisionDate = DateTime.UtcNow;
            recognition.ToEmployee.TotalPoints += recognition.Points;

            _db.PointsAudits.Add(new PointsAudit
            {
                EmployeeId = recognition.ToEmployeeId,
                Points = recognition.Points,
                Reason = $"Winner Selected: {recognition.Category?.Name} (Cycle: {recognition.AwardCycle})",
                RecognitionId = recognition.Id,
                CreatedDate = DateTime.UtcNow
            });

            _db.NominationAudits.Add(new NominationAudit
            {
                RecognitionId = recognition.Id,
                Action = "Winner Selected",
                PerformedBy = adminName,
                Role = "HR/Admin",
                Comments = req.Comments ?? "Winner Selected by HR/Admin",
                CreatedDate = DateTime.UtcNow
            });

            _db.Notifications.Add(new Notification
            {
                EmployeeId = recognition.ToEmployeeId,
                Title = $"Congratulations! You won the {recognition.Category?.Name}!",
                Message = $"You were selected as the winner for \"{recognition.Category?.Name}\" (Cycle: {recognition.AwardCycle}) — you earned {recognition.Points} points!",
                Type = "award",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            var otherShortlisted = await _db.Recognitions
                .Where(r => r.Id != recognition.Id &&
                           r.CategoryId == categoryId &&
                           r.AwardCycle == cycle &&
                           r.Status == "BU Shortlisted")
                .ToListAsync();

            foreach (var other in otherShortlisted)
            {
                other.Status = "Not Selected";
                other.HRAdminId = userId;
                other.HRDecisionDate = DateTime.UtcNow;

                _db.NominationAudits.Add(new NominationAudit
                {
                    RecognitionId = other.Id,
                    Action = "Not Selected",
                    PerformedBy = adminName,
                    Role = "HR/Admin",
                    Comments = "Not selected by HR/Admin",
                    CreatedDate = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            _cache.Remove("dashboard:shared");
            _cache.Remove("employees:all");

            await SendTeamsAwardNotification(recognition, recognition.FromEmployee.Name);
        }
        else if (req.Decision == "reject")
        {
            recognition.Status = "Rejected";
            recognition.HRAdminId = userId;
            recognition.HRDecisionDate = DateTime.UtcNow;

            _db.NominationAudits.Add(new NominationAudit
            {
                RecognitionId = recognition.Id,
                Action = "Rejected",
                PerformedBy = adminName,
                Role = "HR/Admin",
                Comments = req.Comments ?? "Rejected by HR/Admin",
                CreatedDate = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
        else
        {
            _logger.LogWarning("HR Decision failed: Invalid decision '{Decision}'", req.Decision);
            return BadRequest(new { message = $"Invalid decision '{req.Decision}'." });
        }

        return NoContent();
    }

    [HttpPut("{id}/bu-decision")]
    public async Task<IActionResult> BuDecision(int id, [FromBody] BUDecisionRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "bu_manager" && userRole != "admin")
            return Forbid();

        if (req == null)
        {
            return BadRequest(new { message = "Decision request body is required." });
        }

        return await ProcessBuDecisionInternal(id, req, userId, userRole);
    }

    [HttpPut("{id}/hr-decision")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> HrDecision(int id, [FromBody] HRDecisionRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (req == null)
        {
            return BadRequest(new { message = "Decision request body is required." });
        }

        return await ProcessHrDecisionInternal(id, req, userId);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        var recognition = await _db.Recognitions.FindAsync(id);
        if (recognition == null) return NotFound();

        _logger.LogInformation("Legacy Approve redirect: NominationId={NominationId}, CurrentStatus={Status}, User={UserId}, Role={UserRole}", id, recognition.Status, userId, userRole);

        if (recognition.Status == "Pending BU Approval")
        {
            return await ProcessBuDecisionInternal(id, new BUDecisionRequest { Decision = "approve" }, userId, userRole);
        }
        else if (recognition.Status == "BU Shortlisted" && userRole == "admin")
        {
            return await ProcessHrDecisionInternal(id, new HRDecisionRequest { Decision = "select" }, userId);
        }
        else if (recognition.Status == "Pending BU Review")
        {
            return await ProcessBuDecisionInternal(id, new BUDecisionRequest { Decision = "shortlist" }, userId, userRole);
        }

        return BadRequest(new { message = $"Nomination cannot be approved. Current status is '{recognition.Status}'." });
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userRole = User.FindFirstValue("userRole")!;

        var recognition = await _db.Recognitions.FindAsync(id);
        if (recognition == null) return NotFound();

        _logger.LogInformation("Legacy Reject redirect: NominationId={NominationId}, CurrentStatus={Status}, User={UserId}, Role={UserRole}", id, recognition.Status, userId, userRole);

        if (recognition.Status == "Pending BU Approval" || recognition.Status == "Pending BU Review")
        {
            return await ProcessBuDecisionInternal(id, new BUDecisionRequest { Decision = "reject" }, userId, userRole);
        }
        else if (recognition.Status == "BU Shortlisted")
        {
            return await ProcessHrDecisionInternal(id, new HRDecisionRequest { Decision = "reject" }, userId);
        }

        return BadRequest(new { message = $"Nomination cannot be rejected. Current status is '{recognition.Status}'." });
    }


    private async Task SendTeamsAwardNotification(Recognition recognition, string nominatorName)
    {
        var teamWebhookUrl = _configuration["Teams:WebhookUrl"];
        if (string.IsNullOrWhiteSpace(teamWebhookUrl)) return;

        var awardName = recognition.Category?.Name ?? recognition.CustomCategory ?? "Spot Award";
        var pointsText = recognition.Points > 0 ? $"+{recognition.Points} pts" : "";

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
                            new
                            {
                                type = "TextBlock",
                                text = $"🎉 Congratulations on this award, {recognition.ToEmployee.Name}!",
                                weight = "Bolder",
                                size = "Large",
                                color = "Good",
                                wrap = true
                            },
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
                                            new { type = "TextBlock", text = $"{recognition.ToEmployee.Name} has been awarded", weight = "Bolder", wrap = true },
                                            new { type = "TextBlock", text = $"🏅 {awardName} {pointsText}", color = "Accent", weight = "Bolder", size = "Medium", wrap = true }
                                        }
                                    }
                                }
                            },
                            new { type = "TextBlock", text = $"👏 Nominated by: {nominatorName}", wrap = true },
                            new { type = "Container", style = "emphasis", items = new object[] { new { type = "TextBlock", text = $"Reason: {recognition.Message}", wrap = true, size = "Medium" } } }
                        },
                        actions = new object[]
                        {
                            new { type = "Action.OpenUrl", title = "🔗 View in App", url = "https://agreeable-grass-0a19b3703.7.azurestaticapps.net" }
                        }
                    }
                }
            }
        };

        using var httpClient = _httpClientFactory.CreateClient();
        try { await httpClient.PostAsJsonAsync(teamWebhookUrl, card); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to post award card to Teams webhook."); }
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

        var words = req.Message.Trim().Split(new[] { ' ', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 100)
            return BadRequest(new { message = "Comments cannot exceed 100 words." });

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

    [HttpPut("comments/{commentId}")]
    public async Task<IActionResult> EditComment(int commentId, [FromBody] CreateCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { message = "Comment cannot be empty." });

        var words = req.Message.Trim().Split(new[] { ' ', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 100)
            return BadRequest(new { message = "Comments cannot exceed 100 words." });

        if (req.Message.Length > 500)
            return BadRequest(new { message = "Comment must be 500 characters or fewer." });

        var comment = await _db.RecognitionComments
            .Include(c => c.Employee)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null) return NotFound(new { message = "Comment not found" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (comment.EmployeeId != userId)
            return Forbid();

        comment.Message = req.Message.Trim();
        await _db.SaveChangesAsync();

        return Ok(new RecognitionCommentDto
        {
            Id = comment.Id,
            RecognitionId = comment.RecognitionId,
            Message = comment.Message,
            CreatedAt = comment.CreatedAt,
            Employee = new EmployeeSimpleDto
            {
                Id = comment.Employee.Id,
                Name = comment.Employee.Name,
                Department = comment.Employee.Department,
                Location = comment.Employee.Location,
                Avatar = comment.Employee.Avatar
            }
        });
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(int commentId)
    {
        var comment = await _db.RecognitionComments.FindAsync(commentId);
        if (comment == null) return NotFound(new { message = "Comment not found" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (comment.EmployeeId != userId)
            return Forbid();

        _db.RecognitionComments.Remove(comment);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("bulk-appreciate")]
    public async Task<IActionResult> BulkAppreciate([FromBody] BulkAppreciateRequest req)
    {
        var userRole = User.FindFirstValue("userRole")!;
        if (userRole != "admin") return Forbid();

        if (req.RecipientIds == null || !req.RecipientIds.Any())
        {
            return BadRequest(new { message = "At least one recipient must be selected." });
        }

        if (string.IsNullOrWhiteSpace(req.Message))
        {
            return BadRequest(new { message = "Message is required." });
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nominator = await _db.Employees.FindAsync(userId);
        if (nominator == null) return BadRequest(new { message = "Nominator not found" });

        var recipients = await _db.Employees
            .Where(e => req.RecipientIds.Contains(e.Id) && e.IsActive)
            .ToListAsync();

        if (!recipients.Any())
        {
            return BadRequest(new { message = "No valid recipients found." });
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var createdRecognitions = new List<Recognition>();

            foreach (var recipient in recipients)
            {
                var recognition = new Recognition
                {
                    FromEmployeeId = userId,
                    ToEmployeeId = recipient.Id,
                    Message = req.Message.Trim(),
                    CategoryId = req.CategoryId,
                    Points = 0,
                    Type = "appreciation",
                    Status = "approved",
                    CreatedAt = DateTime.UtcNow
                };

                _db.Recognitions.Add(recognition);
                createdRecognitions.Add(recognition);
            }

            // Save once to generate IDs
            await _db.SaveChangesAsync();

            // Add notifications for each
            foreach (var recognition in createdRecognitions)
            {
                _db.Notifications.Add(new Notification
                {
                    EmployeeId = recognition.ToEmployeeId,
                    Title = "You've been appreciated!",
                    Message = $"{nominator.Name} sent you an appreciation: {req.Message.Trim()}",
                    Type = "appreciation",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Bulk appreciation transaction failed");
            return StatusCode(500, new { message = "An error occurred while sending bulk appreciations." });
        }

        // Clear caches
        _cache.Remove("dashboard:shared");
        _cache.Remove("employees:all");

        return Ok(new { message = $"Successfully sent appreciation to {recipients.Count} recipients." });
    }
}