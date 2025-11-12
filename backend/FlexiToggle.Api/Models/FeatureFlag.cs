using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Models;

public class FeatureFlag
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string Key { get; set; } = string.Empty; // Unique within project
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public FeatureFlagType Type { get; set; } = FeatureFlagType.Boolean;
    
    public bool IsArchived { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int ProjectId { get; set; }
    public virtual Project Project { get; set; } = null!;
    
    public int CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;
    
    // Navigation properties
    public virtual ICollection<FeatureFlagEnvironment> Environments { get; set; } = new List<FeatureFlagEnvironment>();
    public virtual ICollection<FeatureFlagEvent> Events { get; set; } = new List<FeatureFlagEvent>();
    public virtual ICollection<FeatureFlagTag> Tags { get; set; } = new List<FeatureFlagTag>();
}

public class FeatureFlagEnvironment
{
    public int Id { get; set; }
    
    public bool IsEnabled { get; set; } = false;
    
    public string? DefaultValue { get; set; } // JSON for complex types
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int FeatureFlagId { get; set; }
    public virtual FeatureFlag FeatureFlag { get; set; } = null!;
    
    public int EnvironmentId { get; set; }
    public virtual Environment Environment { get; set; } = null!;
    
    public int? UpdatedById { get; set; }
    public virtual User? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual ICollection<ActivationStrategy> ActivationStrategies { get; set; } = new List<ActivationStrategy>();
    public virtual ICollection<FeatureFlagMetric> Metrics { get; set; } = new List<FeatureFlagMetric>();
}

public class ActivationStrategy
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public StrategyType Type { get; set; } = StrategyType.Default;
    
    public string? Parameters { get; set; } // JSON configuration
    
    public string? Constraints { get; set; } // JSON constraints
    
    public int SortOrder { get; set; } = 0;
    
    public bool IsEnabled { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int FeatureFlagEnvironmentId { get; set; }
    public virtual FeatureFlagEnvironment FeatureFlagEnvironment { get; set; } = null!;
}

public class FeatureFlagEvent
{
    public int Id { get; set; }
    
    public EventType Type { get; set; }
    
    [StringLength(200)]
    public string? Description { get; set; }
    
    public string? Data { get; set; } // JSON data
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int FeatureFlagId { get; set; }
    public virtual FeatureFlag FeatureFlag { get; set; } = null!;
    
    public int? UserId { get; set; }
    public virtual User? User { get; set; }
    
    public int? EnvironmentId { get; set; }
    public virtual Environment? Environment { get; set; }
}

public class FeatureFlagMetric
{
    public int Id { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public int Evaluations { get; set; } = 0;
    
    public int EnabledCount { get; set; } = 0;
    
    public int DisabledCount { get; set; } = 0;
    
    public double? AverageResponseTime { get; set; }
    
    public int FeatureFlagEnvironmentId { get; set; }
    public virtual FeatureFlagEnvironment FeatureFlagEnvironment { get; set; } = null!;
}

public class Tag
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(7)]
    public string Color { get; set; } = "#007bff";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int ProjectId { get; set; }
    public virtual Project Project { get; set; } = null!;
    
    // Navigation properties
    public virtual ICollection<FeatureFlagTag> FeatureFlags { get; set; } = new List<FeatureFlagTag>();
}

public class FeatureFlagTag
{
    public int FeatureFlagId { get; set; }
    public virtual FeatureFlag FeatureFlag { get; set; } = null!;
    
    public int TagId { get; set; }
    public virtual Tag Tag { get; set; } = null!;
}

public enum FeatureFlagType
{
    Boolean = 0,
    String = 1,
    Number = 2,
    Json = 3
}

public enum StrategyType
{
    Default = 0,
    UserIds = 1,
    Percentage = 2,
    Gradual = 3,
    UserAttribute = 4,
    IpAddress = 5,
    Hostname = 6,
    ABTest = 7
}

public enum EventType
{
    Created = 0,
    Updated = 1,
    Enabled = 2,
    Disabled = 3,
    Archived = 4,
    Restored = 5,
    StrategyAdded = 6,
    StrategyUpdated = 7,
    StrategyRemoved = 8
}
