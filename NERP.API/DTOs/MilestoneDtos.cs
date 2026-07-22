namespace EmployeeRecognition.API.DTOs;

public class MilestoneDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    // "date" | "points" | "appreciations" | "award"
    public string Category { get; set; } = string.Empty;
    public bool Earned { get; set; }
    public DateTime? EarnedDate { get; set; }
    // 0-100. Always populated (100 when earned) so the UI can render a
    // progress bar consistently whether or not the milestone is complete.
    public int ProgressPercent { get; set; }
    public string ProgressLabel { get; set; } = string.Empty;
}
