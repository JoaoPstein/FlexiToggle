using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FlexiToggle.Api.Data;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Models;
using AutoMapper;

namespace FlexiToggle.Api.Services;

public class AuthService : IAuthService
{
    private readonly FlexiToggleContext _context;
    private readonly IConfiguration _configuration;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        FlexiToggleContext context,
        IConfiguration configuration,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenciais inválidas");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var userDto = _mapper.Map<UserDto>(user);
        var token = await GenerateJwtTokenAsync(userDto);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new LoginResponse
        {
            Token = token,
            User = userDto,
            ExpiresAt = expiresAt
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Usuário já existe com este email");
        }

        var user = new User
        {
            Email = request.Email,
            Name = request.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Developer,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Email}", user.Email);

        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        return user != null ? _mapper.Map<UserDto>(user) : null;
    }

    public Task<string> GenerateJwtTokenAsync(UserDto user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "your-super-secret-key-that-is-at-least-32-characters-long";
        var issuer = jwtSettings["Issuer"] ?? "FeatureHub";
        var audience = jwtSettings["Audience"] ?? "FeatureHub";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("user_id", user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
    }

    public async Task<bool> ValidateApiKeyAsync(string apiKey, string environment)
    {
        try
        {
            var keyHash = BCrypt.Net.BCrypt.HashPassword(apiKey); // In real implementation, hash the incoming key and compare
            
            var apiKeyEntity = await _context.ApiKeys
                .Include(ak => ak.Environment)
                .FirstOrDefaultAsync(ak => 
                    ak.KeyPrefix == apiKey.Substring(0, Math.Min(8, apiKey.Length)) &&
                    ak.IsActive &&
                    ak.Environment.Key == environment &&
                    (ak.ExpiresAt == null || ak.ExpiresAt > DateTime.UtcNow));

            if (apiKeyEntity != null)
            {
                // Update last used
                apiKeyEntity.LastUsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                
                return BCrypt.Net.BCrypt.Verify(apiKey, apiKeyEntity.KeyHash);
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating API key");
            return false;
        }
    }
}
