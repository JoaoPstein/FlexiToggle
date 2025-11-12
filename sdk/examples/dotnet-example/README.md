# FlexiToggle SDK - Exemplo .NET 8

Este exemplo mostra como integrar o FlexiToggle SDK em uma aplicação .NET 8.

## 🚀 Setup Rápido

### 1. Pré-requisitos

- .NET 8 SDK instalado
- FlexiToggle backend rodando em `http://localhost:5000`
- Um projeto criado no FlexiToggle

### 2. Instalação no seu projeto

```bash
# Adicionar referência ao SDK (quando publicado no NuGet)
dotnet add package FlexiToggle.Sdk

# Ou adicionar referência local para desenvolvimento
dotnet add reference ../../FlexiToggle.Sdk/FlexiToggle.Sdk.csproj
```

### 3. Configuração

#### No `Program.cs`:

```csharp
using FlexiToggle.Sdk.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configurar FlexiToggle SDK
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "http://localhost:5000";
    config.ProjectKey = "seu-projeto-key";  // Substitua pela chave do seu projeto
    config.Environment = "production";
    config.UserId = "user-123";
    config.UserAttributes = new Dictionary<string, object>
    {
        ["plan"] = "premium",
        ["country"] = "BR"
    };
    config.EnableAnalytics = true;
    config.PollingInterval = TimeSpan.FromSeconds(30);
});

var app = builder.Build();
```

#### Ou via `appsettings.json`:

```json
{
  "FlexiToggle": {
    "ApiUrl": "http://localhost:5000",
    "ProjectKey": "seu-projeto-key",
    "Environment": "production",
    "EnableAnalytics": true,
    "PollingInterval": "00:00:30"
  }
}
```

```csharp
// No Program.cs
builder.Services.AddFlexiToggle(builder.Configuration);
```

### 4. Executar o exemplo

```bash
cd sdk/examples/dotnet-example
dotnet run
```

Acesse:
- **API**: http://localhost:5000
- **Swagger**: http://localhost:5000/swagger
- **Features**: http://localhost:5000/api/features

## 📋 Criar Feature Flags no FlexiToggle

Antes de testar, crie estas flags no seu projeto:

### Flags Booleanas:
- `dark-mode` - Modo escuro
- `new-checkout` - Novo checkout
- `premium-features` - Recursos premium
- `beta-access` - Acesso beta
- `new-ui` - Nova interface
- `ai-recommendations` - Recomendações por IA

### Flags de String:
- `welcome-message` - "Bem-vindo ao nosso sistema!"
- `theme` - "dark" ou "light"
- `brand-color` - "#007bff"
- `logo-url` - "/logo.png"

### Flags Numéricas:
- `max-items` - 10
- `discount-percent` - 15
- `api-rate-limit` - 100
- `cache-timeout` - 300
- `max-recommendations` - 5

### Flags JSON:
- `app-config`:
  ```json
  {
    "timeout": 5000,
    "retries": 3,
    "features": ["analytics", "notifications"]
  }
  ```

### Testes A/B:
- `checkout-test`:
  ```json
  {
    "variants": [
      {"name": "control", "weight": 50},
      {"name": "variant_a", "weight": 30},
      {"name": "variant_b", "weight": 20}
    ]
  }
  ```

- `button-test`:
  ```json
  {
    "variants": [
      {"name": "blue", "weight": 40},
      {"name": "green", "weight": 35},
      {"name": "red", "weight": 25}
    ]
  }
  ```

## 🎯 Exemplos de Uso

### 1. Injeção de Dependência

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IFlexiToggleClient _featureHub;

    public ProductsController(IFlexiToggleClient featureHub)
    {
        _featureHub = featureHub;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        // Feature toggle simples
        if (_featureHub.IsEnabled("new-product-api"))
        {
            return Ok(await GetProductsV2());
        }
        
        return Ok(await GetProductsV1());
    }
}
```

### 2. Configuração Dinâmica

```csharp
public class CacheService
{
    private readonly IFlexiToggleClient _featureHub;

    public CacheService(IFlexiToggleClient featureHub)
    {
        _featureHub = featureHub;
    }

    public async Task<T> GetAsync<T>(string key)
    {
        // Timeout configurável via feature flag
        var timeout = _featureHub.GetNumber("cache-timeout", 300);
        
        // Implementação do cache...
    }
}
```

### 3. A/B Testing

```csharp
public class CheckoutService
{
    private readonly IFlexiToggleClient _featureHub;

    public CheckoutService(IFlexiToggleClient featureHub)
    {
        _featureHub = featureHub;
    }

    public async Task<CheckoutResult> ProcessCheckout(Order order)
    {
        var variant = _featureHub.GetVariant("checkout-test", "control");
        
        var result = variant switch
        {
            "variant_a" => await ProcessCheckoutV2(order),
            "variant_b" => await ProcessCheckoutV3(order),
            _ => await ProcessCheckoutV1(order)
        };

        // Trackear conversão se bem-sucedida
        if (result.Success)
        {
            await _featureHub.TrackConversionAsync("checkout-test", "purchase", order.Total);
        }

        return result;
    }
}
```

### 4. Middleware Personalizado

```csharp
public class FeatureFlagMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IFlexiToggleClient _featureHub;

    public FeatureFlagMiddleware(RequestDelegate next, IFlexiToggleClient featureHub)
    {
        _next = next;
        _featureHub = featureHub;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Bloquear acesso a recursos beta
        if (context.Request.Path.StartsWithSegments("/beta") && 
            !_featureHub.IsEnabled("beta-access"))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Acesso negado");
            return;
        }

        await _next(context);
    }
}

