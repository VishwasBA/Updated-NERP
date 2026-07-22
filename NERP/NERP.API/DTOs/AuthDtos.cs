namespace EmployeeRecognition.API.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public EmployeeDto User { get; set; } = null!;
}

public class EmployeeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public int TotalPoints { get; set; }
    public int NominationCount { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public DateOnly? JoiningDate { get; set; }
    // Manager's display name, if one is assigned. Nullable rather than
    // empty-string since "no manager" is a meaningful distinct state (e.g.
    // top-level admins), not the same as an unset field.
    public string? ManagerName { get; set; }
    // Running "Self Development" training total not yet credited to
    // TotalPoints — see RecognitionsController.Approve for how it accrues.
    public int SelfDevelopmentAccumulatedPoints { get; set; }
}
