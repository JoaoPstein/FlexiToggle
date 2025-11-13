# 🚀 Como Usar o FlexiToggle SDK no Seu Projeto

## 📦 **Opção 1: Pacote NuGet Local (Recomendado)**

### 1. **Configurar Fonte NuGet Local**

No seu projeto `Corebanking.WebApi`, crie um arquivo `nuget.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="local-flexitoggle" value="/Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/nupkg" />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
  </packageSources>
</configuration>
```

### 2. **Instalar o Pacote**

```bash
cd /caminho/para/seu/projeto/Corebanking.WebApi
dotnet add package FlexiToggle.Sdk --source local-flexitoggle
```

### 3. **Configurar no Program.cs**

```csharp
using FlexiToggle.Sdk.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Seus serviços existentes...
builder.Services.AddControllers();

// Adicionar FlexiToggle SDK
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "http://localhost:5078";
    config.ProjectKey = "seu-project-key"; // Pegar do painel FlexiToggle
    config.Environment = "development";
    config.PollingInterval = TimeSpan.FromSeconds(30);
});

var app = builder.Build();

// Resto da configuração...
app.Run();
```

### 4. **Usar no Controller**

```csharp
using FlexiToggle.Sdk;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class CoreBankingController : ControllerBase
{
    private readonly IFlexiToggleClient _flexiToggle;
    private readonly ILogger<CoreBankingController> _logger;

    public CoreBankingController(IFlexiToggleClient flexiToggle, ILogger<CoreBankingController> logger)
    {
        _flexiToggle = flexiToggle;
        _logger = logger;
    }

    [HttpGet("features")]
    public IActionResult GetFeatures()
    {
        var features = new
        {
            NovaInterface = _flexiToggle.IsEnabled("nova-interface"),
            ModoEscuro = _flexiToggle.IsEnabled("modo-escuro"),
            LimiteTransacoes = _flexiToggle.GetNumber("limite-transacoes-diarias", 1000),
            MensagemManutencao = _flexiToggle.GetString("mensagem-manutencao", "Sistema funcionando normalmente")
        };

        return Ok(features);
    }

    [HttpPost("transferencia")]
    public IActionResult ProcessarTransferencia([FromBody] TransferenciaRequest request)
    {
        // Verificar se nova validação está ativa
        if (_flexiToggle.IsEnabled("validacao-avancada"))
        {
            _logger.LogInformation("Usando validação avançada");
            // Lógica de validação avançada
        }

        // Verificar limite dinâmico
        var limiteMaximo = _flexiToggle.GetDecimal("limite-transferencia-max", 10000m);
        if (request.Valor > limiteMaximo)
        {
            return BadRequest($"Valor excede o limite máximo de {limiteMaximo:C}");
        }

        // Processar transferência...
        return Ok(new { Status = "Processada", Valor = request.Valor });
    }
}

public class TransferenciaRequest
{
    public decimal Valor { get; set; }
    public string ContaOrigem { get; set; } = string.Empty;
    public string ContaDestino { get; set; } = string.Empty;
}
```

### 5. **Configurar appsettings.json**

```json
{
  "FlexiToggle": {
    "ApiUrl": "http://localhost:5078",
    "ProjectKey": "corebanking-projeto",
    "Environment": "development",
    "PollingInterval": "00:00:30",
    "HttpTimeout": "00:00:10"
  }
}
```

---

## 🔧 **Opção 2: Copiar DLL Diretamente**

Se a Opção 1 não funcionar no Rider, você pode copiar a DLL:

### 1. **Copiar DLL**

```bash
# Copiar DLL para seu projeto
cp /Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/bin/Release/net8.0/FlexiToggle.Sdk.dll /caminho/para/seu/projeto/libs/

# Adicionar referência no .csproj
```

### 2. **Adicionar no .csproj**

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <Reference Include="FlexiToggle.Sdk">
      <HintPath>libs/FlexiToggle.Sdk.dll</HintPath>
    </Reference>
  </ItemGroup>

  <!-- Dependências necessárias -->
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Hosting.Abstractions" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Options" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Options.ConfigurationExtensions" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
    <PackageReference Include="System.Text.Json" Version="8.0.5" />
  </ItemGroup>
</Project>
```

---

## 🎯 **Exemplos Práticos para CoreBanking**

### **Feature Flags Sugeridas**

```csharp
// Funcionalidades de negócio
var novaValidacaoKYC = _flexiToggle.IsEnabled("nova-validacao-kyc");
var limitePix24h = _flexiToggle.GetDecimal("limite-pix-24h", 5000m);
var taxaTransferencia = _flexiToggle.GetDecimal("taxa-transferencia-ted", 15.90m);

