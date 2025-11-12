#!/bin/bash

echo "🛑 DERRUBANDO TUDO - LIMPEZA COMPLETA"
echo "===================================="

# 1. Matar todos os processos relacionados ao projeto
echo "1️⃣ Matando processos do projeto..."
pkill -f "dotnet.*FlexiToggle" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true  
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Matar processos nas portas específicas
echo "2️⃣ Liberando portas 5000 e 5173..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 3. Parar Docker completamente
echo "3️⃣ Parando Docker..."
docker-compose down -v --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# 4. Limpar builds e caches
echo "4️⃣ Limpando builds e caches..."
rm -rf backend/FlexiToggle.Api/bin 2>/dev/null || true
rm -rf backend/FlexiToggle.Api/obj 2>/dev/null || true
rm -rf frontend/node_modules/.vite 2>/dev/null || true
rm -rf frontend/dist 2>/dev/null || true

# 5. Limpar logs
echo "5️⃣ Limpando logs..."
find . -name "*.log" -delete 2>/dev/null || true

# 6. Verificar portas
echo "6️⃣ Verificando portas..."
PORT_5000=$(lsof -ti:5000 2>/dev/null | wc -l)
PORT_5173=$(lsof -ti:5173 2>/dev/null | wc -l)

if [ $PORT_5000 -eq 0 ] && [ $PORT_5173 -eq 0 ]; then
    echo "✅ PORTAS LIVRES!"
else
    echo "⚠️  Algumas portas ainda ocupadas:"
    echo "Porta 5000: $PORT_5000 processos"
    echo "Porta 5173: $PORT_5173 processos"
fi

echo ""
echo "🧹 LIMPEZA COMPLETA FINALIZADA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Para iniciar tudo limpo: ./start.sh"
echo "2. Ou iniciar manualmente:"
echo "   Backend:  cd backend/FlexiToggle.Api && dotnet run --urls http://localhost:5000"
echo "   Frontend: cd frontend && npm run dev"
