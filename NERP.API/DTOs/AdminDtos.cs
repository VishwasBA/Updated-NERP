namespace EmployeeRecognition.API.DTOs;

public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int? ManagerId { get; set; }
    public string? ManagerName { get; set; }
}

public class UpdateUserRoleRequest
{
    public string UserRole { get; set; } = string.Empty;
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class UpdateUserManagerRequest
{
    // Null clears the assignment (no manager).
    public int? ManagerId { get; set; }
}

public class ManagerOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}
