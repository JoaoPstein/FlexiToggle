using System.ComponentModel.DataAnnotations;

namespace FlexiToggle.Api.Models;

public class Project
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Key { get; set; } = string.Empty; // Unique identifier for API calls
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;
    
    // Navigation properties
    public virtual ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public virtual ICollection<Environment> Environments { get; set; } = new List<Environment>();
    public virtual ICollection<FeatureFlag> FeatureFlags { get; set; } = new List<FeatureFlag>();
}

public class ProjectMember
{
    public int Id { get; set; }
    
    public int ProjectId { get; set; }
    public virtual Project Project { get; set; } = null!;
    
    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;
    
    public ProjectRole Role { get; set; } = ProjectRole.Developer;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public enum ProjectRole
{
    Owner = 0,
    Admin = 1,
    Developer = 2,
    Viewer = 3
}
