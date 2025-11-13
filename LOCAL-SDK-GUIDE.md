# 🏠 Guia de Uso Local do FlexiToggle SDK

## 🎯 **Opção 1: Referência Direta ao Projeto**

### 1. Criar Novo Projeto de Teste
```bash
# Fora da pasta FlexiToggle
cd /Users/c15303q/RiderProjects/
mkdir MeuAppTeste
cd MeuAppTeste

# Criar projeto console
dotnet new console -n MeuApp.FlexiToggle.Test
cd MeuApp.FlexiToggle.Test
```

### 2. Adicionar Referência Local
```bash
# Referenciar o SDK diretamente
dotnet add reference /Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/FlexiToggle.Sdk.csproj
```

### 3. Exemplo de Uso Completo
```csharp
// Program.cs
using FlexiToggle.Sdk;
using FlexiToggle.Sdk.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

// Configurar FlexiToggle SDK
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "http://localhost:5078";
    config.ProjectKey = "SEU_PROJECT_KEY"; // Pegar do FlexiToggle
    config.Environment = "development";
    config.RefreshInterval = TimeSpan.FromSeconds(30);
});

builder.Services.AddLogging();

var host = builder.Build();

// Usar o SDK
var flexiToggle = host.Services.GetRequiredService<IFlexiToggleClient>();
var logger = host.Services.GetRequiredService<ILogger<Program>>();

try
{
    logger.LogInformation("🚀 Testando FlexiToggle SDK...");
    
    // Inicializar conexão
    await flexiToggle.InitializeAsync();
    logger.LogInformation("✅ SDK inicializado com sucesso!");
    
    // Testar feature flags
    var features = new[]
    {
        "nova-interface",
        "modo-escuro", 
        "analytics-avancado",
        "notificacoes-push"
    };
    
    foreach (var feature in features)
    {
        var isEnabled = await flexiToggle.IsEnabledAsync(feature);
        var status = isEnabled ? "🟢 ATIVA" : "🔴 INATIVA";
        logger.LogInformation($"Feature '{feature}': {status}");
        
        if (isEnabled)
        {
            // Simular uso da feature
            logger.LogInformation($"  → Executando lógica da feature '{feature}'");
        }
    }
    
    // Testar valores dinâmicos
    var maxUsers = await flexiToggle.GetValueAsync<int>("max-usuarios-simultaneos", 100);
    var welcomeMessage = await flexiToggle.GetValueAsync<string>("mensagem-boas-vindas", "Bem-vindo!");
    var config = await flexiToggle.GetValueAsync<object>("configuracao-avancada", new { timeout = 30 });
    
    logger.LogInformation($"📊 Configurações dinâmicas:");
    logger.LogInformation($"  → Max usuários: {maxUsers}");
    logger.LogInformation($"  → Mensagem: {welcomeMessage}");
    logger.LogInformation($"  → Config: {config}");
    
    logger.LogInformation("🎉 Teste concluído com sucesso!");
}
catch (Exception ex)
{
    logger.LogError(ex, "❌ Erro durante o teste");
}

await host.RunAsync();
```

### 4. Configuração (appsettings.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "FlexiToggle": {
    "ApiUrl": "http://localhost:5078",
    "ProjectKey": "meu-projeto-teste",
    "Environment": "development",
    "RefreshInterval": "00:00:30",
    "HttpTimeout": "00:00:10"
  }
}
```

---

## 🏗️ **Opção 2: Pacote NuGet Local**

### 1. Gerar Pacote Local
```bash
cd /Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk
dotnet pack --configuration Release --output ./nupkg
```

### 2. Configurar Fonte Local
```bash
# No seu projeto de teste
cd /Users/c15303q/RiderProjects/MeuAppTeste/MeuApp.FlexiToggle.Test

# Criar nuget.config
cat > nuget.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="local-flexitoggle" value="/Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/nupkg" />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
  </packageSources>
</configuration>
EOF

