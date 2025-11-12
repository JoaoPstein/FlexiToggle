using Microsoft.EntityFrameworkCore;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.Data;

public class FlexiToggleContext : DbContext
{
    public FlexiToggleContext(DbContextOptions<FlexiToggleContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }
    public DbSet<Models.Environment> Environments { get; set; }
    public DbSet<ApiKey> ApiKeys { get; set; }
    public DbSet<FeatureFlag> FeatureFlags { get; set; }
    public DbSet<FeatureFlagEnvironment> FeatureFlagEnvironments { get; set; }
    public DbSet<ActivationStrategy> ActivationStrategies { get; set; }
    public DbSet<FeatureFlagEvent> FeatureFlagEvents { get; set; }
    public DbSet<FeatureFlagMetric> FeatureFlagMetrics { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<FeatureFlagTag> FeatureFlagTags { get; set; }
    public DbSet<Webhook> Webhooks { get; set; }
    public DbSet<WebhookDelivery> WebhookDeliveries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProjectMember configuration
        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.ProjectMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Environment configuration
        modelBuilder.Entity<Models.Environment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProjectId, e.Key }).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(20);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Environments)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ApiKey configuration
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.KeyHash).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.KeyPrefix).HasMaxLength(8);
            
            entity.HasOne(e => e.Environment)
                .WithMany(env => env.ApiKeys)
                .HasForeignKey(e => e.EnvironmentId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // FeatureFlag configuration
        modelBuilder.Entity<FeatureFlag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProjectId, e.Key }).IsUnique();
            entity.Property(e => e.Key).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.FeatureFlags)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // FeatureFlagEnvironment configuration
        modelBuilder.Entity<FeatureFlagEnvironment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.FeatureFlagId, e.EnvironmentId }).IsUnique();
            
            entity.HasOne(e => e.FeatureFlag)
                .WithMany(ff => ff.Environments)
                .HasForeignKey(e => e.FeatureFlagId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Environment)
                .WithMany(env => env.FeatureFlags)
                .HasForeignKey(e => e.EnvironmentId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.UpdatedBy)
                .WithMany()
                .HasForeignKey(e => e.UpdatedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ActivationStrategy configuration
        modelBuilder.Entity<ActivationStrategy>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50);
            
            entity.HasOne(e => e.FeatureFlagEnvironment)
                .WithMany(ffe => ffe.ActivationStrategies)
                .HasForeignKey(e => e.FeatureFlagEnvironmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FeatureFlagEvent configuration
        modelBuilder.Entity<FeatureFlagEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).HasMaxLength(200);
            
            entity.HasOne(e => e.FeatureFlag)
                .WithMany(ff => ff.Events)
                .HasForeignKey(e => e.FeatureFlagId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.Events)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Environment)
                .WithMany()
                .HasForeignKey(e => e.EnvironmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // FeatureFlagMetric configuration
        modelBuilder.Entity<FeatureFlagMetric>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.FeatureFlagEnvironmentId, e.Timestamp });
            
            entity.HasOne(e => e.FeatureFlagEnvironment)
                .WithMany(ffe => ffe.Metrics)
                .HasForeignKey(e => e.FeatureFlagEnvironmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Tag configuration
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProjectId, e.Name }).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(7);
            
            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FeatureFlagTag configuration (Many-to-Many)
        modelBuilder.Entity<FeatureFlagTag>(entity =>
        {
            entity.HasKey(e => new { e.FeatureFlagId, e.TagId });
            
            entity.HasOne(e => e.FeatureFlag)
                .WithMany(ff => ff.Tags)
                .HasForeignKey(e => e.FeatureFlagId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Tag)
                .WithMany(t => t.FeatureFlags)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Webhook configuration
        modelBuilder.Entity<Webhook>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Url).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Secret).HasMaxLength(100);
            
            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WebhookDelivery configuration
        modelBuilder.Entity<WebhookDelivery>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).HasMaxLength(50);
            
            entity.HasOne(e => e.Webhook)
                .WithMany()
                .HasForeignKey(e => e.WebhookId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed data
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed admin user
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Email = "admin@featurehub.com",
                Name = "Admin User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("FeatureHub123!"),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            }
        );

        // Seed default project
        modelBuilder.Entity<Project>().HasData(
            new Project
            {
                Id = 1,
                Name = "Demo Project",
                Description = "Projeto de demonstração do FeatureHub",
                Key = "demo",
                CreatedById = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        // Seed project membership
        modelBuilder.Entity<ProjectMember>().HasData(
            new ProjectMember
            {
                Id = 1,
                ProjectId = 1,
                UserId = 1,
                Role = ProjectRole.Owner,
                JoinedAt = DateTime.UtcNow
            }
        );

        // Seed environments
        modelBuilder.Entity<Models.Environment>().HasData(
            new Models.Environment
            {
                Id = 1,
                Name = "Development",
                Key = "development",
                Description = "Ambiente de desenvolvimento",
                ProjectId = 1,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            },
            new Models.Environment
            {
                Id = 2,
                Name = "Staging",
                Key = "staging",
                Description = "Ambiente de homologação",
                ProjectId = 1,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            },
            new Models.Environment
            {
                Id = 3,
                Name = "Production",
                Key = "production",
                Description = "Ambiente de produção",
                ProjectId = 1,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow
            }
        );


        // Seed feature flags
        modelBuilder.Entity<FeatureFlag>().HasData(
            new FeatureFlag
            {
                Id = 10,
                Name = "Nova Interface",
                Key = "new_ui",
                Description = "Ativar nova interface do usuário",
                Type = FeatureFlagType.Boolean,
                ProjectId = 1,
                CreatedById = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlag
            {
                Id = 11,
                Name = "Sistema de Pagamento",
                Key = "payment_system",
                Description = "Habilitar novo sistema de pagamento",
                Type = FeatureFlagType.Boolean,
                ProjectId = 1,
                CreatedById = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlag
            {
                Id = 12,
                Name = "Limite de Upload",
                Key = "upload_limit",
                Description = "Limite de tamanho para upload de arquivos",
                Type = FeatureFlagType.Number,
                ProjectId = 1,
                CreatedById = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        // Seed feature flag environments
        modelBuilder.Entity<FeatureFlagEnvironment>().HasData(
            // Nova Interface
            new FeatureFlagEnvironment
            {
                Id = 10,
                FeatureFlagId = 10,
                EnvironmentId = 1, // Development
                IsEnabled = true,
                DefaultValue = "true",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 11,
                FeatureFlagId = 10,
                EnvironmentId = 2, // Staging
                IsEnabled = true,
                DefaultValue = "true",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 12,
                FeatureFlagId = 10,
                EnvironmentId = 3, // Production
                IsEnabled = false,
                DefaultValue = "false",
                UpdatedAt = DateTime.UtcNow
            },
            // Sistema de Pagamento
            new FeatureFlagEnvironment
            {
                Id = 13,
                FeatureFlagId = 11,
                EnvironmentId = 1, // Development
                IsEnabled = true,
                DefaultValue = "true",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 14,
                FeatureFlagId = 11,
                EnvironmentId = 2, // Staging
                IsEnabled = false,
                DefaultValue = "false",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 15,
                FeatureFlagId = 11,
                EnvironmentId = 3, // Production
                IsEnabled = false,
                DefaultValue = "false",
                UpdatedAt = DateTime.UtcNow
            },
            // Limite de Upload
            new FeatureFlagEnvironment
            {
                Id = 16,
                FeatureFlagId = 12,
                EnvironmentId = 1, // Development
                IsEnabled = true,
                DefaultValue = "100",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 17,
                FeatureFlagId = 12,
                EnvironmentId = 2, // Staging
                IsEnabled = true,
                DefaultValue = "50",
                UpdatedAt = DateTime.UtcNow
            },
            new FeatureFlagEnvironment
            {
                Id = 18,
                FeatureFlagId = 12,
                EnvironmentId = 3, // Production
                IsEnabled = true,
                DefaultValue = "25",
                UpdatedAt = DateTime.UtcNow
            }
        );

        // Seed tags
        modelBuilder.Entity<Tag>().HasData(
            new Tag
            {
                Id = 10,
                Name = "frontend",
                Color = "#3b82f6",
                ProjectId = 1,
                CreatedAt = DateTime.UtcNow
            },
            new Tag
            {
                Id = 11,
                Name = "backend",
                Color = "#10b981",
                ProjectId = 1,
                CreatedAt = DateTime.UtcNow
            },
            new Tag
            {
                Id = 12,
                Name = "experimental",
                Color = "#f59e0b",
                ProjectId = 1,
                CreatedAt = DateTime.UtcNow
            }
        );

        // Seed feature flag tags
        modelBuilder.Entity<FeatureFlagTag>().HasData(
            new FeatureFlagTag { FeatureFlagId = 10, TagId = 10 }, // Nova Interface -> frontend
            new FeatureFlagTag { FeatureFlagId = 11, TagId = 11 }, // Sistema Pagamento -> backend
            new FeatureFlagTag { FeatureFlagId = 12, TagId = 12 }  // Limite Upload -> experimental
        );
    }
}
