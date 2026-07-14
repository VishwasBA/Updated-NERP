namespace EmployeeRecognition.API.DTOs;

public class CreateRecognitionRequest
{
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string Type { get; set; } = "appreciation";
    public bool ShareToTeams { get; set; } = false;
}

public class RecognitionResponseDto
{
    public int Id { get; set; }
    public int FromEmployeeId { get; set; }
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; }
    public EmployeeSimpleDto FromEmployee { get; set; } = null!;
    public EmployeeSimpleDto ToEmployee { get; set; } = null!;
    public CategorySimpleDto? Category { get; set; }

    // Additive: reaction counts for the Recognition Page card (like button,
    // like count, comment count). Populated where the caller is known
    // (feed/list endpoints); left at defaults elsewhere.
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool LikedByMe { get; set; }
}

public class RecognitionCommentDto
{
    public int Id { get; set; }
    public int RecognitionId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public EmployeeSimpleDto Employee { get; set; } = null!;
}

public class CreateCommentRequest
{
    public string Message { get; set; } = string.Empty;
}

public class LikeStatusDto
{
    public int LikeCount { get; set; }
    public bool LikedByMe { get; set; }
}

public class EmployeeSimpleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    // Additive fields (non-breaking): existing consumers that only read
    // Id/Name are unaffected. Added so the Wall of Fame UI can show
    // company/department and country flag without a second round-trip.
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}

public class CategorySimpleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}
