namespace EmployeeRecognition.API.Models;

public class RecognitionComment
{
    public int Id { get; set; }
    public int RecognitionId { get; set; }
    public Recognition Recognition { get; set; } = null!;
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
