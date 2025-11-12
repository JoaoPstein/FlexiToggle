using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Models;

public class Webhook
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Url]
    public string Url { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public string? Secret { get; set; } // Para validação HMAC
    
    // Eventos que disparam o webhook
    public WebhookEvents Events { get; set; } = WebhookEvents.None;
    
    // Headers customizados (JSON)
    public string? CustomHeaders { get; set; }
    
    // Timeout em segundos
    public int TimeoutSeconds { get; set; } = 30;
    
    // Retry configuration
    public int MaxRetries { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 5;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int ProjectId { get; set; }
    public virtual Project Project { get; set; } = null!;
    
    public int CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;
    
    // Navigation properties
    public virtual ICollection<WebhookDelivery> Deliveries { get; set; } = new List<WebhookDelivery>();
}

public class WebhookDelivery
{
    public int Id { get; set; }
    
    public int WebhookId { get; set; }
    public virtual Webhook Webhook { get; set; } = null!;
    
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty; // JSON
    
    public WebhookDeliveryStatus Status { get; set; } = WebhookDeliveryStatus.Pending;
    
    public int? ResponseStatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public string? ErrorMessage { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; set; }
    
    public int AttemptCount { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }
}

[Flags]
public enum WebhookEvents
{
    None = 0,
    
    // Feature Flag Events
    FlagCreated = 1 << 0,
    FlagUpdated = 1 << 1,
    FlagDeleted = 1 << 2,
    FlagToggled = 1 << 3,
    FlagArchived = 1 << 4,
    
    // Project Events
    ProjectCreated = 1 << 5,
    ProjectUpdated = 1 << 6,
    ProjectDeleted = 1 << 7,
    
    // Environment Events
    EnvironmentCreated = 1 << 8,
    EnvironmentUpdated = 1 << 9,
    EnvironmentDeleted = 1 << 10,
    
    // User Events
    UserAdded = 1 << 11,
    UserRemoved = 1 << 12,
    UserRoleChanged = 1 << 13,
    
    // A/B Test Events
    TestCreated = 1 << 14,
    TestStarted = 1 << 15,
    TestCompleted = 1 << 16,
    TestPaused = 1 << 17,
    
    // Analytics Events
    ThresholdReached = 1 << 18,
    AnomalyDetected = 1 << 19,
    
    // All events
    All = FlagCreated | FlagUpdated | FlagDeleted | FlagToggled | FlagArchived |
          ProjectCreated | ProjectUpdated | ProjectDeleted |
          EnvironmentCreated | EnvironmentUpdated | EnvironmentDeleted |
          UserAdded | UserRemoved | UserRoleChanged |
          TestCreated | TestStarted | TestCompleted | TestPaused |
          ThresholdReached | AnomalyDetected
}

public enum WebhookDeliveryStatus
{
    Pending = 0,
    Delivered = 1,
    Failed = 2,
    Retrying = 3,
    Cancelled = 4
}

// Payload models
public class WebhookPayload
{
    public string Event { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string ProjectId { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public object Data { get; set; } = new();
    public WebhookMetadata Metadata { get; set; } = new();
}

public class WebhookMetadata
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public Dictionary<string, object> Additional { get; set; } = new();
}

// Event-specific payload data
public class FlagEventData
{
    public string FlagId { get; set; } = string.Empty;
    public string FlagKey { get; set; } = string.Empty;
    public string FlagName { get; set; } = string.Empty;
    public string FlagType { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public object? Value { get; set; }
    public object? PreviousValue { get; set; }
    public string? Reason { get; set; }
}

public class ProjectEventData
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class TestEventData
{
    public string TestId { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string FlagKey { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public object[] Variants { get; set; } = Array.Empty<object>();
    public object[] Metrics { get; set; } = Array.Empty<object>();
}
