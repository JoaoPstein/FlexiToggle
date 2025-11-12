using Microsoft.EntityFrameworkCore;
using AutoMapper;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.Services;

public class FeatureFlagService : IFeatureFlagService
{
    private readonly FlexiToggleContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<FeatureFlagService> _logger;

    public FeatureFlagService(
        FlexiToggleContext context,
        IMapper mapper,
        ILogger<FeatureFlagService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<FeatureFlagDto>> GetFeatureFlagsAsync(int projectId, int? environmentId = null)
    {
        try
        {
            var query = _context.FeatureFlags
                .Include(ff => ff.CreatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.Environment)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.UpdatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.ActivationStrategies)
                .Include(ff => ff.Tags)
                    .ThenInclude(fft => fft.Tag)
                .Where(ff => ff.ProjectId == projectId && !ff.IsArchived);

            var featureFlags = await query
                .OrderBy(ff => ff.Name)
                .ToListAsync();

            return _mapper.Map<List<FeatureFlagDto>>(featureFlags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flags for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<FeatureFlagDto?> GetFeatureFlagAsync(int id)
    {
        try
        {
            var featureFlag = await _context.FeatureFlags
                .Include(ff => ff.CreatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.Environment)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.UpdatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.ActivationStrategies)
                .Include(ff => ff.Tags)
                    .ThenInclude(fft => fft.Tag)
                .FirstOrDefaultAsync(ff => ff.Id == id);

            return featureFlag != null ? _mapper.Map<FeatureFlagDto>(featureFlag) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flag {FeatureFlagId}", id);
            throw;
        }
    }

    public async Task<FeatureFlagDto> CreateFeatureFlagAsync(int projectId, CreateFeatureFlagRequest request, int userId)
    {
        try
        {
            // Check if feature flag key already exists in project
            var existingFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.ProjectId == projectId && ff.Key == request.Key);

            if (existingFlag != null)
            {
                throw new InvalidOperationException("Já existe uma feature flag com esta chave neste projeto");
            }

            var featureFlag = _mapper.Map<FeatureFlag>(request);
            featureFlag.ProjectId = projectId;
            featureFlag.CreatedById = userId;

            _context.FeatureFlags.Add(featureFlag);
            await _context.SaveChangesAsync();

            // Create feature flag environments for all project environments
            var environments = await _context.Environments
                .Where(e => e.ProjectId == projectId && e.IsActive)
                .ToListAsync();

            var featureFlagEnvironments = environments.Select(env => new FeatureFlagEnvironment
            {
                FeatureFlagId = featureFlag.Id,
                EnvironmentId = env.Id,
                IsEnabled = false,
                DefaultValue = GetDefaultValueForType(featureFlag.Type),
                UpdatedById = userId,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            _context.FeatureFlagEnvironments.AddRange(featureFlagEnvironments);

            // Add tags if specified
            if (request.TagIds?.Any() == true)
            {
                var validTagIds = await _context.Tags
                    .Where(t => t.ProjectId == projectId && request.TagIds.Contains(t.Id))
                    .Select(t => t.Id)
                    .ToListAsync();

                var featureFlagTags = validTagIds.Select(tagId => new FeatureFlagTag
                {
                    FeatureFlagId = featureFlag.Id,
                    TagId = tagId
                }).ToList();

                _context.FeatureFlagTags.AddRange(featureFlagTags);
            }

            // Create event
            var createEvent = new FeatureFlagEvent
            {
                FeatureFlagId = featureFlag.Id,
                Type = EventType.Created,
                Description = "Feature flag criada",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(createEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagName} created in project {ProjectId} by user {UserId}", 
                featureFlag.Name, projectId, userId);

            // Reload with includes
            var createdFeatureFlag = await _context.FeatureFlags
                .Include(ff => ff.CreatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.Environment)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.UpdatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.ActivationStrategies)
                .Include(ff => ff.Tags)
                    .ThenInclude(fft => fft.Tag)
                .FirstAsync(ff => ff.Id == featureFlag.Id);

            return _mapper.Map<FeatureFlagDto>(createdFeatureFlag);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feature flag in project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<FeatureFlagDto> UpdateFeatureFlagAsync(int id, UpdateFeatureFlagRequest request, int userId)
    {
        try
        {
            var featureFlag = await _context.FeatureFlags
                .Include(ff => ff.Tags)
                .FirstOrDefaultAsync(ff => ff.Id == id);

            if (featureFlag == null)
            {
                throw new InvalidOperationException("Feature flag não encontrada");
            }

            if (featureFlag.IsArchived)
            {
                throw new InvalidOperationException("Não é possível atualizar uma feature flag arquivada");
            }

            featureFlag.Name = request.Name;
            featureFlag.Description = request.Description;
            featureFlag.UpdatedAt = DateTime.UtcNow;

            // Update tags
            if (request.TagIds != null)
            {
                // Remove existing tags
                var existingTags = featureFlag.Tags.ToList();
                _context.FeatureFlagTags.RemoveRange(existingTags);

                // Add new tags
                if (request.TagIds.Any())
                {
                    var validTagIds = await _context.Tags
                        .Where(t => t.ProjectId == featureFlag.ProjectId && request.TagIds.Contains(t.Id))
                        .Select(t => t.Id)
                        .ToListAsync();

                    var newFeatureFlagTags = validTagIds.Select(tagId => new FeatureFlagTag
                    {
                        FeatureFlagId = featureFlag.Id,
                        TagId = tagId
                    }).ToList();

                    _context.FeatureFlagTags.AddRange(newFeatureFlagTags);
                }
            }

            // Create event
            var updateEvent = new FeatureFlagEvent
            {
                FeatureFlagId = featureFlag.Id,
                Type = EventType.Updated,
                Description = "Feature flag atualizada",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(updateEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} updated by user {UserId}", id, userId);

            // Reload with includes
            var updatedFeatureFlag = await _context.FeatureFlags
                .Include(ff => ff.CreatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.Environment)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.UpdatedBy)
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.ActivationStrategies)
                .Include(ff => ff.Tags)
                    .ThenInclude(fft => fft.Tag)
                .FirstAsync(ff => ff.Id == id);

            return _mapper.Map<FeatureFlagDto>(updatedFeatureFlag);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating feature flag {FeatureFlagId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteFeatureFlagAsync(int id, int userId)
    {
        try
        {
            var featureFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.Id == id);

            if (featureFlag == null)
            {
                return false;
            }

            _context.FeatureFlags.Remove(featureFlag);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} deleted by user {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting feature flag {FeatureFlagId}", id);
            throw;
        }
    }

    public async Task<bool> ArchiveFeatureFlagAsync(int id, int userId)
    {
        try
        {
            var featureFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.Id == id);

            if (featureFlag == null)
            {
                return false;
            }

            featureFlag.IsArchived = true;
            featureFlag.UpdatedAt = DateTime.UtcNow;

            // Create event
            var archiveEvent = new FeatureFlagEvent
            {
                FeatureFlagId = id,
                Type = EventType.Archived,
                Description = "Feature flag arquivada",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(archiveEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} archived by user {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving feature flag {FeatureFlagId}", id);
            throw;
        }
    }

    public async Task<bool> RestoreFeatureFlagAsync(int id, int userId)
    {
        try
        {
            var featureFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.Id == id);

            if (featureFlag == null)
            {
                return false;
            }

            featureFlag.IsArchived = false;
            featureFlag.UpdatedAt = DateTime.UtcNow;

            // Create event
            var restoreEvent = new FeatureFlagEvent
            {
                FeatureFlagId = id,
                Type = EventType.Restored,
                Description = "Feature flag restaurada",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(restoreEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} restored by user {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring feature flag {FeatureFlagId}", id);
            throw;
        }
    }

    public async Task<FeatureFlagEnvironmentDto> ToggleFeatureFlagAsync(int flagId, int environmentId, ToggleFeatureFlagRequest request, int userId)
    {
        try
        {
            var featureFlagEnv = await _context.FeatureFlagEnvironments
                .Include(ffe => ffe.FeatureFlag)
                .Include(ffe => ffe.Environment)
                .Include(ffe => ffe.UpdatedBy)
                .Include(ffe => ffe.ActivationStrategies)
                .FirstOrDefaultAsync(ffe => 
                    ffe.FeatureFlagId == flagId && 
                    ffe.EnvironmentId == environmentId);

            if (featureFlagEnv == null)
            {
                throw new InvalidOperationException("Feature flag não encontrada neste ambiente");
            }

            if (featureFlagEnv.FeatureFlag.IsArchived)
            {
                throw new InvalidOperationException("Não é possível alterar uma feature flag arquivada");
            }

            featureFlagEnv.IsEnabled = request.IsEnabled;
            featureFlagEnv.UpdatedById = userId;
            featureFlagEnv.UpdatedAt = DateTime.UtcNow;

            // Create event
            var toggleEvent = new FeatureFlagEvent
            {
                FeatureFlagId = flagId,
                Type = request.IsEnabled ? EventType.Enabled : EventType.Disabled,
                Description = request.Reason ?? (request.IsEnabled ? "Feature flag habilitada" : "Feature flag desabilitada"),
                UserId = userId,
                EnvironmentId = environmentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(toggleEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} {Action} in environment {EnvironmentId} by user {UserId}", 
                flagId, request.IsEnabled ? "enabled" : "disabled", environmentId, userId);

            return _mapper.Map<FeatureFlagEnvironmentDto>(featureFlagEnv);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling feature flag {FeatureFlagId} in environment {EnvironmentId}", flagId, environmentId);
            throw;
        }
    }

    public async Task<FeatureFlagEnvironmentDto> UpdateFeatureFlagValueAsync(int flagId, int environmentId, UpdateFeatureFlagValueRequest request, int userId)
    {
        try
        {
            var featureFlagEnv = await _context.FeatureFlagEnvironments
                .Include(ffe => ffe.FeatureFlag)
                .Include(ffe => ffe.Environment)
                .Include(ffe => ffe.UpdatedBy)
                .Include(ffe => ffe.ActivationStrategies)
                .FirstOrDefaultAsync(ffe => 
                    ffe.FeatureFlagId == flagId && 
                    ffe.EnvironmentId == environmentId);

            if (featureFlagEnv == null)
            {
                throw new InvalidOperationException("Feature flag não encontrada neste ambiente");
            }

            if (featureFlagEnv.FeatureFlag.IsArchived)
            {
                throw new InvalidOperationException("Não é possível alterar uma feature flag arquivada");
            }

            featureFlagEnv.DefaultValue = request.Value;
            featureFlagEnv.UpdatedById = userId;
            featureFlagEnv.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} value updated in environment {EnvironmentId} by user {UserId}", 
                flagId, environmentId, userId);

            return _mapper.Map<FeatureFlagEnvironmentDto>(featureFlagEnv);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating feature flag {FeatureFlagId} value in environment {EnvironmentId}", flagId, environmentId);
            throw;
        }
    }

    public async Task<ActivationStrategyDto> CreateActivationStrategyAsync(int flagId, int environmentId, CreateActivationStrategyRequest request, int userId)
    {
        try
        {
            var featureFlagEnv = await _context.FeatureFlagEnvironments
                .FirstOrDefaultAsync(ffe => 
                    ffe.FeatureFlagId == flagId && 
                    ffe.EnvironmentId == environmentId);

            if (featureFlagEnv == null)
            {
                throw new InvalidOperationException("Feature flag não encontrada neste ambiente");
            }

            var strategy = _mapper.Map<ActivationStrategy>(request);
            strategy.FeatureFlagEnvironmentId = featureFlagEnv.Id;

            _context.ActivationStrategies.Add(strategy);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Activation strategy created for feature flag {FeatureFlagId} in environment {EnvironmentId} by user {UserId}", 
                flagId, environmentId, userId);

            return _mapper.Map<ActivationStrategyDto>(strategy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating activation strategy for feature flag {FeatureFlagId} in environment {EnvironmentId}", flagId, environmentId);
            throw;
        }
    }

    public async Task<ActivationStrategyDto> UpdateActivationStrategyAsync(int strategyId, CreateActivationStrategyRequest request, int userId)
    {
        try
        {
            var strategy = await _context.ActivationStrategies
                .FirstOrDefaultAsync(s => s.Id == strategyId);

            if (strategy == null)
            {
                throw new InvalidOperationException("Estratégia de ativação não encontrada");
            }

            strategy.Name = request.Name;
            strategy.Type = request.Type;
            strategy.Parameters = request.Parameters;
            strategy.Constraints = request.Constraints;
            strategy.SortOrder = request.SortOrder;
            strategy.IsEnabled = request.IsEnabled;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Activation strategy {StrategyId} updated by user {UserId}", strategyId, userId);

            return _mapper.Map<ActivationStrategyDto>(strategy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating activation strategy {StrategyId}", strategyId);
            throw;
        }
    }

    public async Task<bool> DeleteActivationStrategyAsync(int strategyId, int userId)
    {
        try
        {
            var strategy = await _context.ActivationStrategies
                .FirstOrDefaultAsync(s => s.Id == strategyId);

            if (strategy == null)
            {
                return false;
            }

            _context.ActivationStrategies.Remove(strategy);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Activation strategy {StrategyId} deleted by user {UserId}", strategyId, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting activation strategy {StrategyId}", strategyId);
            throw;
        }
    }

    public async Task<FeatureFlagEvaluationResponse> EvaluateFeatureFlagAsync(string projectKey, string environment, string flagKey, FeatureFlagEvaluationRequest request)
    {
        try
        {
            var featureFlagEnv = await _context.FeatureFlagEnvironments
                .Include(ffe => ffe.FeatureFlag)
                .Include(ffe => ffe.Environment)
                    .ThenInclude(e => e.Project)
                .Include(ffe => ffe.ActivationStrategies.Where(s => s.IsEnabled))
                .FirstOrDefaultAsync(ffe => 
                    ffe.FeatureFlag.Key == flagKey &&
                    ffe.Environment.Key == environment &&
                    ffe.Environment.Project.Key == projectKey &&
                    !ffe.FeatureFlag.IsArchived &&
                    ffe.Environment.IsActive &&
                    ffe.Environment.Project.IsActive);

            if (featureFlagEnv == null)
            {
                throw new InvalidOperationException("Feature flag não encontrada");
            }

            var response = new FeatureFlagEvaluationResponse
            {
                Key = featureFlagEnv.FeatureFlag.Key,
                Enabled = featureFlagEnv.IsEnabled,
                Value = ParseValue(featureFlagEnv.DefaultValue, featureFlagEnv.FeatureFlag.Type),
                Metadata = new Dictionary<string, object>
                {
                    ["type"] = featureFlagEnv.FeatureFlag.Type.ToString(),
                    ["environment"] = featureFlagEnv.Environment.Key,
                    ["updatedAt"] = featureFlagEnv.UpdatedAt
                }
            };

            // Record evaluation metric
            await RecordFeatureFlagEvaluationAsync(featureFlagEnv.FeatureFlagId, featureFlagEnv.EnvironmentId, response.Enabled);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating feature flag {FlagKey} in {ProjectKey}/{Environment}", flagKey, projectKey, environment);
            throw;
        }
    }

    public async Task<Dictionary<string, FeatureFlagEvaluationResponse>> EvaluateAllFeatureFlagsAsync(string projectKey, string environment, FeatureFlagEvaluationRequest request)
    {
        try
        {
            var featureFlagEnvs = await _context.FeatureFlagEnvironments
                .Include(ffe => ffe.FeatureFlag)
                .Include(ffe => ffe.Environment)
                    .ThenInclude(e => e.Project)
                .Include(ffe => ffe.ActivationStrategies.Where(s => s.IsEnabled))
                .Where(ffe => 
                    ffe.Environment.Key == environment &&
                    ffe.Environment.Project.Key == projectKey &&
                    !ffe.FeatureFlag.IsArchived &&
                    ffe.Environment.IsActive &&
                    ffe.Environment.Project.IsActive)
                .ToListAsync();

            var evaluations = new Dictionary<string, FeatureFlagEvaluationResponse>();

            foreach (var featureFlagEnv in featureFlagEnvs)
            {
                var response = new FeatureFlagEvaluationResponse
                {
                    Key = featureFlagEnv.FeatureFlag.Key,
                    Enabled = featureFlagEnv.IsEnabled,
                    Value = ParseValue(featureFlagEnv.DefaultValue, featureFlagEnv.FeatureFlag.Type),
                    Metadata = new Dictionary<string, object>
                    {
                        ["type"] = featureFlagEnv.FeatureFlag.Type.ToString(),
                        ["environment"] = featureFlagEnv.Environment.Key,
                        ["updatedAt"] = featureFlagEnv.UpdatedAt
                    }
                };

                evaluations[featureFlagEnv.FeatureFlag.Key] = response;

                // Record evaluation metric
                await RecordFeatureFlagEvaluationAsync(featureFlagEnv.FeatureFlagId, featureFlagEnv.EnvironmentId, response.Enabled);
            }

            return evaluations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating all feature flags in {ProjectKey}/{Environment}", projectKey, environment);
            throw;
        }
    }

    public async Task RecordFeatureFlagEvaluationAsync(int flagId, int environmentId, bool enabled, double? responseTime = null)
    {
        try
        {
            var featureFlagEnvId = await _context.FeatureFlagEnvironments
                .Where(ffe => ffe.FeatureFlagId == flagId && ffe.EnvironmentId == environmentId)
                .Select(ffe => ffe.Id)
                .FirstOrDefaultAsync();

            if (featureFlagEnvId == 0)
                return;

            var today = DateTime.UtcNow.Date;
            var metric = await _context.FeatureFlagMetrics
                .FirstOrDefaultAsync(m => 
                    m.FeatureFlagEnvironmentId == featureFlagEnvId &&
                    m.Timestamp.Date == today);

            if (metric == null)
            {
                metric = new FeatureFlagMetric
                {
                    FeatureFlagEnvironmentId = featureFlagEnvId,
                    Timestamp = today,
                    Evaluations = 0,
                    EnabledCount = 0,
                    DisabledCount = 0
                };
                _context.FeatureFlagMetrics.Add(metric);
            }

            metric.Evaluations++;
            if (enabled)
                metric.EnabledCount++;
            else
                metric.DisabledCount++;

            if (responseTime.HasValue)
            {
                metric.AverageResponseTime = metric.AverageResponseTime.HasValue
                    ? (metric.AverageResponseTime.Value + responseTime.Value) / 2
                    : responseTime.Value;
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording feature flag evaluation metric");
        }
    }

    public async Task<object> GetFeatureFlagAnalyticsAsync(int flagId, int environmentId, DateTime? from = null, DateTime? to = null)
    {
        try
        {
            var featureFlagEnvId = await _context.FeatureFlagEnvironments
                .Where(ffe => ffe.FeatureFlagId == flagId && ffe.EnvironmentId == environmentId)
                .Select(ffe => ffe.Id)
                .FirstOrDefaultAsync();

            if (featureFlagEnvId == 0)
                return new { message = "Feature flag não encontrada neste ambiente" };

            var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
            var toDate = to ?? DateTime.UtcNow;

            var metrics = await _context.FeatureFlagMetrics
                .Where(m => 
                    m.FeatureFlagEnvironmentId == featureFlagEnvId &&
                    m.Timestamp >= fromDate &&
                    m.Timestamp <= toDate)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var totalEvaluations = metrics.Sum(m => m.Evaluations);
            var totalEnabled = metrics.Sum(m => m.EnabledCount);
            var totalDisabled = metrics.Sum(m => m.DisabledCount);
            var averageResponseTime = metrics.Where(m => m.AverageResponseTime.HasValue)
                .Average(m => m.AverageResponseTime);

            return new
            {
                totalEvaluations,
                totalEnabled,
                totalDisabled,
                enabledPercentage = totalEvaluations > 0 ? (double)totalEnabled / totalEvaluations * 100 : 0,
                averageResponseTime,
                dailyMetrics = metrics.Select(m => new
                {
                    date = m.Timestamp,
                    evaluations = m.Evaluations,
                    enabledCount = m.EnabledCount,
                    disabledCount = m.DisabledCount,
                    averageResponseTime = m.AverageResponseTime
                })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flag analytics for flag {FlagId} in environment {EnvironmentId}", flagId, environmentId);
            throw;
        }
    }

    private static string GetDefaultValueForType(FeatureFlagType type)
    {
        return type switch
        {
            FeatureFlagType.Boolean => "false",
            FeatureFlagType.String => "",
            FeatureFlagType.Number => "0",
            FeatureFlagType.Json => "{}",
            _ => "false"
        };
    }

    private static object? ParseValue(string? value, FeatureFlagType type)
    {
        if (string.IsNullOrEmpty(value))
            return null;

        try
        {
            return type switch
            {
                FeatureFlagType.Boolean => bool.Parse(value),
                FeatureFlagType.Number => double.Parse(value),
                FeatureFlagType.Json => System.Text.Json.JsonSerializer.Deserialize<object>(value),
                _ => value
            };
        }
        catch
        {
            return value;
        }
    }
}
