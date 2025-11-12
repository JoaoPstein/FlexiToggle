# FlexiToggle SDK - Exemplo Node.js

Este é um exemplo prático de como integrar o FlexiToggle SDK em uma aplicação Node.js.

## 🚀 Setup Rápido

### 1. Pré-requisitos

- Node.js 16+ instalado
- FlexiToggle backend rodando em `http://localhost:5000`
- Um projeto criado no FlexiToggle com algumas feature flags

### 2. Instalação

```bash
# Clone o repositório (se ainda não fez)
cd sdk/examples/nodejs-example

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
```

### 3. Configuração

Edite o arquivo `.env` com suas configurações:

```env
# FlexiToggle Configuration
FEATUREHUB_API_URL=http://localhost:5000
FEATUREHUB_PROJECT_KEY=seu-projeto-key  # Substitua pela chave do seu projeto
FEATUREHUB_ENVIRONMENT=production

# Application Configuration
PORT=3001
NODE_ENV=development
```

### 4. Criar Feature Flags no FlexiToggle

Antes de rodar o exemplo, crie estas feature flags no seu projeto FlexiToggle:

#### Flags Booleanas:
- `dark-mode` - Ativa/desativa modo escuro
- `new-checkout` - Nova versão do checkout
- `premium-features` - Recursos premium

#### Flags de String:
- `welcome-message` - Mensagem de boas-vindas (ex: "Olá, bem-vindo!")
- `theme` - Tema atual (ex: "light", "dark", "auto")

#### Flags Numéricas:
- `max-items` - Máximo de itens (ex: 10)
- `discount-percent` - Percentual de desconto (ex: 15)

#### Flags JSON:
- `app-config` - Configuração da aplicação
  ```json
  {
    "timeout": 5000,
    "retries": 3,
    "features": ["analytics", "notifications"]
  }
  ```

#### Teste A/B:
- `checkout-test` - Teste A/B do checkout
  ```json
  {
    "variants": [
      {"name": "control", "weight": 50},
      {"name": "variant_a", "weight": 30},
      {"name": "variant_b", "weight": 20}
    ]
  }
  ```

### 5. Executar

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

Acesse: http://localhost:3001

## 📋 Funcionalidades do Exemplo

### 🎛️ Dashboard Interativo
- Visualização em tempo real das feature flags
- Status de conexão com o FlexiToggle
- Valores de configuração dinâmicos

### 🔄 Operações Dinâmicas
- **Atualizar Flags**: Força sincronização com o servidor
- **Mudar Usuário**: Simula diferentes usuários
- **Trackear Eventos**: Registra eventos customizados

### 📊 Analytics e A/B Testing
- Tracking automático de avaliações de flags
- Simulação de conversões para testes A/B
- Eventos customizados com metadados

### 🛡️ Middleware de Proteção
- Rota `/premium/*` protegida por feature flag
- Exemplo de controle de acesso baseado em flags

## 🔧 API Endpoints

### GET `/api/features`
Retorna todas as feature flags avaliadas para o usuário atual.

```json
{
  "success": true,
  "features": {
    "darkMode": true,
    "newCheckout": false,
    "welcomeMessage": "Bem-vindo!",
    "maxItems": 10,
    "checkoutVariant": "variant_a"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST `/api/track-conversion`
Registra um evento de conversão.

```json
{
  "event": "purchase",
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

### POST `/api/refresh-flags`
Força atualização das feature flags.

## 🎯 Casos de Uso Demonstrados

### 1. Feature Toggles Simples
```javascript
if (featureHub.isEnabled('dark-mode')) {
  // Aplicar tema escuro
  applyDarkTheme();
}
```

### 2. Configuração Dinâmica
```javascript
const maxItems = featureHub.getNumber('max-items', 10);
const config = featureHub.getJSON('app-config', defaultConfig);
```

### 3. A/B Testing
```javascript
const variant = featureHub.getVariant('checkout-test', 'control');
switch (variant) {
  case 'variant_a':
    showNewCheckout();
    break;
  case 'variant_b':
    showExperimentalCheckout();
    break;
  default:
    showDefaultCheckout();
}
```

### 4. Middleware de Proteção
```javascript
app.use('/premium', (req, res, next) => {
  if (featureHub.isEnabled('premium-features')) {
    next();
  } else {
    res.status(403).json({ error: 'Recurso não disponível' });
  }
});
```

### 5. Analytics e Tracking
```javascript
// Tracking automático de avaliações
featureHub.getFlag('my-flag'); // Automaticamente tracked

// Eventos customizados
featureHub.track('button_click', { button: 'cta', page: 'home' });

// Conversões de A/B test
featureHub.trackConversion('checkout-test', 'purchase', 99.99);
```

## 🔍 Debugging

### Logs do SDK
O SDK registra automaticamente:
- Inicialização e erros
- Atualizações de flags
- Eventos de analytics

### Debug Info na UI
O dashboard mostra informações de debug em tempo real:
- Estado atual de todas as flags
- Timestamps de avaliação
- Configurações do usuário

### Variáveis de Ambiente de Debug
```env
NODE_ENV=development  # Ativa logs detalhados
```

## 🚨 Troubleshooting

### Problema: "Projeto não encontrado"
- Verifique se `FEATUREHUB_PROJECT_KEY` está correto
- Confirme se o projeto existe no FlexiToggle
- Verifique se o backend está rodando

### Problema: "Ambiente não encontrado"
- Confirme se o ambiente existe no projeto
- Verifique `FEATUREHUB_ENVIRONMENT` no `.env`

### Problema: Flags sempre retornam valor padrão
- Verifique se as flags estão ativadas no ambiente
- Confirme se os nomes das flags estão corretos
- Verifique os logs do SDK para erros

### Problema: Analytics não funcionam
- Confirme se `enableAnalytics: true` no SDK
- Verifique se o endpoint `/api/analytics/batch` está funcionando
- Verifique os logs do backend

## 📚 Próximos Passos

1. **Integre com seu projeto**: Copie o código relevante para sua aplicação
2. **Customize as flags**: Crie flags específicas para suas necessidades
3. **Implemente targeting**: Use atributos de usuário para segmentação
4. **Configure analytics**: Integre com seu sistema de analytics
5. **Teste A/B**: Configure testes A/B para suas features

## 🤝 Contribuindo

Encontrou um bug ou tem uma sugestão? Abra uma issue ou envie um PR!

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
