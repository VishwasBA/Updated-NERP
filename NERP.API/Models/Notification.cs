namespace EmployeeRecognition.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    // appreciation | reward | points | award | announcement | birthday
    public string Type { get; set; } = "appreciation";
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
