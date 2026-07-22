namespace EmployeeRecognition.API.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

// New, additive DTO for the org-wide milestone feed (Wall of Fame ->
// Milestones tab). Does not replace or change NotificationDto / the
// existing per-user GET /api/notifications endpoint.
public class MilestoneFeedItemDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    // "birthday" | "anniversary"
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
