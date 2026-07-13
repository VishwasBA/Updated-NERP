namespace EmployeeRecognition.API.DTOs;

public class AnalyticsOverviewDto
{
    public int TotalAppreciations { get; set; }
    public int ActiveUsers { get; set; }
    public int PointsIssued { get; set; }
    public double RedemptionRate { get; set; }
    public List<TrendPointDto> AppreciationsOverTime { get; set; } = new();
    public List<CategoryCountDto> TopCategories { get; set; } = new();
    public List<DepartmentEngagementDto> DepartmentEngagement { get; set; } = new();
}

public class TrendPointDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class CategoryCountDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DepartmentEngagementDto
{
    public string Department { get; set; } = string.Empty;
    public int Recognitions { get; set; }
    public int Employees { get; set; }
    public double ParticipationRate { get; set; }
}
