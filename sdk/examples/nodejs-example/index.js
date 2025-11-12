const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar o SDK do FlexiToggle
const FlexiToggleSDK = require('../../javascript/flexitoggle-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar FlexiToggle SDK
const featureHub = new FlexiToggleSDK({
  apiUrl: process.env.FEATUREHUB_API_URL || 'http://localhost:5000',
  projectKey: process.env.FEATUREHUB_PROJECT_KEY || 'demo-project',
  environment: process.env.FEATUREHUB_ENVIRONMENT || 'production',
  userId: 'demo-user-123',
  userAttributes: {
    email: 'demo@example.com',
    plan: 'premium',
    country: 'BR'
  },
  enableAnalytics: true,
  pollingInterval: 30000 // 30 segundos
});

// Aguardar inicialização do SDK
featureHub.on('ready', () => {
  console.log('✅ FlexiToggle SDK inicializado com sucesso!');
});

featureHub.on('error', (error) => {
  console.error('❌ Erro no FlexiToggle SDK:', error);
});

featureHub.on('flagsUpdated', (flags) => {
  console.log('🔄 Flags atualizadas:', flags.size, 'flags carregadas');
});

// Rotas da aplicação
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obter status das feature flags
app.get('/api/features', async (req, res) => {
  try {
    const features = {
      // Flags booleanas
      darkMode: featureHub.isEnabled('dark-mode'),
      newCheckout: featureHub.isEnabled('new-checkout'),
      premiumFeatures: featureHub.isEnabled('premium-features'),
      
      // Flags de string
      welcomeMessage: featureHub.getString('welcome-message', 'Bem-vindo!'),
      theme: featureHub.getString('theme', 'light'),
      
      // Flags numéricas
      maxItems: featureHub.getNumber('max-items', 10),
      discountPercent: featureHub.getNumber('discount-percent', 0),
      
      // Flags JSON
      config: featureHub.getJSON('app-config', {
        timeout: 5000,
        retries: 3
      }),
      
      // A/B Testing
      checkoutVariant: featureHub.getVariant('checkout-test', 'control')
    };

    res.json({
      success: true,
      features,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter features:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// API para simular eventos de conversão
app.post('/api/track-conversion', (req, res) => {
  const { event, value = 1 } = req.body;
  
  try {
    // Trackear evento customizado
    featureHub.track(event, {
      value,
      page: req.headers.referer || 'unknown',
      userAgent: req.headers['user-agent']
    });

    // Se for um teste A/B, trackear conversão
    if (event === 'purchase') {
      featureHub.trackConversion('checkout-test', 'purchase', value);
    }

    res.json({
      success: true,
      message: 'Evento registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar evento'
    });
  }
});

// API para atualizar atributos do usuário
app.post('/api/update-user', (req, res) => {
  const { userId, attributes } = req.body;
  
  try {
    if (userId) {
      featureHub.setUserId(userId);
    }
    
    if (attributes) {
      featureHub.updateUserAttributes(attributes);
    }

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuário'
    });
  }
});

// API para forçar atualização das flags
app.post('/api/refresh-flags', async (req, res) => {
  try {
    await featureHub.refresh();
    res.json({
      success: true,
      message: 'Flags atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar flags:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar flags'
    });
  }
});

// Middleware de exemplo usando feature flags
app.use('/premium', (req, res, next) => {
  if (featureHub.isEnabled('premium-features')) {
    next();
  } else {
    res.status(403).json({
      error: 'Recursos premium não disponíveis',
      upgradeUrl: '/upgrade'
    });
  }
});

app.get('/premium/dashboard', (req, res) => {
  res.json({
    message: 'Bem-vindo ao dashboard premium!',
    features: ['Analytics avançado', 'Relatórios customizados', 'Suporte prioritário']
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API Features: http://localhost:${PORT}/api/features`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Encerrando aplicação...');
  featureHub.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando aplicação...');
  featureHub.close();
  process.exit(0);
});
