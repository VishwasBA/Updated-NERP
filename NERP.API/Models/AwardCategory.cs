namespace EmployeeRecognition.API.Models;

public class AwardCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Icon { get; set; } = string.Empty;
    public bool ManagerOnly { get; set; }
}
