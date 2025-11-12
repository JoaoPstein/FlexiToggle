# FlexiToggle .NET SDK

[![NuGet](https://img.shields.io/nuget/v/FlexiToggle.Sdk.svg)](https://www.nuget.org/packages/FlexiToggle.Sdk/)
[![Downloads](https://img.shields.io/nuget/dt/FlexiToggle.Sdk.svg)](https://www.nuget.org/packages/FlexiToggle.Sdk/)

SDK oficial do FlexiToggle para .NET - Gerencie feature flags, A/B testing e configurações dinâmicas em suas aplicações .NET.

## 🚀 Instalação

```bash
dotnet add package FlexiToggle.Sdk
```

## ⚡ Quick Start

### 1. Configuração no `appsettings.json`

```json
{
  "FlexiToggle": {
    "ApiUrl": "https://api.flexitoggle.com",
    "ProjectKey": "seu-projeto-key",
    "Environment": "production",
    "ApiKey": "sua-api-key",
    "PollingInterval": "00:00:30",
    "HttpTimeout": "00:00:10"
  }
}
```

### 2. Registrar no Container de DI

```csharp
using FlexiToggle.Sdk.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Adicionar FlexiToggle SDK
builder.Services.AddFlexiToggle(builder.Configuration);

var app = builder.Build();
```

### 3. Usar em Controllers/Services

```csharp
using FlexiToggle.Sdk;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IFlexiToggleClient _flexiToggle;

    public ProductsController(IFlexiToggleClient flexiToggle)
    {
        _flexiToggle = flexiToggle;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        // Feature Flag Booleana
        if (await _flexiToggle.IsEnabledAsync("new-product-layout"))
        {
            return Ok(await GetNewProductLayout());
        }

        // Configuração Dinâmica
        var maxProducts = await _flexiToggle.GetNumberAsync("max-products-per-page", 10);
        var products = await GetProducts(maxProducts);

        return Ok(products);
    }
}
```

## 📖 Métodos Disponíveis

### Feature Flags Booleanas

```csharp
// Verificar se uma flag está ativa
bool isEnabled = await client.IsEnabledAsync("feature-name");

// Com valor padrão
bool isEnabled = await client.IsEnabledAsync("feature-name", defaultValue: false);

// Com contexto de usuário
var context = new { UserId = 123, Email = "user@example.com" };
bool isEnabled = await client.IsEnabledAsync("feature-name", context);
```

### Configurações Dinâmicas

```csharp
// String
string value = await client.GetStringAsync("config-name", "default-value");

// Número
double number = await client.GetNumberAsync("max-items", 10);

// JSON/Objeto
var config = await client.GetJsonAsync<MyConfig>("complex-config");
```

### Eventos e Analytics

```csharp
// Registrar evento customizado
await client.TrackEventAsync("button-clicked", new 
{ 
    ButtonId = "checkout",
    UserId = 123 
});

// Registrar conversão
await client.TrackConversionAsync("purchase-completed", new 
{ 
    Amount = 99.99,
    ProductId = "prod-123" 
});
```

## 🔧 Configuração Avançada

### Configuração por Código

```csharp
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "https://api.flexitoggle.com";
    config.ProjectKey = "meu-projeto";
    config.Environment = "production";
    config.ApiKey = "minha-api-key";
    config.PollingInterval = TimeSpan.FromSeconds(30);
    config.HttpTimeout = TimeSpan.FromSeconds(10);
});
```

### Configuração com HttpClient Customizado

```csharp
builder.Services.AddHttpClient<IFlexiToggleClient, FlexiToggleClient>(client =>
{
    client.BaseAddress = new Uri("https://api.flexitoggle.com");
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "MeuApp/1.0");
});
```

### Cache e Performance

```csharp
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "https://api.flexitoggle.com";
    config.ProjectKey = "meu-projeto";
    config.Environment = "production";
    config.ApiKey = "minha-api-key";
    
    // Configurações de performance
    config.PollingInterval = TimeSpan.FromMinutes(1); // Polling a cada minuto
    config.CacheTimeout = TimeSpan.FromMinutes(5);    // Cache por 5 minutos
    config.EnableAnalytics = true;                    // Habilitar analytics
    config.AnalyticsBufferSize = 100;                 // Buffer de 100 eventos
});
```

## 🎯 Targeting e Contexto

### Contexto de Usuário

```csharp
var userContext = new Dictionary<string, object>
{
    ["userId"] = 123,
    ["email"] = "user@example.com",
    ["plan"] = "premium",
    ["country"] = "BR",
    ["age"] = 25
};

bool isEnabled = await client.IsEnabledAsync("premium-feature", userContext);
```

### Contexto de Sessão

```csharp
var sessionContext = new Dictionary<string, object>
{
    ["sessionId"] = Guid.NewGuid().ToString(),
    ["userAgent"] = Request.Headers["User-Agent"].ToString(),
    ["ipAddress"] = HttpContext.Connection.RemoteIpAddress?.ToString(),
    ["referrer"] = Request.Headers["Referer"].ToString()
};

string variant = await client.GetStringAsync("ab-test-variant", "control", sessionContext);
```

## 🧪 A/B Testing

```csharp
// Obter variante do teste A/B
string variant = await client.GetStringAsync("checkout-button-color", "blue");

switch (variant)
{
    case "red":
        return RedCheckoutButton();
    case "green":
        return GreenCheckoutButton();
    default:
        return BlueCheckoutButton();
}

// Registrar conversão para o teste
await client.TrackConversionAsync("checkout-completed", new 
{ 
    Variant = variant,
    Amount = orderTotal 
});
```

## 📊 Monitoramento e Logs

### Logs Estruturados

```csharp
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.SetMinimumLevel(LogLevel.Information);
});
```

### Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddCheck<FlexiToggleHealthCheck>("flexitoggle");

app.MapHealthChecks("/health");
```

## 🔒 Segurança

### Configuração Segura

```csharp
// Usar variáveis de ambiente para informações sensíveis
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = Environment.GetEnvironmentVariable("FLEXITOGGLE_API_URL");
    config.ApiKey = Environment.GetEnvironmentVariable("FLEXITOGGLE_API_KEY");
    config.ProjectKey = Environment.GetEnvironmentVariable("FLEXITOGGLE_PROJECT_KEY");
    config.Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
});
```

## 🚀 Deploy e Produção

### Configuração por Ambiente

**Development:**
```json
{
  "FlexiToggle": {
    "Environment": "development",
    "PollingInterval": "00:00:10",
    "EnableAnalytics": false
  }
}
```

**Production:**
```json
{
  "FlexiToggle": {
    "Environment": "production",
    "PollingInterval": "00:01:00",
    "EnableAnalytics": true,
    "CacheTimeout": "00:05:00"
  }
}
```

## 📝 Exemplos Completos

Veja mais exemplos na pasta [examples](../examples/dotnet-example/) do repositório.

## 🤝 Contribuição

Contribuições são bem-vindas! Veja nosso [guia de contribuição](../../../CONTRIBUTING.md).

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](../../../LICENSE) para detalhes.

## 🔗 Links Úteis

- [Documentação Oficial](https://docs.flexitoggle.com)
- [Dashboard FlexiToggle](https://app.flexitoggle.com)
- [Exemplos no GitHub](https://github.com/flexitoggle/flexitoggle/tree/main/sdk/examples)
- [Suporte](https://github.com/flexitoggle/flexitoggle/issues)
