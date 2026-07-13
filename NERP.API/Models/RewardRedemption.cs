namespace EmployeeRecognition.API.Models;

public class RewardRedemption
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public int ProductId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public int Points { get; set; }
    // pending | delivered | processing | rejected
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
