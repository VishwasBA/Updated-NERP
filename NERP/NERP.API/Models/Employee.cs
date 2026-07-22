namespace EmployeeRecognition.API.Models;

public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string UserRole { get; set; } = "employee"; // employee, manager, admin
    public int TotalPoints { get; set; } = 0;
    public string Avatar { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public string Location { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public DateOnly? JoiningDate { get; set; }

    // Reporting hierarchy: every employee optionally points at the manager
    // they report to. Admin assigns/updates this. Managers use it (not
    // Department) to scope which employees they can see/act on.
    public int? ManagerId { get; set; }
    public Employee? Manager { get; set; }
    public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();

    // Running total of not-yet-credited "Self Development" training points
    // (100 per approved nomination). Flushed into TotalPoints in chunks of
    // AwardCategory.AccumulationThreshold — see RecognitionsController.Approve.
    public int SelfDevelopmentAccumulatedPoints { get; set; } = 0;

    public ICollection<Recognition> RecognitionsGiven { get; set; } = new List<Recognition>();
    public ICollection<Recognition> RecognitionsReceived { get; set; } = new List<Recognition>();
}
