namespace EmployeeRecognition.API.DTOs;

public class TeamMemberDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public int AppreciationsGiven { get; set; }
    public int AppreciationsReceived { get; set; }
    public int Points { get; set; }
    public int RecognitionCount { get; set; }
    public int AwardsCount { get; set; }
    public int? ManagerId { get; set; }
    public List<TeamMemberDto> Reports { get; set; } = new();
}





public class TeamSummaryDto
{
    public int TeamMembers { get; set; }
    public int ThisMonthAppreciations { get; set; }
    public int PointsDistributed { get; set; }
    public int TeamRank { get; set; }
    public List<TeamMemberDto> Members { get; set; } = new();
}

// ---- Manager Dashboard ----

public class ManagerDashboardStatsDto
{
    public int TotalTeamMembers { get; set; }
    public int AppreciatedEmployees { get; set; }
    public int EmployeesWithoutRecognition { get; set; }
    public int PendingNominations { get; set; }
    public int TotalTeamPoints { get; set; }
}

public class EmployeeWithoutRecognitionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public int? DaysSinceLastAppreciation { get; set; } // null = never appreciated
    public int CurrentPoints { get; set; }
}

public class ManagerDashboardDto
{
    public ManagerDashboardStatsDto Stats { get; set; } = new();
    public List<RecognitionResponseDto> RecentAppreciations { get; set; } = new();
    public List<EmployeeWithoutRecognitionDto> EmployeesWithoutRecognition { get; set; } = new();
    public List<TeamMemberDto> TopPerformers { get; set; } = new();
    public List<TeamMemberDto> BottomPerformers { get; set; } = new();
    public List<TeamMemberDto> Members { get; set; } = new();
}
