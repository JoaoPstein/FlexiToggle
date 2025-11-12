using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly FlexiToggleContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(FlexiToggleContext context, ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Obter dashboard analytics do projeto
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<object>> GetProjectDashboard(int projectId, [FromQuery] int days = 30)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check access
            var hasAccess = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            var fromDate = DateTime.UtcNow.AddDays(-days);

            // Get project overview
            var project = await _context.Projects
                .Include(p => p.FeatureFlags)
                .Include(p => p.Environments)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
            {
                return NotFound("Projeto não encontrado");
            }

            // Feature flags stats
            var totalFlags = project.FeatureFlags.Count(ff => !ff.IsArchived);
            var archivedFlags = project.FeatureFlags.Count(ff => ff.IsArchived);
            var flagsByType = project.FeatureFlags
                .Where(ff => !ff.IsArchived)
                .GroupBy(ff => ff.Type)
                .ToDictionary(g => g.Key.ToString(), g => g.Count());

            // Environment stats
            var environmentStats = new List<object>();
            foreach (var env in project.Environments.Where(e => e.IsActive))
            {
                var enabledFlags = await _context.FeatureFlagEnvironments
                    .CountAsync(ffe => ffe.EnvironmentId == env.Id && ffe.IsEnabled);
                
                var totalEnvFlags = await _context.FeatureFlagEnvironments
                    .CountAsync(ffe => ffe.EnvironmentId == env.Id);

                environmentStats.Add(new
                {
                    environment = env.Name,
                    key = env.Key,
                    totalFlags = totalEnvFlags,
                    enabledFlags,
                    disabledFlags = totalEnvFlags - enabledFlags,
                    enabledPercentage = totalEnvFlags > 0 ? Math.Round((double)enabledFlags / totalEnvFlags * 100, 1) : 0
                });
            }

            // Recent activity
            var recentEvents = await _context.FeatureFlagEvents
                .Include(e => e.FeatureFlag)
                .Include(e => e.User)
                .Include(e => e.Environment)
                .Where(e => e.FeatureFlag.ProjectId == projectId && e.CreatedAt >= fromDate)
                .OrderByDescending(e => e.CreatedAt)
                .Take(20)
                .Select(e => new
                {
                    id = e.Id,
                    type = e.Type.ToString(),
                    description = e.Description,
                    featureFlag = e.FeatureFlag.Name,
                    user = e.User != null ? e.User.Name : "Sistema",
                    environment = e.Environment != null ? e.Environment.Name : null,
                    createdAt = e.CreatedAt
                })
                .ToListAsync();

            // Evaluation metrics
            var evaluationMetrics = await _context.FeatureFlagMetrics
                .Include(m => m.FeatureFlagEnvironment)
                    .ThenInclude(ffe => ffe.FeatureFlag)
                .Include(m => m.FeatureFlagEnvironment)
                    .ThenInclude(ffe => ffe.Environment)
                .Where(m => m.FeatureFlagEnvironment.FeatureFlag.ProjectId == projectId && 
                           m.Timestamp >= fromDate)
                .GroupBy(m => m.Timestamp.Date)
                .Select(g => new
                {
                    date = g.Key,
                    totalEvaluations = g.Sum(m => m.Evaluations),
                    enabledEvaluations = g.Sum(m => m.EnabledCount),
                    disabledEvaluations = g.Sum(m => m.DisabledCount)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            // Top feature flags by usage
            var topFeatureFlags = await _context.FeatureFlagMetrics
                .Include(m => m.FeatureFlagEnvironment)
                    .ThenInclude(ffe => ffe.FeatureFlag)
                .Where(m => m.FeatureFlagEnvironment.FeatureFlag.ProjectId == projectId && 
                           m.Timestamp >= fromDate)
                .GroupBy(m => new { m.FeatureFlagEnvironment.FeatureFlag.Id, m.FeatureFlagEnvironment.FeatureFlag.Name })
                .Select(g => new
                {
                    featureFlagId = g.Key.Id,
                    featureFlagName = g.Key.Name,
                    totalEvaluations = g.Sum(m => m.Evaluations),
                    enabledEvaluations = g.Sum(m => m.EnabledCount),
                    disabledEvaluations = g.Sum(m => m.DisabledCount)
                })
                .OrderByDescending(x => x.totalEvaluations)
                .Take(10)
                .ToListAsync();

            var dashboard = new
            {
                project = new
                {
                    id = project.Id,
                    name = project.Name,
                    totalFlags,
                    archivedFlags,
                    flagsByType,
                    environments = environmentStats
                },
                metrics = new
                {
                    evaluationTrend = evaluationMetrics,
                    topFeatureFlags,
                    totalEvaluations = evaluationMetrics.Sum(x => x.totalEvaluations),
                    totalEnabled = evaluationMetrics.Sum(x => x.enabledEvaluations),
                    totalDisabled = evaluationMetrics.Sum(x => x.disabledEvaluations)
                },
                activity = recentEvents,
                period = new
                {
                    days,
                    from = fromDate,
                    to = DateTime.UtcNow
                }
            };

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard analytics for project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter métricas detalhadas de uma feature flag
    /// </summary>
    [HttpGet("feature-flags/{featureFlagId}")]
    public async Task<ActionResult<object>> GetFeatureFlagAnalytics(
        int projectId, 
        int featureFlagId, 
        [FromQuery] int days = 30,
        [FromQuery] int? environmentId = null)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check access
            var hasAccess = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            var fromDate = DateTime.UtcNow.AddDays(-days);

            // Get feature flag
            var featureFlag = await _context.FeatureFlags
                .Include(ff => ff.Environments)
                    .ThenInclude(ffe => ffe.Environment)
                .FirstOrDefaultAsync(ff => ff.Id == featureFlagId && ff.ProjectId == projectId);

            if (featureFlag == null)
            {
                return NotFound("Feature flag não encontrada");
            }

            // Build query for metrics
            var metricsQuery = _context.FeatureFlagMetrics
                .Include(m => m.FeatureFlagEnvironment)
                    .ThenInclude(ffe => ffe.Environment)
                .Where(m => m.FeatureFlagEnvironment.FeatureFlagId == featureFlagId && 
                           m.Timestamp >= fromDate);

            if (environmentId.HasValue)
            {
                metricsQuery = metricsQuery.Where(m => m.FeatureFlagEnvironment.EnvironmentId == environmentId.Value);
            }

            // Daily metrics
            var dailyMetrics = await metricsQuery
                .GroupBy(m => m.Timestamp.Date)
                .Select(g => new
                {
                    date = g.Key,
                    evaluations = g.Sum(m => m.Evaluations),
                    enabled = g.Sum(m => m.EnabledCount),
                    disabled = g.Sum(m => m.DisabledCount),
                    avgResponseTime = g.Average(m => m.AverageResponseTime ?? 0)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            // Environment breakdown
            var environmentMetrics = await metricsQuery
                .GroupBy(m => new { m.FeatureFlagEnvironment.Environment.Id, m.FeatureFlagEnvironment.Environment.Name })
                .Select(g => new
                {
                    environmentId = g.Key.Id,
                    environmentName = g.Key.Name,
                    evaluations = g.Sum(m => m.Evaluations),
                    enabled = g.Sum(m => m.EnabledCount),
                    disabled = g.Sum(m => m.DisabledCount),
                    avgResponseTime = g.Average(m => m.AverageResponseTime ?? 0)
                })
                .ToListAsync();

            // Recent events
            var recentEvents = await _context.FeatureFlagEvents
                .Include(e => e.User)
                .Include(e => e.Environment)
                .Where(e => e.FeatureFlagId == featureFlagId && e.CreatedAt >= fromDate)
                .OrderByDescending(e => e.CreatedAt)
                .Take(50)
                .Select(e => new
                {
                    id = e.Id,
                    type = e.Type.ToString(),
                    description = e.Description,
                    user = e.User != null ? e.User.Name : "Sistema",
                    environment = e.Environment != null ? e.Environment.Name : null,
                    createdAt = e.CreatedAt
                })
                .ToListAsync();

            // Current status per environment
            var currentStatus = featureFlag.Environments.Select(ffe => new
            {
                environmentId = ffe.EnvironmentId,
                environmentName = ffe.Environment.Name,
                isEnabled = ffe.IsEnabled,
                defaultValue = ffe.DefaultValue,
                updatedAt = ffe.UpdatedAt,
                strategiesCount = ffe.ActivationStrategies.Count
            }).ToList();

            var analytics = new
            {
                featureFlag = new
                {
                    id = featureFlag.Id,
                    name = featureFlag.Name,
                    key = featureFlag.Key,
                    type = featureFlag.Type.ToString(),
                    description = featureFlag.Description,
                    createdAt = featureFlag.CreatedAt,
                    isArchived = featureFlag.IsArchived
                },
                metrics = new
                {
                    daily = dailyMetrics,
                    environments = environmentMetrics,
                    totals = new
                    {
                        evaluations = dailyMetrics.Sum(x => x.evaluations),
                        enabled = dailyMetrics.Sum(x => x.enabled),
                        disabled = dailyMetrics.Sum(x => x.disabled),
                        avgResponseTime = dailyMetrics.Any() ? dailyMetrics.Average(x => x.avgResponseTime) : 0
                    }
                },
                currentStatus,
                recentEvents,
                period = new
                {
                    days,
                    from = fromDate,
                    to = DateTime.UtcNow
                }
            };

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flag analytics for {FeatureFlagId}", featureFlagId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter métricas de performance do sistema
    /// </summary>
    [HttpGet("performance")]
    public async Task<ActionResult<object>> GetPerformanceMetrics(int projectId, [FromQuery] int hours = 24)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check access
            var hasAccess = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            var fromDate = DateTime.UtcNow.AddHours(-hours);

            // API Keys usage
            var apiKeyUsage = await _context.ApiKeys
                .Include(ak => ak.Environment)
                .Where(ak => ak.Environment.ProjectId == projectId && 
                            ak.LastUsedAt >= fromDate)
                .GroupBy(ak => new { ak.Environment.Id, ak.Environment.Name })
                .Select(g => new
                {
                    environmentId = g.Key.Id,
                    environmentName = g.Key.Name,
                    activeKeys = g.Count(),
                    lastUsed = g.Max(ak => ak.LastUsedAt)
                })
                .ToListAsync();

            // Response times (simulated for now)
            var responseTimeMetrics = await _context.FeatureFlagMetrics
                .Include(m => m.FeatureFlagEnvironment)
                    .ThenInclude(ffe => ffe.Environment)
                .Where(m => m.FeatureFlagEnvironment.FeatureFlag.ProjectId == projectId && 
                           m.Timestamp >= fromDate.Date)
                .GroupBy(m => m.FeatureFlagEnvironment.Environment.Name)
                .Select(g => new
                {
                    environment = g.Key,
                    avgResponseTime = g.Average(m => m.AverageResponseTime ?? 50), // Default 50ms if null
                    maxResponseTime = g.Max(m => m.AverageResponseTime ?? 50),
                    minResponseTime = g.Min(m => m.AverageResponseTime ?? 50),
                    evaluations = g.Sum(m => m.Evaluations)
                })
                .ToListAsync();

            // Error rates (simulated)
            var errorRates = responseTimeMetrics.Select(rt => new
            {
                environment = rt.environment,
                errorRate = Math.Round(Random.Shared.NextDouble() * 2, 3), // 0-2% error rate
                successRate = Math.Round(100 - (Random.Shared.NextDouble() * 2), 1)
            }).ToList();

            var performance = new
            {
                apiKeys = apiKeyUsage,
                responseTimes = responseTimeMetrics,
                errorRates,
                summary = new
                {
                    totalApiKeys = apiKeyUsage.Sum(x => x.activeKeys),
                    avgResponseTime = responseTimeMetrics.Any() ? Math.Round(responseTimeMetrics.Average(x => x.avgResponseTime), 2) : 0,
                    totalEvaluations = responseTimeMetrics.Sum(x => x.evaluations),
                    avgErrorRate = errorRates.Any() ? Math.Round(errorRates.Average(x => x.errorRate), 3) : 0
                },
                period = new
                {
                    hours,
                    from = fromDate,
                    to = DateTime.UtcNow
                }
            };

            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance metrics for project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
}
