using FlexiToggle.Api.DTOs;

namespace FlexiToggle.Api.Services;

public interface IFeatureFlagService
{
    Task<List<FeatureFlagDto>> GetFeatureFlagsAsync(int projectId, int? environmentId = null);
    Task<FeatureFlagDto?> GetFeatureFlagAsync(int id);
    Task<FeatureFlagDto> CreateFeatureFlagAsync(int projectId, CreateFeatureFlagRequest request, int userId);
    Task<FeatureFlagDto> UpdateFeatureFlagAsync(int id, UpdateFeatureFlagRequest request, int userId);
    Task<bool> DeleteFeatureFlagAsync(int id, int userId);
    Task<bool> ArchiveFeatureFlagAsync(int id, int userId);
    Task<bool> RestoreFeatureFlagAsync(int id, int userId);
    
    // Environment-specific operations
    Task<FeatureFlagEnvironmentDto> ToggleFeatureFlagAsync(int flagId, int environmentId, ToggleFeatureFlagRequest request, int userId);
    Task<FeatureFlagEnvironmentDto> UpdateFeatureFlagValueAsync(int flagId, int environmentId, UpdateFeatureFlagValueRequest request, int userId);
    
    // Activation strategies
    Task<ActivationStrategyDto> CreateActivationStrategyAsync(int flagId, int environmentId, CreateActivationStrategyRequest request, int userId);
    Task<ActivationStrategyDto> UpdateActivationStrategyAsync(int strategyId, CreateActivationStrategyRequest request, int userId);
    Task<bool> DeleteActivationStrategyAsync(int strategyId, int userId);
    
    // Feature flag evaluation
    Task<FeatureFlagEvaluationResponse> EvaluateFeatureFlagAsync(string projectKey, string environment, string flagKey, FeatureFlagEvaluationRequest request);
    Task<Dictionary<string, FeatureFlagEvaluationResponse>> EvaluateAllFeatureFlagsAsync(string projectKey, string environment, FeatureFlagEvaluationRequest request);
    
    // Analytics
    Task RecordFeatureFlagEvaluationAsync(int flagId, int environmentId, bool enabled, double? responseTime = null);
    Task<object> GetFeatureFlagAnalyticsAsync(int flagId, int environmentId, DateTime? from = null, DateTime? to = null);
}
