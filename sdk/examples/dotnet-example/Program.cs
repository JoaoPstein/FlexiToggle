using FlexiToggle.Sdk;
using FlexiToggle.Sdk.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurar FeatureHub SDK
builder.Services.AddFeatureHub(config =>
{
    config.ApiUrl = builder.Configuration.GetValue<string>("FeatureHub:ApiUrl") ?? "http://localhost:5000";
    config.ProjectKey = builder.Configuration.GetValue<string>("FeatureHub:ProjectKey") ?? "demo-project";
    config.Environment = builder.Configuration.GetValue<string>("FeatureHub:Environment") ?? "production";
    config.UserId = "demo-user-dotnet";
    config.UserAttributes = new Dictionary<string, object>
    {
        ["platform"] = ".NET",
        ["version"] = "8.0",
        ["country"] = "BR"
    };
    config.EnableAnalytics = true;
    config.PollingInterval = TimeSpan.FromSeconds(30);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Endpoints de exemplo usando FeatureHub
app.MapGet("/", () => "FeatureHub .NET SDK Example - Acesse /swagger para ver os endpoints");

app.MapGet("/api/features", async (IFlexiToggleClient featureHub) =>
{
    // Aguardar inicialização se necessário
    var timeout = DateTime.UtcNow.AddSeconds(10);
    while (!featureHub.IsInitialized && DateTime.UtcNow < timeout)
    {
        await Task.Delay(100);
    }

    if (!featureHub.IsInitialized)
    {
        return Results.Problem("FeatureHub não inicializado", statusCode: 503);
    }

    var features = new
    {
        // Flags booleanas
        DarkMode = featureHub.IsEnabled("dark-mode"),
        NewCheckout = featureHub.IsEnabled("new-checkout"),
        PremiumFeatures = featureHub.IsEnabled("premium-features"),
        
        // Configurações
        WelcomeMessage = featureHub.GetString("welcome-message", "Bem-vindo!"),
        Theme = featureHub.GetString("theme", "light"),
        MaxItems = featureHub.GetNumber("max-items", 10),
        DiscountPercent = featureHub.GetDecimal("discount-percent", 0m),
        
        // Configuração JSON
        AppConfig = featureHub.GetJson("app-config", new { timeout = 5000, retries = 3 }),
        
        // Teste A/B
        CheckoutVariant = featureHub.GetVariant("checkout-test", "control"),
        
        Timestamp = DateTime.UtcNow
    };

    return Results.Ok(features);
})
.WithName("GetFeatures")
.WithOpenApi();

app.MapPost("/api/track-event", async (TrackEventRequest request, IFlexiToggleClient featureHub) =>
{
    await featureHub.TrackAsync(request.EventName, request.Properties);
    return Results.Ok(new { message = "Evento registrado com sucesso" });
})
.WithName("TrackEvent")
.WithOpenApi();

app.MapPost("/api/track-conversion", async (TrackConversionRequest request, IFlexiToggleClient featureHub) =>
{
    await featureHub.TrackConversionAsync(request.TestKey, request.MetricName, request.Value);
    return Results.Ok(new { message = "Conversão registrada com sucesso" });
})
.WithName("TrackConversion")
.WithOpenApi();

app.MapPost("/api/update-user", async (UpdateUserRequest request, IFlexiToggleClient featureHub) =>
{
    if (!string.IsNullOrEmpty(request.UserId))
    {
        await featureHub.SetUserIdAsync(request.UserId);
    }
    
    if (request.Attributes?.Any() == true)
    {
        await featureHub.UpdateUserAttributesAsync(request.Attributes);
    }
    
    return Results.Ok(new { message = "Usuário atualizado com sucesso" });
})
.WithName("UpdateUser")
.WithOpenApi();

app.MapPost("/api/refresh-flags", async (IFlexiToggleClient featureHub) =>
{
    await featureHub.RefreshAsync();
    return Results.Ok(new { message = "Flags atualizadas com sucesso" });
})
.WithName("RefreshFlags")
.WithOpenApi();

// Middleware de exemplo usando feature flags
app.MapGet("/api/premium/dashboard", (IFlexiToggleClient featureHub) =>
{
    if (!featureHub.IsEnabled("premium-features"))
    {
        return Results.Problem("Recursos premium não disponíveis", statusCode: 403);
    }
    
    return Results.Ok(new
    {
        message = "Bem-vindo ao dashboard premium!",
        features = new[] { "Analytics avançado", "Relatórios customizados", "Suporte prioritário" },
        user = "premium-user"
    });
})
.WithName("PremiumDashboard")
.WithOpenApi();

// Endpoint que demonstra diferentes tipos de flags
app.MapGet("/api/demo/{userId}", async (string userId, IFlexiToggleClient featureHub) =>
{
    // Atualizar usuário para demonstração
    await featureHub.SetUserIdAsync(userId);
    await featureHub.UpdateUserAttributesAsync(new Dictionary<string, object>
    {
        ["demo"] = true,
        ["timestamp"] = DateTime.UtcNow
    });

    // Aguardar um pouco para as flags serem atualizadas
    await Task.Delay(500);

    var demo = new
    {
        UserId = userId,
        Features = new
        {
            // Controle de acesso
            CanAccessBeta = featureHub.IsEnabled("beta-access"),
            CanUseNewUI = featureHub.IsEnabled("new-ui"),
            
            // Configurações dinâmicas
            ApiRateLimit = featureHub.GetNumber("api-rate-limit", 100),
            CacheTimeout = featureHub.GetNumber("cache-timeout", 300),
            
            // Personalização
            BrandColor = featureHub.GetString("brand-color", "#007bff"),
            LogoUrl = featureHub.GetString("logo-url", "/default-logo.png"),
            
            // A/B Testing
            ButtonVariant = featureHub.GetVariant("button-test", "blue"),
            LayoutVariant = featureHub.GetVariant("layout-test", "classic")
        },
        Recommendations = GetRecommendations(featureHub),
        Timestamp = DateTime.UtcNow
    };

    // Trackear visualização da demo
    await featureHub.TrackAsync("demo_viewed", new Dictionary<string, object>
    {
        ["userId"] = userId,
        ["features_enabled"] = demo.Features
    });

    return Results.Ok(demo);
})
.WithName("DemoUser")
.WithOpenApi();

app.Run();

// Função auxiliar para demonstrar lógica baseada em flags
static object GetRecommendations(IFlexiToggleClient featureHub)
{
    var recommendations = new List<string>();
    
    if (featureHub.IsEnabled("ai-recommendations"))
    {
        recommendations.Add("Produto recomendado por IA: Smartphone XYZ");
        recommendations.Add("Baseado no seu histórico: Fone Bluetooth ABC");
    }
    else
    {
        recommendations.Add("Produto em destaque: Notebook DEF");
        recommendations.Add("Oferta especial: Mouse GHI");
    }
    
    var maxRecommendations = featureHub.GetNumber("max-recommendations", 2);
    return recommendations.Take(maxRecommendations).ToArray();
}

// DTOs para os endpoints
public record TrackEventRequest(string EventName, Dictionary<string, object>? Properties = null);
public record TrackConversionRequest(string TestKey, string MetricName, decimal Value = 1m);
public record UpdateUserRequest(string? UserId = null, Dictionary<string, object>? Attributes = null);
