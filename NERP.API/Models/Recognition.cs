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

    public string? CustomCategory { get; set; }
    public string? AwardCycle { get; set; }
    public int? BUManagerId { get; set; }
    public Employee? BUManager { get; set; }
    public DateTime? BUDecisionDate { get; set; }
    public int? HRAdminId { get; set; }
    public Employee? HRAdmin { get; set; }
    public DateTime? HRDecisionDate { get; set; }

    public ICollection<RecognitionLike> Likes { get; set; } = new List<RecognitionLike>();
    public ICollection<RecognitionComment> Comments { get; set; } = new List<RecognitionComment>();
    public ICollection<NominationAudit> Audits { get; set; } = new List<NominationAudit>();
}