// Configurações operacionais
var timeoutAPI = _flexiToggle.GetNumber("timeout-api-bacen", 30);
var retryAttempts = _flexiToggle.GetNumber("retry-attempts", 3);
var maintenanceMode = _flexiToggle.IsEnabled("modo-manutencao");

// A/B Testing
var algoritmoFraude = _flexiToggle.GetVariant("algoritmo-fraude", "v1");
var layoutDashboard = _flexiToggle.GetVariant("layout-dashboard", "classico");
```

### **Middleware de Manutenção**

```csharp
public class MaintenanceModeMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IFlexiToggleClient _flexiToggle;

    public MaintenanceModeMiddleware(RequestDelegate next, IFlexiToggleClient flexiToggle)
    {
        _next = next;
        _flexiToggle = flexiToggle;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_flexiToggle.IsEnabled("modo-manutencao"))
        {
            var mensagem = _flexiToggle.GetString("mensagem-manutencao", 
                "Sistema em manutenção. Tente novamente em alguns minutos.");
            
            context.Response.StatusCode = 503;
            await context.Response.WriteAsync(mensagem);
            return;
        }

        await _next(context);
    }
}

// Registrar no Program.cs
app.UseMiddleware<MaintenanceModeMiddleware>();
```

### **Service com Feature Flags**

```csharp
public class TransferenciaService
{
    private readonly IFlexiToggleClient _flexiToggle;
    private readonly ILogger<TransferenciaService> _logger;

    public TransferenciaService(IFlexiToggleClient flexiToggle, ILogger<TransferenciaService> logger)
    {
        _flexiToggle = flexiToggle;
        _logger = logger;
    }

    public async Task<bool> ProcessarTransferencia(decimal valor, string origem, string destino)
    {
        // Verificar limites dinâmicos
        var limiteMaximo = _flexiToggle.GetDecimal("limite-transferencia-max", 50000m);
        if (valor > limiteMaximo)
        {
            _logger.LogWarning("Transferência bloqueada: valor {Valor} excede limite {Limite}", valor, limiteMaximo);
            return false;
        }

        // Usar nova validação se ativa
        if (_flexiToggle.IsEnabled("validacao-conta-avancada"))
        {
            var isValid = await ValidarContaAvancada(origem, destino);
            if (!isValid) return false;
        }

        // Aplicar taxa dinâmica
        var taxa = _flexiToggle.GetDecimal("taxa-transferencia", 0m);
        var valorFinal = valor + taxa;

        _logger.LogInformation("Transferência processada: {Valor} + taxa {Taxa} = {ValorFinal}", 
            valor, taxa, valorFinal);

        return true;
    }

    private async Task<bool> ValidarContaAvancada(string origem, string destino)
    {
        // Lógica de validação avançada
        await Task.Delay(100); // Simular chamada externa
        return true;
    }
}
```

---

## 🚨 **Troubleshooting no Rider**

### **Problema: "Unable to find project information"**

**Solução 1: Limpar Cache**
```bash
# No terminal do Rider
dotnet clean
dotnet restore
```

**Solução 2: Invalidar Cache do Rider**
1. File → Invalidate Caches and Restart
2. Escolha "Invalidate and Restart"

**Solução 3: Usar Pacote NuGet Local**
```bash
# Criar nuget.config no seu projeto
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="local" value="/Users/c15303q/RiderProjects/FeatureHub/sdk/dotnet/FlexiToggle.Sdk/nupkg" />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
  </packageSources>
</configuration>
```

### **Problema: Vulnerabilidades de Segurança**

Para resolver os warnings de segurança:

```xml
<PackageReference Include="System.Text.Json" Version="8.0.5" />
<PackageReference Include="System.Text.RegularExpressions" Version="4.3.1" />
```

---

## ✅ **Checklist de Implementação**

- [ ] FlexiToggle rodando (`http://localhost:5078/health`)
- [ ] Projeto criado no painel (`http://localhost:3000`)
- [ ] Project Key copiado
- [ ] SDK instalado no projeto
- [ ] Configuração no `Program.cs`
- [ ] `appsettings.json` configurado
- [ ] Primeiro teste funcionando

---

## 🎉 **Próximos Passos**

1. **Teste básico**: Crie uma feature flag simples
2. **Integre gradualmente**: Substitua configurações hardcoded
3. **Monitore**: Use analytics para ver o uso
4. **Otimize**: Ajuste polling e cache conforme necessário

**Precisa de ajuda? Me avise qual opção você escolheu e como foi o resultado!**
