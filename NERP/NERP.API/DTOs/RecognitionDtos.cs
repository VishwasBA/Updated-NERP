namespace EmployeeRecognition.API.DTOs;

public class CreateRecognitionRequest
{
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string Type { get; set; } = "appreciation";
    public bool ShareToTeams { get; set; } = false;
}
