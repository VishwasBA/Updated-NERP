namespace EmployeeRecognition.API.DTOs;

public class TeamMemberDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int AppreciationsGiven { get; set; }
    public int AppreciationsReceived { get; set; }
    public int Points { get; set; }
}

public class TeamSummaryDto
{
    public int TeamMembers { get; set; }
    public int ThisMonthAppreciations { get; set; }
    public int PointsDistributed { get; set; }
    public int TeamRank { get; set; }
    public List<TeamMemberDto> Members { get; set; } = new();
}
