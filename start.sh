#!/bin/bash

echo "🚀 Iniciando FlexiToggle (com limpeza completa)..."

# ========================================
# LIMPEZA COMPLETA - SEMPRE EXECUTADA
# ========================================

echo "🧹 Limpando ambiente anterior..."

# 1. Parar todos os processos relacionados
echo "🛑 Parando processos anteriores..."
pkill -f "dotnet.*FlexiToggle" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 2. Parar Docker containers
echo "🐳 Parando Docker containers..."
docker-compose down -v 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true

# 3. Liberar portas específicas
echo "🔌 Liberando portas 5000 e 3000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 4. Limpar cache do .NET
echo "🗑️ Limpando cache do .NET..."
if command -v dotnet &> /dev/null; then
    cd backend/FlexiToggle.Api 2>/dev/null || true
    dotnet clean 2>/dev/null || true
    rm -rf bin obj 2>/dev/null || true
    cd ../.. 2>/dev/null || true
fi

# 5. Limpar cache do Node.js
echo "🗑️ Limpando cache do Node.js..."
if command -v npm &> /dev/null; then
    cd frontend 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    cd .. 2>/dev/null || true
fi

# 6. Limpar logs anteriores
echo "📝 Limpando logs anteriores..."
rm -f backend/FlexiToggle.Api/backend.log 2>/dev/null || true
rm -f frontend/frontend.log 2>/dev/null || true

# 7. Aguardar um pouco para garantir que tudo foi limpo
echo "⏳ Aguardando limpeza completa..."
sleep 3

echo "✅ Limpeza concluída! Iniciando serviços..."

# ========================================
# FUNÇÃO AUXILIAR
# ========================================

# Função para verificar se um serviço está rodando
check_service() {
    local url=$1
    local name=$2
    echo "Verificando $name..."
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name está rodando!"
        return 0
    else
        echo "❌ $name não está respondendo"
        return 1
    fi
}

# ========================================
# OPÇÃO 1: DOCKER COMPOSE
# ========================================

echo "📦 Tentando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose encontrado. Iniciando serviços..."
    
    # Build e start com força total
    if docker-compose up --build --force-recreate -d; then
        echo "Aguardando serviços Docker iniciarem..."
        sleep 20
        
        # Verificar se os serviços estão respondendo
        for i in {1..10}; do
            if check_service "http://localhost:5000/health" "Backend"; then
                if check_service "http://localhost:3000" "Frontend"; then
                    echo ""
                    echo "🎉 FlexiToggle iniciado com Docker!"
                    echo "📱 Frontend: http://localhost:3000"
                    echo "🔧 Backend: http://localhost:5000"
                    echo "📚 Swagger: http://localhost:5000/swagger"
                    echo "🧪 Health: http://localhost:5000/health"
                    echo ""
                    echo "Para parar os serviços:"
                    echo "docker-compose down"
                    echo ""
                    echo "Para ver logs:"
                    echo "docker-compose logs -f backend"
                    echo "docker-compose logs -f frontend"
                    exit 0
                fi
            fi
            echo "Tentativa $i/10 - Aguardando serviços..."
            sleep 5
        done
    fi
    
    echo "⚠️ Docker Compose falhou, tentando execução local..."
    docker-compose down -v 2>/dev/null || true
else
    echo "Docker Compose não encontrado, tentando execução local..."
fi

# ========================================
# OPÇÃO 2: EXECUÇÃO LOCAL
# ========================================

echo "🏠 Iniciando execução local..."

# Verificar dependências
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK não encontrado. Instale o .NET 8 SDK."
    echo "   Download: https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

echo "✅ Dependências encontradas!"

# ========================================
# INICIAR BACKEND
# ========================================

echo "🔧 Preparando backend..."
cd backend/FlexiToggle.Api

# Restore com força
echo "📦 Restaurando pacotes do backend..."
dotnet restore --force

# Build limpo
echo "🔨 Compilando backend..."
dotnet build --no-restore

# Iniciar backend
echo "🚀 Iniciando backend..."
if dotnet run --urls "http://localhost:5000" &> ../../backend.log & then
    BACKEND_PID=$!
    echo "Backend iniciado (PID: $BACKEND_PID)"
    cd ../..
else
    echo "❌ Falha ao iniciar backend"
    cd ../..
    exit 1
fi

# Aguardar backend iniciar com timeout maior
echo "⏳ Aguardando backend inicializar..."
for i in {1..30}; do
    if check_service "http://localhost:5000/health" "Backend"; then
        echo "✅ Backend pronto!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: Backend não iniciou em 60 segundos"
        echo "Logs do backend:"
        tail -20 backend.log 2>/dev/null || echo "Nenhum log encontrado"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    echo "Tentativa $i/30..."
    sleep 2
done

# ========================================
# INICIAR FRONTEND
# ========================================

echo "📱 Preparando frontend..."
cd frontend

# Instalar/atualizar dependências sempre
echo "📦 Instalando dependências do frontend..."
npm install --legacy-peer-deps --force

# Limpar cache do Vite
echo "🗑️ Limpando cache do Vite..."
rm -rf node_modules/.vite 2>/dev/null || true

# Iniciar frontend
echo "🚀 Iniciando frontend..."
if npm run dev &> ../frontend.log & then
    FRONTEND_PID=$!
    echo "Frontend iniciado (PID: $FRONTEND_PID)"
    cd ..
else
    echo "❌ Falha ao iniciar frontend"
    kill $BACKEND_PID 2>/dev/null
    cd ..
    exit 1
fi

# Aguardar frontend iniciar
echo "⏳ Aguardando frontend inicializar..."
for i in {1..20}; do
    if check_service "http://localhost:3000" "Frontend"; then
        echo "✅ Frontend pronto!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "❌ Timeout: Frontend não iniciou em 40 segundos"
        echo "Logs do frontend:"
        tail -20 frontend.log 2>/dev/null || echo "Nenhum log encontrado"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    echo "Tentativa $i/20..."
    sleep 2
done

# ========================================
# SUCESSO!
# ========================================

echo ""
echo "🎉 FlexiToggle iniciado com sucesso!"
echo ""
echo "📍 URLs de Acesso:"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📚 Swagger: http://localhost:5000/swagger"
echo "🧪 Health: http://localhost:5000/health"
echo ""
echo "🔐 Credenciais de Login:"
echo "Email: admin@featurehub.com"
echo "Senha: FlexiToggle123!"
echo ""
echo "🛠️ Comandos Úteis:"
echo "Para parar os serviços:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Para ver logs em tempo real:"
echo "tail -f backend.log"
echo "tail -f frontend.log"
echo ""
echo "Para testar tudo:"
echo "./test-e2e.sh"
echo ""
echo "🎯 Pronto para demonstração!"