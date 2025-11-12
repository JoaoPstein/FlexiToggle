# 🚀 Guia de Deploy - FlexiToggle

Este guia contém todas as instruções para subir o FlexiToggle no GitHub e publicar o SDK no NuGet.

## 📋 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no NuGet.org
- [ ] Docker instalado
- [ ] .NET 8 SDK instalado
- [ ] Node.js 18+ instalado

## 🔧 Preparação Completa

### ✅ Itens já configurados:

1. **Renomeação completa para FlexiToggle**
   - ✅ Todos os arquivos renomeados
   - ✅ Referências atualizadas
   - ✅ Docker configurado
   - ✅ SDK preparado para NuGet

2. **Estrutura do projeto organizada**
   - ✅ Backend: `backend/FlexiToggle.Api/`
   - ✅ Frontend: `frontend/`
   - ✅ SDK .NET: `sdk/dotnet/FlexiToggle.Sdk/`
   - ✅ SDK JavaScript: `sdk/javascript/`
   - ✅ Exemplos: `sdk/examples/`

3. **Arquivos de configuração**
   - ✅ `.gitignore` completo
   - ✅ `docker-compose.yml` atualizado
   - ✅ `docker-compose.dev.yml` atualizado
   - ✅ Workflow GitHub Actions: `github-workflow-ci-cd.yml`

## 🐙 1. Subir no GitHub

### 1.1 Criar repositório no GitHub
```bash
# No GitHub, criar novo repositório: flexitoggle/flexitoggle
```

### 1.2 Inicializar Git e fazer push
```bash
cd /Users/c15303q/RiderProjects/FeatureHub

# Inicializar repositório
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "🚀 Initial commit - FlexiToggle v1.0.0

- Complete feature flags platform
- .NET 8 backend with MongoDB
- React + TypeScript frontend
- .NET SDK ready for NuGet
- JavaScript SDK
- Docker support
- Responsive design
- Modern UI/UX"

# Adicionar remote
git remote add origin https://github.com/flexitoggle/flexitoggle.git

# Push para main
git branch -M main
git push -u origin main
```

### 1.3 Configurar GitHub Actions
```bash
# Copiar o arquivo de workflow para o local correto
mkdir -p .github/workflows
cp github-workflow-ci-cd.yml .github/workflows/ci-cd.yml

# Commit e push
git add .github/
git commit -m "🔧 Add GitHub Actions CI/CD pipeline"
git push
```

### 1.4 Configurar Secrets no GitHub
No GitHub, vá para Settings > Secrets and variables > Actions e adicione:

- `NUGET_API_KEY`: Sua chave da API do NuGet.org
- `DOCKERHUB_USERNAME`: Seu usuário do Docker Hub
- `DOCKERHUB_TOKEN`: Token de acesso do Docker Hub

## 📦 2. Publicar SDK no NuGet

