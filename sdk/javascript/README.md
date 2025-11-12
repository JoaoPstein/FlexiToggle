# 🚀 FlexiToggle JavaScript SDK

Uma biblioteca JavaScript leve e poderosa para integração com FlexiToggle. Suporta feature flags, A/B testing e analytics em tempo real.

## 📦 Instalação

### Via CDN
```html
<script src="https://cdn.flexitoggle.com/sdk/flexitoggle-sdk.min.js"></script>
```

### Via NPM (quando publicado)
```bash
npm install @flexitoggle/javascript-sdk
```

### Download Direto
Baixe o arquivo `flexitoggle-sdk.js` e inclua em seu projeto.

## 🚀 Uso Básico

### Inicialização
```javascript
const featureHub = new FlexiToggleSDK({
  apiUrl: 'https://your-flexitoggle-instance.com',
  projectKey: 'your-project-key',
  environment: 'production', // ou 'development', 'staging'
  userId: 'user-123',
  userAttributes: {
    email: 'user@example.com',
    plan: 'premium',
    region: 'US'
  }
});

// Aguardar inicialização
featureHub.on('ready', () => {
  console.log('FlexiToggle SDK pronto!');
});
```

### Feature Flags Básicas
```javascript
// Verificar se uma feature está ativa
if (featureHub.isEnabled('new-checkout')) {
  // Mostrar novo checkout
  showNewCheckout();
}

// Obter valor de uma flag
const buttonColor = featureHub.getString('button-color', 'blue');
const maxItems = featureHub.getNumber('max-items', 10);
const config = featureHub.getJSON('app-config', {});
```

### A/B Testing
```javascript
// Obter variante de um teste A/B
const variant = featureHub.getVariant('checkout-test', 'control');

switch (variant) {
  case 'control':
    showOriginalCheckout();
    break;
  case 'variant-a':
    showNewCheckout();
    break;
  case 'variant-b':
    showMinimalCheckout();
    break;
}

// Rastrear conversão
featureHub.trackConversion('checkout-test', 'purchase', 99.99);
```

### Analytics
```javascript
// Rastrear eventos customizados
featureHub.track('button-clicked', {
  buttonId: 'cta-main',
  page: 'homepage'
});

// Rastrear conversões
featureHub.trackConversion('signup-test', 'signup-completed');
```

## ⚛️ Integração com React

### Provider Setup
```jsx
import React from 'react';
import { FlexiToggleProvider } from '@flexitoggle/react-sdk';

function App() {
  const config = {
    apiUrl: 'https://your-flexitoggle-instance.com',
    projectKey: 'your-project-key',
    environment: 'production',
    userId: getCurrentUserId(),
    userAttributes: getUserAttributes()
  };

  return (
    <FlexiToggleProvider config={config}>
      <YourApp />
    </FlexiToggleProvider>
  );
}
```

### Usando Hooks
```jsx
import { useFeatureFlag, useFlexiToggle } from '@flexitoggle/react-sdk';

function MyComponent() {
  // Hook para flag individual
  const showNewFeature = useFeatureFlag('new-feature', false);
  
  // Hook para SDK completo
  const { sdk, isReady } = useFlexiToggle();
  
  // A/B Testing
  const variant = isReady ? sdk.getVariant('button-test') : 'control';

  const handleClick = () => {
    sdk.track('button-clicked', { variant });
  };

  if (!isReady) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      {showNewFeature && <NewFeatureComponent />}
      
      <button 
        className={variant === 'red' ? 'btn-red' : 'btn-blue'}
        onClick={handleClick}
      >
        {variant === 'large' ? 'COMPRAR AGORA!' : 'Comprar'}
      </button>
    </div>
  );
}
```

## 🎯 Targeting Avançado

O SDK automaticamente envia atributos do usuário para o servidor, que usa essas informações para targeting:

```javascript
// Atualizar atributos do usuário
featureHub.updateUserAttributes({
  plan: 'enterprise',
  region: 'EU',
  betaUser: true
});

// Alterar usuário
featureHub.setUserId('new-user-456');
```

## 📊 Eventos e Listeners

