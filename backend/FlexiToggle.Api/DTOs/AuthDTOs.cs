using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FlexiToggle.Api.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    [JsonPropertyName("Token")]
    public string Token { get; set; } = string.Empty;
    
    [JsonPropertyName("User")]
    public UserDto User { get; set; } = null!;
    
    [JsonPropertyName("ExpiresAt")]
    public DateTime ExpiresAt { get; set; }
}

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    [JsonPropertyName("Id")]
    public int Id { get; set; }
    
    [JsonPropertyName("Email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("Name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("Role")]
    public string Role { get; set; } = string.Empty;
    
    [JsonPropertyName("IsActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("CreatedAt")]
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("LastLoginAt")]
    public DateTime? LastLoginAt { get; set; }
}
