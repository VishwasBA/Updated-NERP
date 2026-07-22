namespace EmployeeRecognition.API.Models;

public class RecognitionLike
{
    public int Id { get; set; }
    public int RecognitionId { get; set; }
    public Recognition Recognition { get; set; } = null!;
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