### Eventos do SDK
```javascript
// SDK pronto
featureHub.on('ready', () => {
  console.log('SDK inicializado');
});

// Flags atualizadas
featureHub.on('flagsUpdated', (flags) => {
  console.log('Flags atualizadas:', flags);
});

// Erro
featureHub.on('error', (error) => {
  console.error('Erro no SDK:', error);
});
```

### Listeners de Flags
```javascript
// Escutar mudanças em uma flag específica
featureHub.onFlagChange('new-feature', (newValue, oldValue) => {
  console.log(`Flag changed: ${oldValue} -> ${newValue}`);
  
  if (newValue) {
    enableNewFeature();
  } else {
    disableNewFeature();
  }
});
```

## ⚙️ Configuração Avançada

```javascript
const featureHub = new FlexiToggleSDK({
  // URL da API FlexiToggle
  apiUrl: 'https://your-flexitoggle-instance.com',
  
  // Chave do projeto
  projectKey: 'your-project-key',
  
  // Ambiente (development, staging, production)
  environment: 'production',
  
  // ID do usuário
  userId: 'user-123',
  
  // ID da sessão (gerado automaticamente se não fornecido)
  sessionId: 'session-456',
  
  // Atributos do usuário para targeting
  userAttributes: {
    email: 'user@example.com',
    plan: 'premium',
    region: 'US',
    device: 'mobile'
  },
  
  // Habilitar analytics (padrão: true)
  enableAnalytics: true,
  
  // Intervalo de polling em ms (padrão: 30000 = 30s)
  // Use 0 para desabilitar polling
  pollingInterval: 30000
});
```

## 🔄 Atualização em Tempo Real

O SDK automaticamente busca atualizações de flags em intervalos regulares:

```javascript
// Atualizar manualmente
await featureHub.refresh();

// Configurar intervalo personalizado (em milissegundos)
const featureHub = new FlexiToggleSDK({
  // ... outras configurações
  pollingInterval: 10000 // 10 segundos
});

// Desabilitar polling automático
const featureHub = new FlexiToggleSDK({
  // ... outras configurações
  pollingInterval: 0
});
```

## 🎮 Exemplos Práticos

### E-commerce com A/B Testing
```javascript
// Configurar SDK
const featureHub = new FlexiToggleSDK({
  apiUrl: 'https://api.mystore.com',
  projectKey: 'ecommerce-app',
  environment: 'production',
  userId: getCurrentUserId(),
  userAttributes: {
    plan: getUserPlan(),
    region: getUserRegion(),
    device: getDeviceType()
  }
});

// Aguardar inicialização
featureHub.on('ready', () => {
  // Teste do botão de checkout
  const checkoutVariant = featureHub.getVariant('checkout-button-test');
  
  switch (checkoutVariant) {
    case 'green':
      setCheckoutButtonColor('#28a745');
      break;
    case 'red':
      setCheckoutButtonColor('#dc3545');
      break;
    case 'orange':
      setCheckoutButtonColor('#fd7e14');
      break;
    default:
      setCheckoutButtonColor('#007bff');
  }
  
  // Feature flag para frete grátis
  if (featureHub.isEnabled('free-shipping-banner')) {
    showFreeShippingBanner();
  }
  
  // Configuração dinâmica
  const config = featureHub.getJSON('app-config', {});
  setMaxCartItems(config.maxCartItems || 10);
  setRecommendationsCount(config.recommendationsCount || 4);
});

// Rastrear eventos importantes
function onAddToCart(product) {
  featureHub.track('add-to-cart', {
    productId: product.id,
    price: product.price,
    category: product.category
  });
}

function onPurchase(order) {
  // Rastrear conversão para todos os testes ativos
  featureHub.trackConversion('checkout-button-test', 'purchase', order.total);
  featureHub.trackConversion('free-shipping-test', 'purchase', order.total);
  
  featureHub.track('purchase-completed', {
    orderId: order.id,
    total: order.total,
    items: order.items.length
  });
}
```

