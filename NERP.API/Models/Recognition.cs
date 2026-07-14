namespace EmployeeRecognition.API.Models;

public class Recognition
{
    public int Id { get; set; }
    public int FromEmployeeId { get; set; }
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = "appreciation"; // appreciation, nomination
    public string Status { get; set; } = "approved"; // approved, pending, rejected

    public Employee FromEmployee { get; set; } = null!;
    public Employee ToEmployee { get; set; } = null!;
    public AwardCategory? Category { get; set; }

    public ICollection<RecognitionLike> Likes { get; set; } = new List<RecognitionLike>();
    public ICollection<RecognitionComment> Comments { get; set; } = new List<RecognitionComment>();
}
