using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Models;

public class User
{
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    public UserRole Role { get; set; } = UserRole.Developer;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastLoginAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public virtual ICollection<FeatureFlagEvent> Events { get; set; } = new List<FeatureFlagEvent>();
}

public enum UserRole
{
    Admin = 0,
    ProjectManager = 1,
    Developer = 2,
    Viewer = 3
}
