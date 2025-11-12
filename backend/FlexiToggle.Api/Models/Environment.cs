using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Models;

public class Environment
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(20)]
    public string Key { get; set; } = string.Empty; // dev, staging, production
    
    [StringLength(200)]
    public string? Description { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public int SortOrder { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int ProjectId { get; set; }
    public virtual Project Project { get; set; } = null!;
    
    // Navigation properties
    public virtual ICollection<FeatureFlagEnvironment> FeatureFlags { get; set; } = new List<FeatureFlagEnvironment>();
    public virtual ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
}

public class ApiKey
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string KeyHash { get; set; } = string.Empty;
    
    [Required]
    public string KeyPrefix { get; set; } = string.Empty; // First 8 chars for display
    
    public ApiKeyType Type { get; set; } = ApiKeyType.Client;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ExpiresAt { get; set; }
    
    public DateTime? LastUsedAt { get; set; }
    
    public int EnvironmentId { get; set; }
    public virtual Environment Environment { get; set; } = null!;
    
    public int CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;
}

public enum ApiKeyType
{
    Client = 0,    // Frontend SDKs
    Server = 1     // Backend SDKs
}
