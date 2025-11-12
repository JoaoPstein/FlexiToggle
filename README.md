# 🚀 FlexiToggle

**A plataforma completa de Feature Flags, A/B Testing e Configuração Dinâmica**

FlexiToggle é uma solução moderna e flexível para gerenciamento de feature flags, permitindo que você controle funcionalidades, execute testes A/B e configure sua aplicação dinamicamente sem necessidade de deploy.

## ✨ Funcionalidades Principais

### 🎛️ **Feature Flags Avançadas**
- **Toggles Booleanos** - Ativar/desativar funcionalidades
- **Configurações Dinâmicas** - Strings, números, JSON
- **Targeting Avançado** - Por usuário, grupo, percentual
- **Rollout Gradual** - Liberação progressiva controlada

### 🧪 **A/B Testing Inteligente**
- **Testes Multivariantes** - Múltiplas variações
- **Distribuição Inteligente** - Algoritmos de balanceamento
- **Analytics Integrado** - Métricas e conversões
- **Smart Rollout** - IA para otimização automática

### 📊 **Analytics e Monitoramento**
- **Dashboard em Tempo Real** - Visualização de métricas
- **Eventos Customizados** - Tracking de interações
- **Relatórios Avançados** - Análise de performance
- **Alertas Inteligentes** - Notificações automáticas

### 🔧 **Gestão de Projetos**
- **Multi-Projetos** - Organização por aplicação
- **Ambientes Múltiplos** - Dev, Staging, Production
- **Controle de Acesso** - Roles e permissões
- **API Keys** - Integração segura

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React + TS    │◄──►│   .NET 8 API    │◄──►│   SQLite        │
│   Tailwind CSS  │    │   SignalR       │    │   Entity FW     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   JavaScript    │    │   .NET SDK      │
│   SDK           │    │   NuGet Package │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. **Executar com Docker**

```bash
# Clone o repositório
git clone <seu-repo>
cd FlexiToggle

# Iniciar todos os serviços
./start.sh

# Acessar a aplicação
open http://localhost:3000
```

**Login padrão:**
- Email: `admin@flexitoggle.com`
- Senha: `FlexiToggle123!`

### 2. **Desenvolvimento Local**

```bash
# Backend (.NET 8)
cd backend/FlexiToggle.Api
dotnet run --urls "http://localhost:5000"

# Frontend (React + Vite)
cd frontend
npm install
npm run dev
```

## 📦 SDKs Disponíveis

### 🔷 **.NET SDK**

```bash
# Instalar o SDK
dotnet add reference sdk/dotnet/FlexiToggle.Sdk/FlexiToggle.Sdk.csproj
```

```csharp
// Program.cs
builder.Services.AddFlexiToggle(config =>
{
    config.ApiUrl = "http://localhost:5000";
    config.ProjectKey = "seu-projeto";
    config.Environment = "production";
});

// Controller
public class HomeController : ControllerBase
{
    private readonly IFlexiToggleClient _flexiToggle;

    public HomeController(IFlexiToggleClient flexiToggle)
    {
        _flexiToggle = flexiToggle;
    }

    [HttpGet]
    public IActionResult Index()
    {
        if (_flexiToggle.IsEnabled("new-homepage"))
        {
            return View("NewHomepage");
        }
        
        return View("OldHomepage");
    }
}
```

### 🟨 **JavaScript SDK**

```html
<script src="sdk/javascript/flexitoggle-sdk.js"></script>
<script>
const client = new FlexiToggleClient({
    apiUrl: 'http://localhost:5000',
    projectKey: 'seu-projeto',
    environment: 'production'
});

// Feature toggle
if (client.isEnabled('dark-mode')) {
    document.body.classList.add('dark');
}

// A/B Testing
const variant = client.getVariant('checkout-test', 'control');
console.log('Variante do teste:', variant);

// Configuração dinâmica
const maxItems = client.getNumber('max-items', 10);
const welcomeMsg = client.getString('welcome-message', 'Olá!');
</script>
```

