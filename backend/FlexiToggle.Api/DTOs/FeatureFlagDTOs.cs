using System.ComponentModel.DataAnnotations;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.DTOs;

public class FeatureFlagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public UserDto CreatedBy { get; set; } = null!;
    public List<FeatureFlagEnvironmentDto> Environments { get; set; } = new();
    public List<TagDto> Tags { get; set; } = new();
}

public class FeatureFlagEnvironmentDto
{
    public int Id { get; set; }
    public bool IsEnabled { get; set; }
    public string? DefaultValue { get; set; }
    public DateTime UpdatedAt { get; set; }
    public EnvironmentDto Environment { get; set; } = null!;
    public UserDto? UpdatedBy { get; set; }
    public List<ActivationStrategyDto> ActivationStrategies { get; set; } = new();
}

public class ActivationStrategyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public object? Parameters { get; set; }
    public object? Constraints { get; set; }
    public int SortOrder { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateFeatureFlagRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-z0-9-_]+$", ErrorMessage = "Key deve conter apenas letras minúsculas, números, hífens e underscores")]
    public string Key { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public FeatureFlagType Type { get; set; } = FeatureFlagType.Boolean;
    
    public List<int>? TagIds { get; set; }
}

public class UpdateFeatureFlagRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public List<int>? TagIds { get; set; }
}

public class ToggleFeatureFlagRequest
{
    [Required]
    public bool IsEnabled { get; set; }
    
    public string? Reason { get; set; }
}

public class UpdateFeatureFlagValueRequest
{
    [Required]
    public string Value { get; set; } = string.Empty;
    
    public string? Reason { get; set; }
}

public class CreateActivationStrategyRequest
{
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public StrategyType Type { get; set; } = StrategyType.Default;
    
    public string? Parameters { get; set; }
    
    public string? Constraints { get; set; }
    
    public int SortOrder { get; set; } = 0;
    
    public bool IsEnabled { get; set; } = true;
}

public class FeatureFlagEvaluationRequest
{
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public Dictionary<string, object>? Properties { get; set; }
    public string? RemoteAddress { get; set; }
}

public class FeatureFlagEvaluationResponse
{
    public string Key { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public object? Value { get; set; }
    public string? Variant { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
