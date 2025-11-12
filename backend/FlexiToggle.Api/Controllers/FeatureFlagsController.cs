using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/[controller]")]
[Authorize]
public class FeatureFlagsController : ControllerBase
{
    private readonly FlexiToggleContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<FeatureFlagsController> _logger;

    public FeatureFlagsController(
        FlexiToggleContext context,
        IMapper mapper,
        ILogger<FeatureFlagsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Obter todas as feature flags do projeto
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FeatureFlagDto>>> GetFeatureFlags(int projectId, [FromQuery] bool includeArchived = false)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if user has access to project
            var hasAccess = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

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
                .Where(ff => ff.ProjectId == projectId);

            if (!includeArchived)
            {
                query = query.Where(ff => !ff.IsArchived);
            }

            var featureFlags = await query
                .OrderBy(ff => ff.Name)
                .ToListAsync();

            var featureFlagDtos = _mapper.Map<List<FeatureFlagDto>>(featureFlags);
            return Ok(featureFlagDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flags for project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter feature flag por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FeatureFlagDto>> GetFeatureFlag(int projectId, int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if user has access to project
            var hasAccess = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

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
                .FirstOrDefaultAsync(ff => ff.Id == id && ff.ProjectId == projectId);

            if (featureFlag == null)
            {
                return NotFound(new { message = "Feature flag não encontrada" });
            }

            var featureFlagDto = _mapper.Map<FeatureFlagDto>(featureFlag);
            return Ok(featureFlagDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature flag {FeatureFlagId} for project {ProjectId}", id, projectId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Criar nova feature flag
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FeatureFlagDto>> CreateFeatureFlag(int projectId, [FromBody] CreateFeatureFlagRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if user has permission to create feature flags
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            if (membership.Role == ProjectRole.Viewer)
            {
                return StatusCode(403, new { message = "Você não tem permissão para criar feature flags" });
            }

            // Check if feature flag key already exists in project
            var existingFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.ProjectId == projectId && ff.Key == request.Key);

            if (existingFlag != null)
            {
                return BadRequest(new { message = "Já existe uma feature flag com esta chave neste projeto" });
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

            var featureFlagDto = _mapper.Map<FeatureFlagDto>(createdFeatureFlag);
            return CreatedAtAction(nameof(GetFeatureFlag), new { projectId, id = featureFlag.Id }, featureFlagDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feature flag in project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Atualizar feature flag
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FeatureFlagDto>> UpdateFeatureFlag(int projectId, int id, [FromBody] UpdateFeatureFlagRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check permissions
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            if (membership.Role == ProjectRole.Viewer)
            {
                return StatusCode(403, new { message = "Você não tem permissão para atualizar feature flags" });
            }

            var featureFlag = await _context.FeatureFlags
                .Include(ff => ff.Tags)
                .FirstOrDefaultAsync(ff => ff.Id == id && ff.ProjectId == projectId);

            if (featureFlag == null)
            {
                return NotFound(new { message = "Feature flag não encontrada" });
            }

            if (featureFlag.IsArchived)
            {
                return BadRequest(new { message = "Não é possível atualizar uma feature flag arquivada" });
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
                        .Where(t => t.ProjectId == projectId && request.TagIds.Contains(t.Id))
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

            var featureFlagDto = _mapper.Map<FeatureFlagDto>(updatedFeatureFlag);
            return Ok(featureFlagDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating feature flag {FeatureFlagId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Toggle feature flag em um ambiente
    /// </summary>
    [HttpPost("{id}/environments/{environmentId}/toggle")]
    public async Task<ActionResult<FeatureFlagEnvironmentDto>> ToggleFeatureFlag(
        int projectId, int id, int environmentId, [FromBody] ToggleFeatureFlagRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check permissions
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            if (membership.Role == ProjectRole.Viewer)
            {
                return StatusCode(403, new { message = "Você não tem permissão para alterar feature flags" });
            }

            var featureFlagEnv = await _context.FeatureFlagEnvironments
                .Include(ffe => ffe.FeatureFlag)
                .Include(ffe => ffe.Environment)
                .Include(ffe => ffe.UpdatedBy)
                .Include(ffe => ffe.ActivationStrategies)
                .FirstOrDefaultAsync(ffe => 
                    ffe.FeatureFlagId == id && 
                    ffe.EnvironmentId == environmentId &&
                    ffe.FeatureFlag.ProjectId == projectId);

            if (featureFlagEnv == null)
            {
                return NotFound(new { message = "Feature flag não encontrada neste ambiente" });
            }

            if (featureFlagEnv.FeatureFlag.IsArchived)
            {
                return BadRequest(new { message = "Não é possível alterar uma feature flag arquivada" });
            }

            featureFlagEnv.IsEnabled = request.IsEnabled;
            featureFlagEnv.UpdatedById = userId;
            featureFlagEnv.UpdatedAt = DateTime.UtcNow;

            // Create event
            var toggleEvent = new FeatureFlagEvent
            {
                FeatureFlagId = id,
                Type = request.IsEnabled ? EventType.Enabled : EventType.Disabled,
                Description = request.Reason ?? (request.IsEnabled ? "Feature flag habilitada" : "Feature flag desabilitada"),
                UserId = userId,
                EnvironmentId = environmentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeatureFlagEvents.Add(toggleEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feature flag {FeatureFlagId} {Action} in environment {EnvironmentId} by user {UserId}", 
                id, request.IsEnabled ? "enabled" : "disabled", environmentId, userId);

            var featureFlagEnvDto = _mapper.Map<FeatureFlagEnvironmentDto>(featureFlagEnv);
            return Ok(featureFlagEnvDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling feature flag {FeatureFlagId} in environment {EnvironmentId}", id, environmentId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Arquivar feature flag
    /// </summary>
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> ArchiveFeatureFlag(int projectId, int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check permissions
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            if (membership.Role == ProjectRole.Viewer)
            {
                return StatusCode(403, new { message = "Você não tem permissão para arquivar feature flags" });
            }

            var featureFlag = await _context.FeatureFlags
                .FirstOrDefaultAsync(ff => ff.Id == id && ff.ProjectId == projectId);

            if (featureFlag == null)
            {
                return NotFound(new { message = "Feature flag não encontrada" });
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

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving feature flag {FeatureFlagId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
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
}
