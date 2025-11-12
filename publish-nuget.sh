#!/bin/bash

# Script para publicar o FlexiToggle.Sdk no NuGet.org
# Uso: ./publish-nuget.sh YOUR_NUGET_API_KEY

set -e

if [ -z "$1" ]; then
    echo "❌ Erro: API Key do NuGet é obrigatória"
    echo "Uso: ./publish-nuget.sh YOUR_NUGET_API_KEY"
    echo ""
    echo "Para obter sua API Key:"
    echo "1. Acesse https://www.nuget.org/account/apikeys"
    echo "2. Crie uma nova API Key com escopo 'Push new packages and package versions'"
    echo "3. Execute: ./publish-nuget.sh SUA_API_KEY"
    exit 1
fi

API_KEY=$1

echo "🚀 Publicando FlexiToggle.Sdk no NuGet.org..."

# Navegar para o diretório do SDK
cd sdk/dotnet/FlexiToggle.Sdk

# Verificar se o pacote existe
if [ ! -f "nupkg/FlexiToggle.Sdk.1.0.0.nupkg" ]; then
    echo "📦 Pacote não encontrado. Executando build..."
    
    # Limpar e rebuild
    dotnet clean
    rm -rf bin obj nupkg
    
    # Build e pack
    dotnet restore
    dotnet build --configuration Release --no-restore
    dotnet pack --configuration Release --no-build --output ./nupkg
fi

# Listar pacotes
echo "📋 Pacotes encontrados:"
ls -la nupkg/

# Publicar no NuGet
echo "🚀 Publicando no NuGet.org..."
dotnet nuget push ./nupkg/*.nupkg \
    --api-key "$API_KEY" \
    --source https://api.nuget.org/v3/index.json \
    --skip-duplicate

echo ""
echo "✅ Publicação concluída!"
echo ""
echo "🔗 Seu pacote estará disponível em:"
echo "   https://www.nuget.org/packages/FlexiToggle.Sdk/"
echo ""
echo "📦 Para usar em projetos .NET:"
echo "   dotnet add package FlexiToggle.Sdk"
echo ""
echo "⏰ Nota: Pode levar alguns minutos para aparecer na busca do NuGet"