## 🎯 Casos de Uso

### 🔄 **Feature Toggles**
```csharp
// Liberar funcionalidade gradualmente
if (_flexiToggle.IsEnabled("beta-features"))
{
    return await GetBetaFeatures();
}

// Configuração dinâmica
var timeout = _flexiToggle.GetNumber("api-timeout", 5000);
httpClient.Timeout = TimeSpan.FromMilliseconds(timeout);
```

### 🧪 **A/B Testing**
```csharp
// Teste de checkout
var variant = _flexiToggle.GetVariant("checkout-test", "control");
var checkoutService = variant switch
{
    "variant_a" => new FastCheckoutService(),
    "variant_b" => new DetailedCheckoutService(),
    _ => new StandardCheckoutService()
};

// Registrar conversão
await _flexiToggle.TrackConversionAsync("checkout-test", "purchase", order.Total);
```

### 📊 **Analytics**
```csharp
// Evento customizado
await _flexiToggle.TrackAsync("button_click", new Dictionary<string, object>
{
    ["button"] = "cta",
    ["page"] = "homepage",
    ["user_plan"] = "premium"
});
```

## 🛠️ Desenvolvimento

### **Estrutura do Projeto**

```
FlexiToggle/
├── backend/FlexiToggle.Api/     # API .NET 8
│   ├── Controllers/             # Endpoints REST
│   ├── Models/                  # Entidades do banco
│   ├── Services/                # Lógica de negócio
│   └── Data/                    # Entity Framework
├── frontend/                    # React + TypeScript
│   ├── src/components/          # Componentes React
│   ├── src/pages/               # Páginas da aplicação
│   └── src/services/            # Integração com API
├── sdk/                         # SDKs para integração
│   ├── dotnet/FlexiToggle.Sdk/  # SDK .NET
│   ├── javascript/              # SDK JavaScript
│   └── examples/                # Exemplos de uso
└── docs/                        # Documentação
```

### **Tecnologias Utilizadas**

**Backend:**
- .NET 8 + ASP.NET Core
- Entity Framework Core
- SignalR (WebSockets)
- JWT Authentication
- AutoMapper
- Serilog

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS
- React Router
- React Query
- Recharts (Gráficos)

**Database:**
- SQLite (Desenvolvimento)
- PostgreSQL (Produção)

## 🔧 Configuração Avançada

### **Variáveis de Ambiente**

```bash
# Backend
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Data Source=flexitoggle.db
JwtSettings__SecretKey=sua-chave-secreta
JwtSettings__ExpiryMinutes=60

# Frontend
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/hubs/flexitoggle
```

### **Docker Compose**

```yaml
version: '3.8'
services:
  api:
    build: ./backend/FlexiToggle.Api
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - api
```

## 📈 Performance

- **Latência**: < 50ms para avaliação de flags
- **Throughput**: > 10,000 RPS por instância
- **Cache**: Redis para alta performance
- **CDN**: Suporte para distribuição global

## 🔒 Segurança

- **Autenticação JWT** com refresh tokens
- **RBAC** (Role-Based Access Control)
- **API Keys** com scopes limitados
- **Rate Limiting** por cliente
- **Audit Logs** completos

## 🌍 Roadmap

### **Q1 2024**
- [ ] SDK Python
- [ ] SDK Go
- [ ] Integração Slack/Teams
- [ ] Webhooks avançados

### **Q2 2024**
- [ ] Multi-tenancy
- [ ] SSO (SAML/OAuth)
- [ ] Approval workflows
- [ ] Advanced scheduling

### **Q3 2024**
- [ ] Machine Learning insights
- [ ] Auto-rollback inteligente
- [ ] Performance monitoring
- [ ] Cost optimization

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](../../issues)
- **Discussões**: [GitHub Discussions](../../discussions)
- **Email**: suporte@flexitoggle.com

---

**FlexiToggle** - Flexibilidade total no controle de suas funcionalidades! 🚀