### 2.1 Obter API Key do NuGet.org
1. Acesse [nuget.org](https://www.nuget.org)
2. Faça login
3. Vá para Account Settings > API Keys
4. Crie uma nova API Key com escopo "Push new packages and package versions"

### 2.2 Build e publicação manual
```bash
cd /Users/c15303q/RiderProjects/FeatureHub

# Build do SDK
./build-nuget.sh

# Publicar no NuGet (substitua YOUR_API_KEY)
cd sdk/dotnet/FlexiToggle.Sdk
dotnet nuget push ./nupkg/*.nupkg --api-key YOUR_API_KEY --source https://api.nuget.org/v3/index.json
```

### 2.3 Publicação automática via GitHub
```bash
# Criar uma tag de release
git tag v1.0.0
git push origin v1.0.0

# Ou criar release no GitHub UI
# Isso irá automaticamente:
# 1. Executar testes
# 2. Build do SDK
# 3. Publicar no NuGet
# 4. Build das imagens Docker
```

## 🐳 3. Testar Docker Localmente

### 3.1 Teste completo com Docker Compose
```bash
cd /Users/c15303q/RiderProjects/FeatureHub

# Parar serviços existentes
./cleanup.sh

# Subir com Docker
docker-compose up --build

# Testar:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5078/health
# - MongoDB: localhost:27017
```

### 3.2 Teste individual dos serviços
```bash
# Backend apenas
docker build -t flexitoggle-api backend/FlexiToggle.Api/
docker run -p 5078:5078 flexitoggle-api

# Frontend apenas  
docker build -t flexitoggle-frontend frontend/
docker run -p 3000:80 flexitoggle-frontend
```

## 🧪 4. Testar SDK Localmente

### 4.1 Testar SDK .NET
```bash
cd sdk/examples/dotnet-example

# Configurar appsettings.json com suas credenciais
# Executar exemplo
dotnet run
```

### 4.2 Testar SDK JavaScript
```bash
cd sdk/examples/nodejs-example

# Configurar .env com suas credenciais
cp env.example .env

# Instalar e executar
npm install
npm start
```

## 📊 5. Monitoramento e Logs

### 5.1 Logs do Docker
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### 5.2 Health Checks
```bash
# Backend health
curl http://localhost:5078/health

# Frontend
curl http://localhost:3000

# MongoDB (se exposto)
mongosh mongodb://flexitoggle:flexitoggle123@localhost:27017/flexitoggle
```

## 🔧 6. Configurações de Produção

### 6.1 Variáveis de Ambiente
```bash
# Backend (.env)
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:5078
ConnectionStrings__DefaultConnection=mongodb://user:pass@host:27017/flexitoggle

# Frontend (.env)
VITE_API_URL=https://api.flexitoggle.com
VITE_APP_NAME=FlexiToggle
```

### 6.2 SSL/HTTPS
```bash
# Para produção, configure SSL no reverse proxy (nginx/traefik)
# Ou use certificados no próprio .NET:
ASPNETCORE_URLS=https://+:5078
ASPNETCORE_Kestrel__Certificates__Default__Path=/path/to/cert.pfx
ASPNETCORE_Kestrel__Certificates__Default__Password=cert_password
```

## 🚀 7. Deploy em Produção

### 7.1 Usando Docker Compose
```bash
# Produção com MongoDB externo
docker-compose -f docker-compose.yml up -d
```

### 7.2 Usando Kubernetes
```yaml
# Exemplo de deployment k8s (criar arquivos separados)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flexitoggle-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flexitoggle-api
  template:
    metadata:
      labels:
        app: flexitoggle-api
    spec:
      containers:
      - name: api
        image: flexitoggle/api:latest
        ports:
        - containerPort: 5078
```

## 📈 8. Próximos Passos

### 8.1 Melhorias futuras
- [ ] Implementar cache Redis
- [ ] Adicionar métricas Prometheus
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Implementar backup automático
- [ ] Adicionar suporte a webhooks

### 8.2 SDKs adicionais
- [ ] SDK Python
- [ ] SDK Java
- [ ] SDK Go
- [ ] SDK PHP

## 🆘 Troubleshooting

### Problemas comuns:

**1. Erro de conexão com MongoDB:**
```bash
# Verificar se MongoDB está rodando
docker-compose ps
docker-compose logs database
```

**2. Frontend não carrega:**
```bash
# Verificar variáveis de ambiente
cat frontend/.env
# Rebuild do frontend
docker-compose build frontend
```

**3. SDK não conecta:**
```bash
# Verificar configuração
# Verificar se backend está acessível
curl http://localhost:5078/health
```

**4. Erro de CORS:**
```bash
# Verificar configuração de CORS no backend
# Adicionar domínio permitido em Program.cs
```

## 📞 Suporte

- **Documentação:** README.md
- **Issues:** GitHub Issues
- **Discussões:** GitHub Discussions
- **Email:** support@flexitoggle.com (configurar)

---

## ✅ Checklist Final

Antes de fazer o deploy em produção:

- [ ] Todos os testes passando
- [ ] Docker funcionando localmente
- [ ] SDK testado e funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets configurados no GitHub
- [ ] Backup strategy definida
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

**🎉 Parabéns! Seu FlexiToggle está pronto para produção!**
