using System;

namespace EmployeeRecognition.API.DTOs;

public class ProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int TotalPoints { get; set; }
    public DateOnly? BirthDate { get; set; }
    public DateOnly? JoiningDate { get; set; }
}

public class UpdateProfileRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public DateOnly? JoiningDate { get; set; }
}
