using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FlexiToggle.Api.Hubs;

[Authorize]
public class FlexiToggleHub : Hub
{
    private readonly ILogger<FlexiToggleHub> _logger;

    public FlexiToggleHub(ILogger<FlexiToggleHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
        
        _logger.LogInformation("User {UserEmail} connected to FeatureHub Hub", userEmail);
        
        // Join user to their personal group
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value;
        _logger.LogInformation("User {UserEmail} disconnected from FeatureHub Hub", userEmail);
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a project group to receive project-specific updates
    /// </summary>
    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId}");
        _logger.LogDebug("User joined project group: project_{ProjectId}", projectId);
    }

    /// <summary>
    /// Leave a project group
    /// </summary>
    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId}");
        _logger.LogDebug("User left project group: project_{ProjectId}", projectId);
    }

    /// <summary>
    /// Join an environment group to receive environment-specific updates
    /// </summary>
    public async Task JoinEnvironment(string projectId, string environmentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId}_env_{environmentId}");
        _logger.LogDebug("User joined environment group: project_{ProjectId}_env_{EnvironmentId}", projectId, environmentId);
    }

    /// <summary>
    /// Leave an environment group
    /// </summary>
    public async Task LeaveEnvironment(string projectId, string environmentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId}_env_{environmentId}");
        _logger.LogDebug("User left environment group: project_{ProjectId}_env_{EnvironmentId}", projectId, environmentId);
    }
}

public static class FlexiToggleHubExtensions
{
    /// <summary>
    /// Send feature flag update to project members
    /// </summary>
    public static async Task NotifyFeatureFlagUpdated(this IHubContext<FlexiToggleHub> hubContext, 
        int projectId, object featureFlag)
    {
        await hubContext.Clients.Group($"project_{projectId}")
            .SendAsync("FeatureFlagUpdated", featureFlag);
    }

    /// <summary>
    /// Send feature flag toggle notification
    /// </summary>
    public static async Task NotifyFeatureFlagToggled(this IHubContext<FlexiToggleHub> hubContext,
        int projectId, int environmentId, object featureFlag)
    {
        await hubContext.Clients.Group($"project_{projectId}")
            .SendAsync("FeatureFlagToggled", featureFlag);
        
        await hubContext.Clients.Group($"project_{projectId}_env_{environmentId}")
            .SendAsync("FeatureFlagToggled", featureFlag);
    }

    /// <summary>
    /// Send project update notification
    /// </summary>
    public static async Task NotifyProjectUpdated(this IHubContext<FlexiToggleHub> hubContext,
        int projectId, object project)
    {
        await hubContext.Clients.Group($"project_{projectId}")
            .SendAsync("ProjectUpdated", project);
    }

    /// <summary>
    /// Send real-time metrics update
    /// </summary>
    public static async Task NotifyMetricsUpdated(this IHubContext<FlexiToggleHub> hubContext,
        int projectId, int environmentId, object metrics)
    {
        await hubContext.Clients.Group($"project_{projectId}_env_{environmentId}")
            .SendAsync("MetricsUpdated", metrics);
    }

    /// <summary>
    /// Send user notification
    /// </summary>
    public static async Task NotifyUser(this IHubContext<FlexiToggleHub> hubContext,
        int userId, string type, object data)
    {
        await hubContext.Clients.Group($"user_{userId}")
            .SendAsync("Notification", new { type, data, timestamp = DateTime.UtcNow });
    }
}