// Registrar no Program.cs
app.UseMiddleware<FeatureFlagMiddleware>();
```

### 5. Background Service

```csharp
public class AnalyticsService : BackgroundService
{
    private readonly IFlexiToggleClient _featureHub;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(IFlexiToggleClient featureHub, ILogger<AnalyticsService> logger)
    {
        _featureHub = featureHub;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_featureHub.IsEnabled("background-analytics"))
            {
                await ProcessAnalytics();
            }

            var interval = _featureHub.GetNumber("analytics-interval", 60);
            await Task.Delay(TimeSpan.FromSeconds(interval), stoppingToken);
        }
    }
}
```

## 🔧 API Endpoints do Exemplo

### GET `/api/features`
Retorna todas as feature flags avaliadas.

### POST `/api/track-event`
Registra um evento customizado.
```json
{
  "eventName": "button_click",
  "properties": {
    "button": "cta",
    "page": "home"
  }
}
```

### POST `/api/track-conversion`
Registra uma conversão para teste A/B.
```json
{
  "testKey": "checkout-test",
  "metricName": "purchase",
  "value": 99.99
}
```

### POST `/api/update-user`
Atualiza informações do usuário.
```json
{
  "userId": "user-456",
  "attributes": {
    "plan": "premium",
    "country": "BR"
  }
}
```

### GET `/api/demo/{userId}`
Demonstração completa com diferentes tipos de flags.

## 🎛️ Configurações Avançadas

### Configuração Completa

```csharp
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "http://localhost:5000";
    config.ProjectKey = "meu-projeto";
    config.Environment = "production";
    config.UserId = "user-123";
    config.SessionId = Guid.NewGuid().ToString();
    config.UserAttributes = new Dictionary<string, object>
    {
        ["email"] = "user@example.com",
        ["plan"] = "premium",
        ["country"] = "BR",
        ["signupDate"] = DateTime.UtcNow.AddDays(-30)
    };
    config.EnableAnalytics = true;
    config.PollingInterval = TimeSpan.FromSeconds(30);
    config.HttpTimeout = TimeSpan.FromSeconds(10);
});
```

### Eventos do SDK

```csharp
public class FlexiToggleService : IHostedService
{
    private readonly IFlexiToggleClient _featureHub;
    private readonly ILogger<FlexiToggleService> _logger;

    public FlexiToggleService(IFlexiToggleClient featureHub, ILogger<FlexiToggleService> logger)
    {
        _featureHub = featureHub;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _featureHub.Ready += (sender, args) =>
        {
            _logger.LogInformation("FlexiToggle SDK está pronto!");
        };

        _featureHub.FlagsUpdated += (sender, flags) =>
        {
            _logger.LogInformation("Flags atualizadas: {FlagCount}", flags.Count);
        };

        _featureHub.Error += (sender, error) =>
        {
            _logger.LogError(error, "Erro no FlexiToggle SDK");
        };

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
```

## 🚨 Troubleshooting

### Problema: SDK não inicializa
```csharp
// Verificar se está inicializado
if (!featureHub.IsInitialized)
{
    // Aguardar inicialização
    var timeout = DateTime.UtcNow.AddSeconds(10);
    while (!featureHub.IsInitialized && DateTime.UtcNow < timeout)
    {
        await Task.Delay(100);
    }
}
```

### Problema: Flags sempre retornam valor padrão
- Verifique se `ProjectKey` está correto
- Confirme se as flags existem no ambiente
- Verifique os logs do SDK

### Problema: Analytics não funcionam
- Confirme `EnableAnalytics = true`
- Verifique se o endpoint `/api/evaluation/analytics/batch` existe
- Verifique os logs do backend

## 📚 Integração no Seu Projeto

### 1. Copie o SDK para seu projeto
```bash
# Copie a pasta FlexiToggle.Sdk para sua solution
cp -r sdk/dotnet/FlexiToggle.Sdk ./src/
```

### 2. Adicione a referência
```xml
<ProjectReference Include="../FlexiToggle.Sdk/FlexiToggle.Sdk.csproj" />
```

### 3. Configure no seu `Program.cs`
```csharp
builder.Services.AddFlexiToggle(builder.Configuration);
```

### 4. Use em seus controllers/services
```csharp
public class MyController : ControllerBase
{
    private readonly IFlexiToggleClient _featureHub;

    public MyController(IFlexiToggleClient featureHub)
    {
        _featureHub = featureHub;
    }

    [HttpGet]
    public IActionResult Get()
    {
        if (_featureHub.IsEnabled("my-feature"))
        {
            // Nova funcionalidade
        }
        
        return Ok();
    }
}
```

## 🎉 Pronto!

Agora você pode usar feature flags em toda sua aplicação .NET! 🚀
