#!/bin/bash

# Script para build e publicação do pacote NuGet FlexiToggle.Sdk

set -e

echo "🚀 Iniciando build do FlexiToggle.Sdk para NuGet..."

# Navegar para o diretório do SDK
cd sdk/dotnet/FlexiToggle.Sdk

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
dotnet clean
rm -rf bin obj nupkg

# Restaurar dependências
echo "📦 Restaurando dependências..."
dotnet restore

# Build em modo Release
echo "🔨 Compilando em modo Release..."
dotnet build --configuration Release --no-restore

# Executar testes (se houver)
echo "🧪 Executando testes..."
# dotnet test --configuration Release --no-build

# Criar pacote NuGet
echo "📦 Criando pacote NuGet..."
dotnet pack --configuration Release --no-build --output ./nupkg

# Listar pacotes criados
echo "✅ Pacotes criados:"
ls -la nupkg/

echo ""
echo "🎉 Build concluído com sucesso!"
echo ""
echo "Para publicar no NuGet.org, execute:"
echo "dotnet nuget push ./nupkg/*.nupkg --api-key YOUR_API_KEY --source https://api.nuget.org/v3/index.json"
echo ""
echo "Para testar localmente, adicione a referência:"
echo "dotnet add package FlexiToggle.Sdk --source ./nupkg"
