using FlexiToggle.Api.DTOs;

namespace FlexiToggle.Api.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserDto> RegisterAsync(RegisterRequest request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<string> GenerateJwtTokenAsync(UserDto user);
    Task<bool> ValidateApiKeyAsync(string apiKey, string environment);
}
