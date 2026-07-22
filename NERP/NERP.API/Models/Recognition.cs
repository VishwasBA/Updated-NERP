namespace EmployeeRecognition.API.Models;

public class Recognition
{
    public int Id { get; set; }
    public int FromEmployeeId { get; set; }
    public int ToEmployeeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = "appreciation"; // appreciation, nomination
    // approved, pending_peer_review, pending, rejected — see AwardCategory.ApprovalLevel
    public string Status { get; set; } = "approved";

    // Only set for 2-level-approval categories (ApprovalLevel == 2). Records
    // whichever other manager acted at the peer-review step, whether they
    // approved (moving it on to "pending" for Admin) or rejected it outright.
    public int? PeerReviewerId { get; set; }
    public Employee? PeerReviewer { get; set; }
    public DateTime? PeerReviewedAt { get; set; }

    public Employee FromEmployee { get; set; } = null!;
    public Employee ToEmployee { get; set; } = null!;
    public AwardCategory? Category { get; set; }

    public ICollection<RecognitionLike> Likes { get; set; } = new List<RecognitionLike>();
    public ICollection<RecognitionComment> Comments { get; set; } = new List<RecognitionComment>();
}
