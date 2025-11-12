using AutoMapper;
using FlexiToggle.Api.DTOs;
using FlexiToggle.Api.Models;

namespace FlexiToggle.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        // Project mappings
        CreateMap<Project, ProjectDto>()
            .ForMember(dest => dest.FeatureFlagsCount, opt => opt.MapFrom(src => src.FeatureFlags.Count));
        
        CreateMap<ProjectMember, ProjectMemberDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        // Environment mappings
        CreateMap<Models.Environment, EnvironmentDto>();

        // ApiKey mappings
        CreateMap<ApiKey, ApiKeyDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()));

        // FeatureFlag mappings
        CreateMap<FeatureFlag, FeatureFlagDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags));

        CreateMap<FeatureFlagEnvironment, FeatureFlagEnvironmentDto>();

        CreateMap<ActivationStrategy, ActivationStrategyDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Parameters, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Parameters) ? null : System.Text.Json.JsonSerializer.Deserialize<object>(src.Parameters, (System.Text.Json.JsonSerializerOptions?)null)))
            .ForMember(dest => dest.Constraints, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Constraints) ? null : System.Text.Json.JsonSerializer.Deserialize<object>(src.Constraints, (System.Text.Json.JsonSerializerOptions?)null)));

        // Tag mappings
        CreateMap<Tag, TagDto>();
        CreateMap<FeatureFlagTag, TagDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Tag.Id))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Tag.Name))
            .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Tag.Color))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Tag.CreatedAt));

        // Create mappings
        CreateMap<CreateProjectRequest, Project>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<CreateFeatureFlagRequest, FeatureFlag>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<CreateEnvironmentRequest, Models.Environment>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<CreateTagRequest, Tag>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        CreateMap<CreateActivationStrategyRequest, ActivationStrategy>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Parameters, opt => opt.MapFrom(src => 
                src.Parameters != null ? System.Text.Json.JsonSerializer.Serialize(src.Parameters, (System.Text.Json.JsonSerializerOptions?)null) : null))
            .ForMember(dest => dest.Constraints, opt => opt.MapFrom(src => 
                src.Constraints != null ? System.Text.Json.JsonSerializer.Serialize(src.Constraints, (System.Text.Json.JsonSerializerOptions?)null) : null));
    }
}