### SaaS com Feature Flags por Plano
```javascript
const featureHub = new FlexiToggleSDK({
  apiUrl: 'https://api.mysaas.com',
  projectKey: 'saas-platform',
  environment: 'production',
  userId: user.id,
  userAttributes: {
    plan: user.subscription.plan, // 'free', 'pro', 'enterprise'
    company: user.company.id,
    role: user.role,
    signupDate: user.createdAt
  }
});

featureHub.on('ready', () => {
  // Features por plano
  const advancedAnalytics = featureHub.isEnabled('advanced-analytics');
  const apiAccess = featureHub.isEnabled('api-access');
  const customBranding = featureHub.isEnabled('custom-branding');
  
  // Configurar UI baseado nas features
  if (advancedAnalytics) {
    showAdvancedAnalyticsTab();
  }
  
  if (apiAccess) {
    showAPIDocumentation();
  }
  
  if (customBranding) {
    enableCustomBrandingOptions();
  }
  
  // Limites dinâmicos
  const limits = featureHub.getJSON('user-limits', {});
  setProjectLimit(limits.maxProjects || 1);
  setStorageLimit(limits.maxStorage || '100MB');
});

// Atualizar quando o plano mudar
function onPlanUpgrade(newPlan) {
  featureHub.updateUserAttributes({ plan: newPlan });
  featureHub.track('plan-upgraded', { 
    fromPlan: user.subscription.plan,
    toPlan: newPlan 
  });
}
```

## 🛠️ Debugging

### Logs Detalhados
```javascript
// Habilitar logs detalhados no console
localStorage.setItem('flexitoggle-debug', 'true');

// Verificar estado atual
console.log('Flags atuais:', featureHub.flags);
console.log('SDK inicializado:', featureHub.isInitialized);
```

### Inspeção de Flags
```javascript
// Listar todas as flags
featureHub.on('ready', () => {
  console.table(Array.from(featureHub.flags.entries()));
});

// Verificar targeting
console.log('Atributos do usuário:', featureHub.userAttributes);
console.log('User ID:', featureHub.userId);
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **SDK não inicializa**
   ```javascript
   featureHub.on('error', (error) => {
     console.error('Erro de inicialização:', error);
     // Verificar URL da API, chave do projeto, conectividade
   });
   ```

2. **Flags não atualizando**
   ```javascript
   // Verificar se polling está ativo
   console.log('Polling interval:', featureHub.pollingInterval);
   
   // Forçar atualização
   featureHub.refresh();
   ```

3. **Analytics não funcionando**
   ```javascript
   // Verificar se analytics está habilitado
   console.log('Analytics habilitado:', featureHub.enableAnalytics);
   
   // Verificar se eventos estão sendo enviados
   featureHub.track('test-event', { debug: true });
   ```

## 📚 API Reference

### Métodos Principais

| Método | Descrição | Parâmetros | Retorno |
|--------|-----------|------------|---------|
| `getFlag(key, default)` | Obter valor de flag | `key: string, default: any` | `any` |
| `isEnabled(key)` | Verificar se flag está ativa | `key: string` | `boolean` |
| `getString(key, default)` | Obter string | `key: string, default: string` | `string` |
| `getNumber(key, default)` | Obter número | `key: string, default: number` | `number` |
| `getJSON(key, default)` | Obter objeto JSON | `key: string, default: object` | `object` |
| `getVariant(key, default)` | Obter variante A/B | `key: string, default: string` | `string` |
| `track(event, props)` | Rastrear evento | `event: string, props: object` | `void` |
| `trackConversion(test, metric, value)` | Rastrear conversão | `test: string, metric: string, value: number` | `void` |
| `updateUserAttributes(attrs)` | Atualizar atributos | `attrs: object` | `void` |
| `setUserId(id)` | Definir user ID | `id: string` | `void` |
| `refresh()` | Atualizar flags | - | `Promise` |
| `close()` | Fechar SDK | - | `void` |

### Eventos

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `ready` | SDK inicializado | - |
| `flagsUpdated` | Flags atualizadas | `Map<string, any>` |
| `error` | Erro ocorreu | `Error` |
| `closed` | SDK fechado | - |

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso guia de contribuição para mais detalhes.

## 📞 Suporte

- 📧 Email: support@flexitoggle.com
- 💬 Discord: https://discord.gg/flexitoggle
- 📚 Documentação: https://docs.flexitoggle.com
- 🐛 Issues: https://github.com/flexitoggle/flexitoggle/issues
