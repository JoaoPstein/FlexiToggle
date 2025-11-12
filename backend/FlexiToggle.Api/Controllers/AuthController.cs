using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Services;

namespace FlexiToggle.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Realizar login no sistema
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for {Email}: {Message}", request.Email, ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Registrar novo usuário
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _authService.RegisterAsync(request);
            return CreatedAtAction(nameof(GetCurrentUser), new { }, user);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed for {Email}: {Message}", request.Email, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter informações do usuário atual
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token inválido" });
            }

            var user = await _authService.GetCurrentUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Validar token JWT
    /// </summary>
    [HttpPost("validate")]
    [Authorize]
    public IActionResult ValidateToken()
    {
        return Ok(new { valid = true, message = "Token válido" });
    }

    /// <summary>
    /// Teste PascalCase - endpoint para testar serialização
    /// </summary>
    [HttpGet("test-pascalcase")]
    public IActionResult TestPascalCase()
    {
        var testObject = new
        {
            TestProperty = "TestValue",
            AnotherProperty = 123,
            BooleanProperty = true,
            DateProperty = DateTime.UtcNow
        };
        
        return Ok(testObject);
    }
}
