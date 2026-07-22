namespace EmployeeRecognition.API.Models;

public class AwardCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Icon { get; set; } = string.Empty;
    public bool ManagerOnly { get; set; }

    // How many approval steps a nomination in this category needs before
    // points are credited. 0 = instant, no approval (Kudos). 1 = a single
    // Admin/HR approval (Spot Awards). 2 = a peer manager reviews first,
    // then Admin/HR gives the final approval (Employee of the Quarter,
    // Rising Star) — see Recognition.Status for the extra pending_peer_review
    // step this adds.
    public int ApprovalLevel { get; set; } = 1;

    // Self Development is the one category that doesn't award its points in
    // a single lump sum: each approved nomination adds AccumulationIncrement
    // to the recipient's running total, and only once that running total
    // reaches AccumulationThreshold does it actually get credited to their
    // real wallet balance (see Employee.SelfDevelopmentAccumulatedPoints).
    public bool IsAccumulative { get; set; } = false;
    public int AccumulationIncrement { get; set; } = 0;
    public int AccumulationThreshold { get; set; } = 0;

    // Rising Star is only open to employees who joined within the last
    // RecentJoinerMaxMonths months.
    public bool RequiresRecentJoiner { get; set; } = false;
    public int RecentJoinerMaxMonths { get; set; } = 0;
}
