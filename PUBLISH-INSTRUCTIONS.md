# 📦 Instruções de Publicação - FlexiToggle

## 🎯 Status Atual
- ✅ **Código no GitHub:** https://github.com/JoaoPstein/FlexiToggle
- ✅ **GitHub Actions:** Pipeline de CI/CD configurado
- ✅ **SDK Pronto:** FlexiToggle.Sdk.1.0.0.nupkg gerado
- 🔄 **Próximo:** Publicar no NuGet.org

## 📦 1. Publicar SDK no NuGet

### Opção A: Publicação Manual (Recomendado para primeira vez)

1. **Obter API Key do NuGet.org:**
   ```bash
   # 1. Acesse: https://www.nuget.org/account/apikeys
   # 2. Clique em "Create"
   # 3. Nome: "FlexiToggle SDK Publishing"
   # 4. Escopo: "Push new packages and package versions"
   # 5. Copie a API Key gerada
   ```

2. **Publicar usando o script:**
   ```bash
   ./publish-nuget.sh SUA_API_KEY_AQUI
   ```

3. **Ou publicar manualmente:**
   ```bash
   cd sdk/dotnet/FlexiToggle.Sdk
   dotnet nuget push ./nupkg/FlexiToggle.Sdk.1.0.0.nupkg \
     --api-key SUA_API_KEY \
     --source https://api.nuget.org/v3/index.json
   ```

### Opção B: Publicação Automática via GitHub

1. **Configurar Secret no GitHub:**
   - Acesse: https://github.com/JoaoPstein/FlexiToggle/settings/secrets/actions
   - Clique em "New repository secret"
   - Nome: `NUGET_API_KEY`
   - Valor: Sua API Key do NuGet.org

2. **Criar Release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   
   Ou criar release pela interface do GitHub:
   - Acesse: https://github.com/JoaoPstein/FlexiToggle/releases/new
   - Tag: `v1.0.0`
   - Title: `FlexiToggle v1.0.0`
   - Descrição: Primeira versão estável

## 🐳 2. Testar Docker Localmente

```bash
# Parar serviços existentes
./cleanup.sh

# Subir com Docker Compose
docker-compose up --build

# Testar endpoints:
# Frontend: http://localhost:3000
# Backend: http://localhost:5078/health
# API: http://localhost:5078/api/auth/test-pascalcase
```

## 🧪 3. Testar SDK Após Publicação

### Teste Local (antes da publicação)
```bash
cd sdk/examples/dotnet-example

# Usar referência local
dotnet add reference ../../FlexiToggle.Sdk/FlexiToggle.Sdk.csproj

# Executar
dotnet run
```

### Teste com Pacote NuGet (após publicação)
```bash
# Criar projeto de teste
mkdir test-flexitoggle-sdk
cd test-flexitoggle-sdk
dotnet new console

# Instalar SDK do NuGet
dotnet add package FlexiToggle.Sdk

# Testar integração
```

## 📊 4. Monitorar Publicação

### Verificar Status no NuGet
- **Página do pacote:** https://www.nuget.org/packages/FlexiToggle.Sdk/
- **Estatísticas:** Downloads, versões, dependências
- **Tempo:** Pode levar 5-15 minutos para indexar

### Verificar GitHub Actions
- **Actions:** https://github.com/JoaoPstein/FlexiToggle/actions
- **Status:** Builds, testes, deployments
- **Logs:** Detalhes de execução

## 🚀 5. Próximas Versões

### Workflow para Updates
```bash
# 1. Fazer alterações no código
git add .
git commit -m "feat: nova funcionalidade"
git push

# 2. Atualizar versão no .csproj
# <Version>1.0.1</Version>

# 3. Criar nova release
git tag v1.0.1
git push origin v1.0.1

# 4. GitHub Actions irá automaticamente:
#    - Executar testes
#    - Build do SDK
#    - Publicar nova versão no NuGet
```

### Versionamento Semântico
- **1.0.0** → **1.0.1**: Bug fixes
- **1.0.0** → **1.1.0**: Novas funcionalidades
- **1.0.0** → **2.0.0**: Breaking changes

## 🔧 6. Configurações de Produção

### Variáveis de Ambiente para Deploy
```bash
# Backend
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=https://+:5078
ConnectionStrings__DefaultConnection=mongodb://user:pass@host:27017/flexitoggle

# Frontend  
VITE_API_URL=https://api.flexitoggle.com
VITE_APP_NAME=FlexiToggle
```

### SSL/HTTPS
```bash
# Nginx reverse proxy (recomendado)
server {
    listen 443 ssl;
    server_name api.flexitoggle.com;
    
    location / {
        proxy_pass http://localhost:5078;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📈 7. Marketing e Divulgação

### Após Publicação no NuGet
1. **README.md:** Adicionar badge do NuGet
2. **Documentação:** Criar docs.flexitoggle.com
3. **Blog Post:** Anunciar lançamento
4. **Redes Sociais:** Twitter, LinkedIn, Reddit
5. **Comunidade:** .NET Discord, Stack Overflow

### Badges para README
```markdown
[![NuGet](https://img.shields.io/nuget/v/FlexiToggle.Sdk.svg)](https://www.nuget.org/packages/FlexiToggle.Sdk/)
[![Downloads](https://img.shields.io/nuget/dt/FlexiToggle.Sdk.svg)](https://www.nuget.org/packages/FlexiToggle.Sdk/)
[![GitHub](https://img.shields.io/github/stars/JoaoPstein/FlexiToggle.svg)](https://github.com/JoaoPstein/FlexiToggle)
```

## 🆘 8. Troubleshooting

### Erro: "Package already exists"
```bash
# Incrementar versão no .csproj
<Version>1.0.1</Version>

# Rebuild e republish
dotnet clean
dotnet build --configuration Release
dotnet pack --configuration Release --output ./nupkg
```

### Erro: "Invalid API Key"
```bash
# Verificar se a API Key tem permissões corretas
# Recriar API Key no nuget.org se necessário
```

### GitHub Actions falhando
```bash
# Verificar logs em:
# https://github.com/JoaoPstein/FlexiToggle/actions

# Problemas comuns:
# - Secrets não configurados
# - Versão duplicada
# - Testes falhando
```

## ✅ Checklist Final

Antes de publicar:
- [ ] Código testado localmente
- [ ] Docker funcionando
- [ ] SDK compilando sem erros
- [ ] README.md atualizado
- [ ] Versão correta no .csproj
- [ ] API Key do NuGet obtida
- [ ] GitHub Actions configurado

**🎉 Pronto para publicar!**

Execute: `./publish-nuget.sh SUA_API_KEY`
