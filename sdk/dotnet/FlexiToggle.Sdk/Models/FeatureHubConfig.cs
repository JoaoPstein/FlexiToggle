namespace FlexiToggle.Sdk.Models;

public class FlexiToggleConfig
{
    public string ApiUrl { get; set; } = "http://localhost:5000";
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = "production";
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public Dictionary<string, object> UserAttributes { get; set; } = new();
    public bool EnableAnalytics { get; set; } = true;
    public TimeSpan PollingInterval { get; set; } = TimeSpan.FromSeconds(30);
    public TimeSpan HttpTimeout { get; set; } = TimeSpan.FromSeconds(10);
}

public class EvaluationRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public Dictionary<string, object>? UserAttributes { get; set; }
}

public class EvaluationResponse
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public Dictionary<string, object> Flags { get; set; } = new();
    public DateTime EvaluatedAt { get; set; }
}

public class AnalyticsEvent
{
    public string Type { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
}

public class AnalyticsRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public List<AnalyticsEvent> Events { get; set; } = new();
}
