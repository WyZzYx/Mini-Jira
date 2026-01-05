using System.ComponentModel.DataAnnotations;

namespace MiniJira.Api.DTOs;

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = "";

    [Required, MinLength(8), MaxLength(64)]
    public string Password { get; set; } = "";

    [Required, MinLength(2), MaxLength(80)]
    public string Name { get; set; } = "";

    [Required, MinLength(3), MaxLength(64)]
    public string DepartmentId { get; set; } = "";
}
