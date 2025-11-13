using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.DTOs;
using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Controllers;

[ApiController]
[Route("api/evaluation")]
public class EvaluationController : ControllerBase
{
    private readonly FlexiToggleContext _context;
    private readonly ILogger<EvaluationController> _logger;

    public EvaluationController(FlexiToggleContext context, ILogger<EvaluationController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("flags")]
    public async Task<ActionResult<EvaluationResponse>> EvaluateFlags([FromBody] EvaluationRequest request)
    {
        try
        {
            _logger.LogInformation("Evaluating flags for project: {ProjectKey}, environment: {Environment}", 
                request.ProjectKey, request.Environment);

            // Find project by key
            var project = await _context.Projects
                .Include(p => p.Environments)
                    .ThenInclude(e => e.FeatureFlags)
                        .ThenInclude(ff => ff.FeatureFlag)
                .FirstOrDefaultAsync(p => p.Key == request.ProjectKey && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            // Find environment
            var environment = project.Environments
                .FirstOrDefault(e => e.Name.Equals(request.Environment, StringComparison.OrdinalIgnoreCase));

            if (environment == null)
            {
                return NotFound(new { message = "Ambiente não encontrado" });
            }

            // Evaluate all flags for this environment
            var flags = new Dictionary<string, object>();
            
            foreach (var envFlag in environment.FeatureFlags)
            {
                var flag = envFlag.FeatureFlag;
                var value = EvaluateFlag(flag, envFlag, request);
                flags[flag.Key] = value;
            }

            var response = new EvaluationResponse
            {
                ProjectKey = request.ProjectKey,
                Environment = request.Environment,
                UserId = request.UserId,
                SessionId = request.SessionId,
                Flags = flags,
                EvaluatedAt = DateTime.UtcNow
            };

            // Log evaluation for analytics (in a real scenario, you'd queue this)
            await LogEvaluation(request, flags);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating flags for project {ProjectKey}", request.ProjectKey);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    [HttpPost("flag/{flagKey}")]
    public async Task<ActionResult<FlagEvaluationResponse>> EvaluateFlag(
        string flagKey, 
        [FromBody] EvaluationRequest request)
    {
        try
        {
            // Find project and flag
            var project = await _context.Projects
                .Include(p => p.Environments)
                    .ThenInclude(e => e.FeatureFlags)
                        .ThenInclude(ff => ff.FeatureFlag)
                .FirstOrDefaultAsync(p => p.Key == request.ProjectKey && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            var environment = project.Environments
                .FirstOrDefault(e => e.Name.Equals(request.Environment, StringComparison.OrdinalIgnoreCase));

            if (environment == null)
            {
                return NotFound(new { message = "Ambiente não encontrado" });
            }

            var envFlag = environment.FeatureFlags
                .FirstOrDefault(ef => ef.FeatureFlag.Key == flagKey);

            if (envFlag == null)
            {
                return NotFound(new { message = "Feature flag não encontrada" });
            }

            var value = EvaluateFlag(envFlag.FeatureFlag, envFlag, request);

            var response = new FlagEvaluationResponse
            {
                FlagKey = flagKey,
                Value = value,
                Type = envFlag.FeatureFlag.Type.ToString(),
                EvaluatedAt = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating flag {FlagKey} for project {ProjectKey}", 
                flagKey, request.ProjectKey);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    [HttpPost("analytics/batch")]
    public async Task<IActionResult> RecordAnalytics([FromBody] AnalyticsRequest request)
    {
        try
        {
            _logger.LogInformation("Recording {Count} analytics events for project {ProjectKey}", 
                request.Events?.Count ?? 0, request.ProjectKey);

            // In a real scenario, you'd store these in a separate analytics database
            // For now, just log them
            foreach (var evt in request.Events ?? new List<AnalyticsEvent>())
            {
                _logger.LogInformation("Analytics Event - Type: {Type}, Data: {Data}", 
                    evt.Type, System.Text.Json.JsonSerializer.Serialize(evt.Data));
            }

            return Ok(new { message = "Analytics recorded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording analytics for project {ProjectKey}", request.ProjectKey);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    private object EvaluateFlag(Models.FeatureFlag flag, Models.FeatureFlagEnvironment envFlag, EvaluationRequest request)
    {
        // Basic evaluation logic - in a real scenario, this would be more sophisticated
        if (!envFlag.IsEnabled)
        {
            return GetDefaultValue(flag.Type);
        }

        // CORREÇÃO CRÍTICA: Para flags boolean, retornar o estado IsEnabled
        // Para outros tipos, usar DefaultValue
        return flag.Type switch
        {
            Models.FeatureFlagType.Boolean => envFlag.IsEnabled, // CORREÇÃO CRÍTICA
            Models.FeatureFlagType.String => envFlag.DefaultValue ?? "",
            Models.FeatureFlagType.Number => int.TryParse(envFlag.DefaultValue, out var num) ? num : 0,
            Models.FeatureFlagType.Json => envFlag.DefaultValue ?? "{}",
            _ => envFlag.IsEnabled
        };
    }

    private object GetDefaultValue(Models.FeatureFlagType type)
    {
        return type switch
        {
            Models.FeatureFlagType.Boolean => false,
            Models.FeatureFlagType.String => "",
            Models.FeatureFlagType.Number => 0,
            Models.FeatureFlagType.Json => new { },
            _ => false
        };
    }

    private async Task LogEvaluation(EvaluationRequest request, Dictionary<string, object> flags)
    {
        // In a real scenario, you'd store evaluation logs for analytics
        // For now, just log to console
        _logger.LogInformation("Evaluation logged - User: {UserId}, Session: {SessionId}, Flags: {FlagCount}", 
            request.UserId, request.SessionId, flags.Count);
        
        await Task.CompletedTask;
    }
}

// DTOs for evaluation
public class EvaluationRequest
{
    [Required]
    public string ProjectKey { get; set; } = string.Empty;
    
    [Required]
    public string Environment { get; set; } = "production";
    
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

public class FlagEvaluationResponse
{
    public string FlagKey { get; set; } = string.Empty;
    public object Value { get; set; } = false;
    public string Type { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; }
}

public class AnalyticsRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public List<AnalyticsEvent> Events { get; set; } = new();
}

public class AnalyticsEvent
{
    public string Type { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
}