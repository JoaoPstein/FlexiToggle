using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Models;
using System.Security.Claims;

namespace FlexiToggle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly FlexiToggleContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        FlexiToggleContext context,
        IMapper mapper,
        ILogger<ProjectsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Obter todos os projetos do usuário
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects()
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var projects = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .Include(p => p.Environments)
                    .ThenInclude(e => e.ApiKeys)
                        .ThenInclude(ak => ak.CreatedBy)
                .Include(p => p.FeatureFlags)
                .Where(p => p.Members.Any(m => m.UserId == userId) && p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            var projectDtos = _mapper.Map<List<ProjectDto>>(projects);
            return Ok(projectDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects for user");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter projeto por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .Include(p => p.Environments)
                    .ThenInclude(e => e.ApiKeys)
                        .ThenInclude(ak => ak.CreatedBy)
                .Include(p => p.FeatureFlags)
                .FirstOrDefaultAsync(p => p.Id == id && 
                    p.Members.Any(m => m.UserId == userId) && 
                    p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            var projectDto = _mapper.Map<ProjectDto>(project);
            return Ok(projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project {ProjectId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Criar novo projeto
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if project key already exists
            var existingProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.Key == request.Key);

            if (existingProject != null)
            {
                return BadRequest(new { message = "Já existe um projeto com esta chave" });
            }

            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                Key = request.Key,
                CreatedById = userId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Add creator as owner
            var membership = new ProjectMember
            {
                ProjectId = project.Id,
                UserId = userId,
                Role = ProjectRole.Owner,
                JoinedAt = DateTime.UtcNow
            };

            _context.ProjectMembers.Add(membership);

            // Create default environments
            var environments = new[]
            {
                new Models.Environment
                {
                    Name = "Development",
                    Key = "development",
                    Description = "Ambiente de desenvolvimento",
                    ProjectId = project.Id,
                    SortOrder = 1
                },
                new Models.Environment
                {
                    Name = "Staging",
                    Key = "staging",
                    Description = "Ambiente de homologação",
                    ProjectId = project.Id,
                    SortOrder = 2
                },
                new Models.Environment
                {
                    Name = "Production",
                    Key = "production",
                    Description = "Ambiente de produção",
                    ProjectId = project.Id,
                    SortOrder = 3
                }
            };

            _context.Environments.AddRange(environments);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Project {ProjectName} created by user {UserId}", project.Name, userId);

            // Reload with includes
            var createdProject = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .Include(p => p.Environments)
                .Include(p => p.FeatureFlags)
                .FirstAsync(p => p.Id == project.Id);

            var projectDto = _mapper.Map<ProjectDto>(createdProject);
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    private static string GenerateProjectKey(string name)
    {
        return name
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-")
            .Replace(".", "-")
            .Replace(",", "")
            .Replace("(", "")
            .Replace(")", "")
            .Replace("[", "")
            .Replace("]", "")
            .Replace("{", "")
            .Replace("}", "")
            .Replace("@", "")
            .Replace("#", "")
            .Replace("$", "")
            .Replace("%", "")
            .Replace("&", "")
            .Replace("*", "")
            .Replace("+", "")
            .Replace("=", "")
            .Replace("?", "")
            .Replace("/", "")
            .Replace("\\", "")
            .Replace("|", "")
            .Replace("<", "")
            .Replace(">", "")
            .Replace(":", "")
            .Replace(";", "")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace("!", "")
            .Replace("~", "")
            .Replace("`", "")
            .Replace("^", "")
            .Trim('-');
    }

    /// <summary>
    /// Atualizar projeto
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            // Check if user has permission to update
            var membership = project.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null || (membership.Role != ProjectRole.Owner && membership.Role != ProjectRole.Admin))
            {
                return StatusCode(403, new { message = "Você não tem permissão para atualizar este projeto" });
            }

            project.Name = request.Name;
            project.Description = request.Description;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Project {ProjectId} updated by user {UserId}", id, userId);

            // Reload with includes
            var updatedProject = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .Include(p => p.Environments)
                .Include(p => p.FeatureFlags)
                .FirstAsync(p => p.Id == id);

            var projectDto = _mapper.Map<ProjectDto>(updatedProject);
            return Ok(projectDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Deletar projeto (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            // Check if user is owner
            var membership = project.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null || membership.Role != ProjectRole.Owner)
            {
                return StatusCode(403, new { message = "Apenas o proprietário pode deletar o projeto" });
            }

            project.IsActive = false;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Project {ProjectId} deleted by user {UserId}", id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter membros do projeto
    /// </summary>
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<ProjectMemberDto>>> GetProjectMembers(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            // Check if user has access to this project
            var membership = project.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            var membersDto = _mapper.Map<List<ProjectMemberDto>>(project.Members);
            return Ok(membersDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter membros do projeto {ProjectId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Adicionar membro ao projeto
    /// </summary>
    [HttpPost("{id}/members")]
    public async Task<ActionResult<ProjectMemberDto>> AddProjectMember(int id, [FromBody] AddProjectMemberRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            // Check if user has permission
            var membership = project.Members.FirstOrDefault(m => m.UserId == userId);
            if (membership == null || (membership.Role != ProjectRole.Owner && membership.Role != ProjectRole.Admin))
            {
                return StatusCode(403, new { message = "Você não tem permissão para adicionar membros" });
            }

            // Find user by email
            var userToAdd = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (userToAdd == null)
            {
                return BadRequest(new { message = "Usuário não encontrado" });
            }

            // Check if user is already a member
            var existingMembership = project.Members.FirstOrDefault(m => m.UserId == userToAdd.Id);
            if (existingMembership != null)
            {
                return BadRequest(new { message = "Usuário já é membro do projeto" });
            }

            var newMembership = new ProjectMember
            {
                ProjectId = id,
                UserId = userToAdd.Id,
                Role = request.Role,
                JoinedAt = DateTime.UtcNow
            };

            _context.ProjectMembers.Add(newMembership);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {NewUserId} added to project {ProjectId} by user {UserId}", userToAdd.Id, id, userId);

            // Reload with user data
            var membershipWithUser = await _context.ProjectMembers
                .Include(m => m.User)
                .FirstAsync(m => m.Id == newMembership.Id);

            var memberDto = _mapper.Map<ProjectMemberDto>(membershipWithUser);
            return Ok(memberDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding member to project {ProjectId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Remover membro do projeto
    /// </summary>
    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveProjectMember(int id, int memberId)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var project = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (project == null)
            {
                return NotFound(new { message = "Projeto não encontrado" });
            }

            var memberToRemove = project.Members.FirstOrDefault(m => m.Id == memberId);
            if (memberToRemove == null)
            {
                return NotFound(new { message = "Membro não encontrado" });
            }

            // Check permissions
            var currentUserMembership = project.Members.FirstOrDefault(m => m.UserId == userId);
            if (currentUserMembership == null)
            {
                return StatusCode(403, new { message = "Você não é membro deste projeto" });
            }

            // Owner can remove anyone, admin can remove developers/viewers, users can remove themselves
            var canRemove = currentUserMembership.Role == ProjectRole.Owner ||
                           (currentUserMembership.Role == ProjectRole.Admin && 
                            memberToRemove.Role != ProjectRole.Owner && memberToRemove.Role != ProjectRole.Admin) ||
                           memberToRemove.UserId == userId;

            if (!canRemove)
            {
                return StatusCode(403, new { message = "Você não tem permissão para remover este membro" });
            }

            // Cannot remove the last owner
            if (memberToRemove.Role == ProjectRole.Owner)
            {
                var ownerCount = project.Members.Count(m => m.Role == ProjectRole.Owner);
                if (ownerCount <= 1)
                {
                    return BadRequest(new { message = "Não é possível remover o último proprietário do projeto" });
                }
            }

            _context.ProjectMembers.Remove(memberToRemove);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Member {MemberId} removed from project {ProjectId} by user {UserId}", memberId, id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing member {MemberId} from project {ProjectId}", memberId, id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter API keys de um ambiente
    /// </summary>
    [HttpGet("{id}/environments/{environmentId}/apikeys")]
    public async Task<ActionResult<List<ApiKeyDto>>> GetEnvironmentApiKeys(int id, int environmentId)
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
                .AnyAsync(pm => pm.ProjectId == id && pm.UserId == userId);

            if (!hasAccess)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            // Verify environment belongs to project
            var environment = await _context.Environments
                .FirstOrDefaultAsync(e => e.Id == environmentId && e.ProjectId == id);

            if (environment == null)
            {
                return NotFound(new { message = "Ambiente não encontrado" });
            }

            var apiKeys = await _context.ApiKeys
                .Include(ak => ak.CreatedBy)
                .Where(ak => ak.EnvironmentId == environmentId)
                .OrderByDescending(ak => ak.CreatedAt)
                .ToListAsync();

            var apiKeyDtos = _mapper.Map<List<ApiKeyDto>>(apiKeys);
            return Ok(apiKeyDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting API keys for environment {EnvironmentId}", environmentId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Criar API key para um ambiente
    /// </summary>
    [HttpPost("{id}/environments/{environmentId}/apikeys")]
    public async Task<ActionResult<CreateApiKeyResponse>> CreateEnvironmentApiKey(
        int id, 
        int environmentId, 
        [FromBody] CreateApiKeyRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if user has permission to create API keys
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);

            if (membership == null)
            {
                return StatusCode(403, new { message = "Você não tem acesso a este projeto" });
            }

            if (membership.Role == ProjectRole.Viewer)
            {
                return StatusCode(403, new { message = "Você não tem permissão para criar API keys" });
            }

            // Verify environment belongs to project
            var environment = await _context.Environments
                .FirstOrDefaultAsync(e => e.Id == environmentId && e.ProjectId == id);

            if (environment == null)
            {
                return NotFound(new { message = "Ambiente não encontrado" });
            }

            // Generate API key
            var keyValue = GenerateApiKey();
            var keyPrefix = keyValue.Substring(0, 8);
            var keyHash = BCrypt.Net.BCrypt.HashPassword(keyValue);

            var apiKey = new ApiKey
            {
                Name = request.Name,
                KeyPrefix = keyPrefix,
                KeyHash = keyHash,
                Type = request.Type,
                EnvironmentId = environmentId,
                CreatedById = userId,
                ExpiresAt = request.ExpiresAt,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ApiKeys.Add(apiKey);
            await _context.SaveChangesAsync();

            _logger.LogInformation("API key {ApiKeyName} created for environment {EnvironmentId} by user {UserId}", 
                request.Name, environmentId, userId);

            // Reload with includes
            var createdApiKey = await _context.ApiKeys
                .Include(ak => ak.CreatedBy)
                .FirstAsync(ak => ak.Id == apiKey.Id);

            var apiKeyDto = _mapper.Map<ApiKeyDto>(createdApiKey);
            
            var response = new CreateApiKeyResponse
            {
                ApiKey = apiKeyDto,
                Key = keyValue // Full key - only shown once
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating API key for environment {EnvironmentId}", environmentId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    private static string GenerateApiKey()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        var keyLength = 64;
        
        return new string(Enumerable.Repeat(chars, keyLength)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
