using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EmployeeRecognition.API.Data;
using EmployeeRecognition.API.Models;
using EmployeeRecognition.API.Helpers;

namespace EmployeeRecognition.API.Services;

public class MilestoneNotificationService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MilestoneNotificationService> _logger;

    public MilestoneNotificationService(
        AppDbContext db,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<MilestoneNotificationService> logger)
    {
        _db = db;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task ProcessMilestonesAsync()
    {
        _logger.LogInformation("Processing employee birthday and work anniversary milestones...");

        var teamWebhookUrl = _configuration["Teams:WebhookUrl"];
        if (string.IsNullOrWhiteSpace(teamWebhookUrl))
        {
            _logger.LogWarning("Teams WebhookUrl is not configured. Skipping Teams cards posting.");
            return;
        }

        var today = DateTime.UtcNow;
        var currentYear = today.Year;

        // Fetch all active employees
        var employees = await _db.Employees
            .Where(e => e.IsActive)
            .ToListAsync();

        _logger.LogInformation("Loaded {Count} active employees for milestone check. Today is {Today:yyyy-MM-dd}", employees.Count, today);

        using var httpClient = _httpClientFactory.CreateClient();

        int birthdayCount = 0;
        int anniversaryCount = 0;

        foreach (var employee in employees)
        {
            _logger.LogInformation("Checking employee: {Name} (BirthDate: {BirthDate}, JoiningDate: {JoiningDate})", 
                employee.Name, 
                employee.BirthDate.HasValue ? employee.BirthDate.Value.ToString("yyyy-MM-dd") : "None", 
                employee.JoiningDate.HasValue ? employee.JoiningDate.Value.ToString("yyyy-MM-dd") : "None");

            // 🎂 BIRTHDAY CHECK
            bool isBirthdayToday = false;
            if (employee.BirthDate.HasValue)
            {
                var dob = employee.BirthDate.Value;
                if (dob.Month == today.Month && dob.Day == today.Day)
                {
                    isBirthdayToday = true;
                }
                else if (dob.Month == 2 && dob.Day == 29 && today.Month == 2 && today.Day == 28 && !DateTime.IsLeapYear(today.Year))
                {
                    isBirthdayToday = true;
                }
            }

            if (isBirthdayToday)
            {
                birthdayCount++;
                _logger.LogInformation("Birthday match found for: {Name}", employee.Name);

                // Check if already sent in this calendar year
                var alreadySent = await _db.Notifications.AnyAsync(n =>
                    n.EmployeeId == employee.Id &&
                    n.Type == "birthday" &&
                    n.CreatedAt.Year == currentYear);

                if (!alreadySent)
                {
                    _logger.LogInformation("Sending birthday card for employee: {Name} to Teams", employee.Name);
                    
                    var card = CreateBirthdayCard(employee);
                    try
                    {
                        var response = await httpClient.PostAsJsonAsync(teamWebhookUrl, card);
                        if (response.IsSuccessStatusCode)
                        {
                            _logger.LogInformation("Successfully posted birthday card to Teams for: {Name}", employee.Name);
                            // Add database notification to track
                            _db.Notifications.Add(new Notification
                            {
                                EmployeeId = employee.Id,
                                Title = "🎂 Happy Birthday!",
                                Message = $"Wishing you a fantastic birthday, {employee.Name}!",
                                Type = "birthday",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            });
                            await _db.SaveChangesAsync();
                        }
                        else
                        {
                            var content = await response.Content.ReadAsStringAsync();
                            _logger.LogError("Failed to post birthday card to Teams for {Name}. Status: {Status}, Response: {Response}", employee.Name, response.StatusCode, content);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Exception posting birthday card to Teams for {Name}", employee.Name);
                    }
                }
                else
                {
                    _logger.LogInformation("Birthday card already sent for {Name} in calendar year {Year}", employee.Name, currentYear);
                }
            }

            // 🎉 WORK ANNIVERSARY CHECK
            bool isAnniversaryToday = false;
            if (employee.JoiningDate.HasValue)
            {
                var doj = employee.JoiningDate.Value;
                if (doj.Month == today.Month && doj.Day == today.Day)
                {
                    isAnniversaryToday = true;
                }
                else if (doj.Month == 2 && doj.Day == 29 && today.Month == 2 && today.Day == 28 && !DateTime.IsLeapYear(today.Year))
                {
                    isAnniversaryToday = true;
                }
            }

            if (isAnniversaryToday)
            {
                anniversaryCount++;
                _logger.LogInformation("Work anniversary date match found for: {Name}", employee.Name);

                var years = today.Year - employee.JoiningDate!.Value.Year;
                _logger.LogInformation("Employee {Name} has completed {Years} years", employee.Name, years);

                if (years > 0)
                {
                    // Check if already sent in this calendar year
                    var alreadySent = await _db.Notifications.AnyAsync(n =>
                        n.EmployeeId == employee.Id &&
                        n.Type == "anniversary" &&
                        n.CreatedAt.Year == currentYear);

                    if (!alreadySent)
                    {
                        _logger.LogInformation("Sending work anniversary card for employee: {Name} ({Years} years) to Teams", employee.Name, years);

                        var card = CreateAnniversaryCard(employee, years);
                        try
                        {
                            var response = await httpClient.PostAsJsonAsync(teamWebhookUrl, card);
                            if (response.IsSuccessStatusCode)
                            {
                                _logger.LogInformation("Successfully posted work anniversary card to Teams for: {Name}", employee.Name);
                                // Add database notification to track
                                _db.Notifications.Add(new Notification
                                {
                                    EmployeeId = employee.Id,
                                    Title = "🎉 Happy Work Anniversary!",
                                    Message = $"Congratulations on completing {years} {(years == 1 ? "year" : "years")} at Nexer!",
                                    Type = "anniversary",
                                    IsRead = false,
                                    CreatedAt = DateTime.UtcNow
                                });
                                await _db.SaveChangesAsync();
                            }
                            else
                            {
                                var content = await response.Content.ReadAsStringAsync();
                                _logger.LogError("Failed to post anniversary card to Teams for {Name}. Status: {Status}, Response: {Response}", employee.Name, response.StatusCode, content);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Exception posting anniversary card to Teams for {Name}", employee.Name);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Work anniversary card already sent for {Name} in calendar year {Year}", employee.Name, currentYear);
                    }
                }
                else
                {
                    _logger.LogInformation("Work anniversary skipped for {Name} because years completed is {Years} (must be > 0)", employee.Name, years);
                }
            }
        }

        _logger.LogInformation("Finished milestone processing. Birthdays matched: {BirthdayCount}, Anniversaries matched: {AnniversaryCount}", birthdayCount, anniversaryCount);
    }

    private object CreateBirthdayCard(Employee employee)
    {
        var avatarUrl = AvatarHelper.GetAvatarUrl(employee.Name, employee.Avatar);
        var appUrl = _configuration["App:BaseUrl"] ?? "https://agreeable-grass-0a19b3703.7.azurestaticapps.net";
        var profileUrl = $"{appUrl.TrimEnd('/')}/profile";

        return new
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
                            // Title
                            new
                            {
                                type = "TextBlock",
                                text = $"🎂 Happy Birthday, {employee.Name}!",
                                weight = "Bolder",
                                size = "Large",
                                color = "Accent",
                                wrap = true
                            },
                            // Profile row
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
                                                url = avatarUrl,
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
                                                text = employee.Name,
                                                weight = "Bolder",
                                                wrap = true
                                            },
                                            new
                                            {
                                                type = "TextBlock",
                                                text = string.IsNullOrWhiteSpace(employee.Department) ? "Nexer Team" : employee.Department,
                                                color = "Accent",
                                                weight = "Bolder",
                                                size = "Medium",
                                                wrap = true
                                            }
                                        }
                                    }
                                }
                            },
                            // Message
                            new
                            {
                                type = "Container",
                                style = "emphasis",
                                items = new object[]
                                {
                                    new
                                    {
                                        type = "TextBlock",
                                        text = "Wishing you a fantastic birthday filled with happiness, success, and memorable moments.\n\nThank you for being a valued member of Nexer.\n\nBest Wishes,\nNexer Team",
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
                                title = "🔗 View Profile",
                                url = profileUrl
                            }
                        }
                    }
                }
            }
        };
    }

    private object CreateAnniversaryCard(Employee employee, int years)
    {
        var avatarUrl = AvatarHelper.GetAvatarUrl(employee.Name, employee.Avatar);
        var appUrl = _configuration["App:BaseUrl"] ?? "https://agreeable-grass-0a19b3703.7.azurestaticapps.net";
        var profileUrl = $"{appUrl.TrimEnd('/')}/profile";
        var yearsText = years == 1 ? "1 Year" : $"{years} Years";

        return new
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
                            // Title
                            new
                            {
                                type = "TextBlock",
                                text = $"🎉 Happy Work Anniversary, {employee.Name}!",
                                weight = "Bolder",
                                size = "Large",
                                color = "Good",
                                wrap = true
                            },
                            // Profile row
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
                                                url = avatarUrl,
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
                                                text = employee.Name,
                                                weight = "Bolder",
                                                wrap = true
                                            },
                                            new
                                            {
                                                type = "TextBlock",
                                                text = string.IsNullOrWhiteSpace(employee.Department) ? "Nexer Team" : employee.Department,
                                                color = "Accent",
                                                weight = "Bolder",
                                                size = "Medium",
                                                wrap = true
                                            }
                                        }
                                    }
                                }
                            },
                            // Message
                            new
                            {
                                type = "Container",
                                style = "emphasis",
                                items = new object[]
                                {
                                    new
                                    {
                                        type = "TextBlock",
                                        text = $"Congratulations on completing {yearsText} at Nexer.\n\nThank you for your dedication, commitment, and valuable contributions throughout your journey with us.\n\nWe appreciate everything you do and wish you continued success.\n\nRegards,\nNexer Team",
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
                                title = "🔗 View Profile",
                                url = profileUrl
                            }
                        }
                    }
                }
            }
        };
    }
}
