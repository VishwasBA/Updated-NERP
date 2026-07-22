using System;

namespace EmployeeRecognition.API.Models;

public class PointsAudit
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public int Points { get; set; } // +500, +2000, +3000, etc.
    public string Reason { get; set; } = string.Empty;
    public int? RecognitionId { get; set; }
    public Recognition? Recognition { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}
