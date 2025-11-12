using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using FlexiToggle.Sdk.Models;

namespace FlexiToggle.Sdk.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adiciona o FlexiToggle SDK ao container de DI
    /// </summary>
    public static IServiceCollection AddFlexiToggle(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddFlexiToggle(configuration.GetSection("FlexiToggle"));
    }

    /// <summary>
    /// Adiciona o FlexiToggle SDK ao container de DI com configuração customizada
    /// </summary>
    public static IServiceCollection AddFlexiToggle(this IServiceCollection services, IConfigurationSection configSection)
    {
        services.Configure<FlexiToggleConfig>(configSection);
        
        services.AddHttpClient<IFlexiToggleClient, FlexiToggleClient>((serviceProvider, client) =>
        {
            var config = configSection.Get<FlexiToggleConfig>() ?? new FlexiToggleConfig();
            client.BaseAddress = new Uri(config.ApiUrl);
            client.Timeout = config.HttpTimeout;
        });

        return services;
    }

    /// <summary>
    /// Adiciona o FlexiToggle SDK ao container de DI com configuração por delegate
    /// </summary>
    public static IServiceCollection AddFlexiToggle(this IServiceCollection services, Action<FlexiToggleConfig> configureOptions)
    {
        services.Configure(configureOptions);
        
        services.AddHttpClient<IFlexiToggleClient, FlexiToggleClient>((serviceProvider, client) =>
        {
            var config = new FlexiToggleConfig();
            configureOptions(config);
            client.BaseAddress = new Uri(config.ApiUrl);
            client.Timeout = config.HttpTimeout;
        });

        return services;
    }
}
