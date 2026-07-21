namespace EmployeeRecognition.API.DTOs;

public class CreateRecognitionRequest
{
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string Type { get; set; } = "appreciation";
    public bool ShareToTeams { get; set; } = false;
    public string? CustomCategory { get; set; }
    public string? AwardCycle { get; set; }
}

public class BUDecisionRequest
{
    public string Decision { get; set; } = string.Empty; // approve, reject, shortlist
    public string? Comments { get; set; }
}

public class HRDecisionRequest
{
    public string Decision { get; set; } = string.Empty; // select, reject
    public string? Comments { get; set; }
}

public class NominationAuditDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Comments { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
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

    public string? CustomCategory { get; set; }
    public string? AwardCycle { get; set; }
    public int? BUManagerId { get; set; }
    public string? BUManagerName { get; set; }
    public DateTime? BUDecisionDate { get; set; }
    public int? HRAdminId { get; set; }
    public string? HRAdminName { get; set; }
    public DateTime? HRDecisionDate { get; set; }
    public List<NominationAuditDto> Audits { get; set; } = new List<NominationAuditDto>();

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

public class BulkAppreciateRequest
{
    public List<int> RecipientIds { get; set; } = new List<int>();
    public int? CategoryId { get; set; }
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
    public string AwardType { get; set; } = string.Empty;
}

