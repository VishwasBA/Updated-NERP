using System;

namespace EmployeeRecognition.API.Models;

public class NominationAudit
{
    public int Id { get; set; }
    public int RecognitionId { get; set; }
    public Recognition Recognition { get; set; } = null!;
    public string Action { get; set; } = string.Empty; // Nominated, Approved, Rejected, Shortlisted, Winner Selected, Points Allocated
    public string PerformedBy { get; set; } = string.Empty; // Name of person performing it
    public string Role { get; set; } = string.Empty; // CU Manager, BU Manager, HR/Admin
    public string Comments { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}
