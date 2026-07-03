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

    public ICollection<Recognition> RecognitionsGiven { get; set; } = new List<Recognition>();
    public ICollection<Recognition> RecognitionsReceived { get; set; } = new List<Recognition>();
}
