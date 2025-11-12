using System.ComponentModel.DataAnnotations;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Key { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public UserDto CreatedBy { get; set; } = null!;
    public List<EnvironmentDto> Environments { get; set; } = new();
    public List<ProjectMemberDto> Members { get; set; } = new();
    public int FeatureFlagsCount { get; set; }
}

public class ProjectMemberDto
{
    public int Id { get; set; }
    public UserDto User { get; set; } = null!;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class EnvironmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ApiKeyDto> ApiKeys { get; set; } = new();
}

public class ApiKeyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public UserDto CreatedBy { get; set; } = null!;
}

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateProjectRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    // Key será fornecida pelo frontend (gerada automaticamente)
    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-z0-9-_]+$", ErrorMessage = "Key deve conter apenas letras minúsculas, números, hífens e underscores")]
    public string Key { get; set; } = string.Empty;
}

public class UpdateProjectRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
}

public class CreateEnvironmentRequest
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(20)]
    [RegularExpression(@"^[a-z0-9-_]+$", ErrorMessage = "Key deve conter apenas letras minúsculas, números, hífens e underscores")]
    public string Key { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? Description { get; set; }
    
    public int SortOrder { get; set; } = 0;
}

public class CreateApiKeyRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public ApiKeyType Type { get; set; } = ApiKeyType.Client;
    
    public DateTime? ExpiresAt { get; set; }
}

public class CreateApiKeyResponse
{
    public ApiKeyDto ApiKey { get; set; } = null!;
    public string Key { get; set; } = string.Empty; // Full key - only shown once
}

public class AddProjectMemberRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public ProjectRole Role { get; set; } = ProjectRole.Developer;
}

public class UpdateProjectMemberRequest
{
    public ProjectRole Role { get; set; } = ProjectRole.Developer;
}

public class CreateTagRequest
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color deve ser um código hexadecimal válido")]
    public string Color { get; set; } = "#007bff";
}
