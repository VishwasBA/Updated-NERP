namespace EmployeeRecognition.API.DTOs;

public class DashboardSummaryDto
{
    public int TotalRecognitions { get; set; }
    public int TotalPointsAwarded { get; set; }
    public int UniqueRecognizedEmployees { get; set; }
    public int ActiveEmployees { get; set; }
    public int MonthlyPoints { get; set; }
    public int RecognitionsCount { get; set; }
    public int CurrentUserRank { get; set; }
    public List<LeaderboardEntryDto> TopPerformers { get; set; } = new();
    public List<RecognitionSummaryDto> RecentRecognitions { get; set; } = new();
}

public class LeaderboardEntryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int Points { get; set; }
}

public class RecognitionSummaryDto
{
    public int Id { get; set; }
    public int FromEmployeeId { get; set; }
    public int ToEmployeeId { get; set; }
    public EmployeeDto FromEmployee { get; set; } = null!;
    public EmployeeDto ToEmployee { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public RecognitionCategoryDto? Category { get; set; }
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class RecognitionCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}
