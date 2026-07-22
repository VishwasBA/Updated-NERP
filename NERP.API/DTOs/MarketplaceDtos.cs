namespace EmployeeRecognition.API.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Image { get; set; }
    public int Price { get; set; }
    public bool InStock { get; set; } = true;
}

public class RedeemRequest
{
    public int ProductId { get; set; }
}

public class RedeemResponse
{
    public bool Success { get; set; }
    public int RemainingPoints { get; set; }
}