# Instalar pacote local
dotnet add package FlexiToggle.Sdk --source local-flexitoggle
```

---

## 🌐 **Opção 3: Exemplo Web API Completo**

### 1. Criar Web API
```bash
cd /Users/c15303q/RiderProjects/
mkdir FlexiToggle.WebApp.Test
cd FlexiToggle.WebApp.Test

dotnet new webapi -n FlexiToggle.WebApp.Test
cd FlexiToggle.WebApp.Test
```

### 2. Adicionar Referência
```bash
dotnet add reference /Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/FlexiToggle.Sdk.csproj
```

### 3. Configurar Program.cs
```csharp
using FlexiToggle.Sdk.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurar FlexiToggle
builder.Services.AddFlexiToggle(builder.Configuration);

var app = builder.Build();

// Configure the pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 4. Controller de Exemplo
```csharp
// Controllers/FeatureController.cs
using FlexiToggle.Sdk;
using Microsoft.AspNetCore.Mvc;

namespace FlexiToggle.WebApp.Test.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeatureController : ControllerBase
{
    private readonly IFlexiToggleClient _flexiToggle;
    private readonly ILogger<FeatureController> _logger;

    public FeatureController(IFlexiToggleClient flexiToggle, ILogger<FeatureController> logger)
    {
        _flexiToggle = flexiToggle;
        _logger = logger;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetFeatureStatus()
    {
        try
        {
            var features = new Dictionary<string, object>();
            
            // Testar diferentes tipos de features
            features["nova-interface"] = await _flexiToggle.IsEnabledAsync("nova-interface");
            features["modo-escuro"] = await _flexiToggle.IsEnabledAsync("modo-escuro");
            features["max-usuarios"] = await _flexiToggle.GetValueAsync<int>("max-usuarios-simultaneos", 100);
            features["mensagem-boas-vindas"] = await _flexiToggle.GetValueAsync<string>("mensagem-boas-vindas", "Olá!");
            
            return Ok(new
            {
                success = true,
                features = features,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar features");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("feature/{key}")]
    public async Task<IActionResult> GetFeature(string key)
    {
        try
        {
            var isEnabled = await _flexiToggle.IsEnabledAsync(key);
            return Ok(new
            {
                feature = key,
                enabled = isEnabled,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar feature {FeatureKey}", key);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
```

---

## 🧪 **Como Testar**

### 1. Iniciar FlexiToggle
```bash
cd /Users/c15303q/RiderProjects/FeatureHub
./start.sh
```

### 2. Criar Projeto no FlexiToggle
1. Acesse: http://localhost:3000
2. Faça login
3. Crie um projeto: "Meu App Teste"
4. Anote o Project Key
5. Crie algumas feature flags de teste

### 3. Executar Projeto de Teste
```bash
cd /Users/c15303q/RiderProjects/MeuAppTeste/MeuApp.FlexiToggle.Test
dotnet run
```

### 4. Testar Web API (se escolheu opção 3)
```bash
cd /Users/c15303q/RiderProjects/FlexiToggle.WebApp.Test/FlexiToggle.WebApp.Test
dotnet run

# Testar endpoints:
curl http://localhost:5000/api/feature/status
curl http://localhost:5000/api/feature/nova-interface
```

---

## 🔧 **Troubleshooting**

### Erro de Referência
```bash
# Se der erro de referência, rebuild o SDK primeiro
cd /Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk
dotnet build --configuration Release
```

### Erro de Conexão
```bash
# Verificar se FlexiToggle está rodando
curl http://localhost:5078/health

# Verificar logs
cd /Users/c15303q/RiderProjects/FeatureHub
docker compose logs -f flexitoggle-backend
```

### Erro de Project Key
1. Vá em http://localhost:3000/projects
2. Clique no projeto
3. Copie o "Project Key" 
4. Cole no appsettings.json

---

## 🎯 **Próximos Passos**

1. **Escolha uma opção** (recomendo Opção 1 para simplicidade)
2. **Crie o projeto de teste**
3. **Configure as feature flags no FlexiToggle**
4. **Execute e teste**
5. **Itere e melhore**

Qual opção você prefere? Posso criar o projeto de teste completo para você!
