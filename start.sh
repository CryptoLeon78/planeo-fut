#!/bin/bash

# PlaneoFUT - Start Script
# This script starts both the Supabase local development server and the PlaneoFUT application

set -e

echo "🚀 PlaneoFUT - Iniciando servidor y aplicación..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js primero."
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "⚠️  Bun no está instalado. Instalando Bun..."
    curl -fsSL https://bun.sh/install | bash
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI no está instalado. Instalando..."
    npm install -g supabase
fi

echo "📦 Instalando dependencias..."
bun install

echo ""
echo "🗄️  Iniciando Supabase local..."
echo "   (En otra terminal, ejecuta: supabase start)"
echo ""

echo "🎯 Iniciando PlaneoFUT en desarrollo..."
echo "   La aplicación estará disponible en: http://localhost:5173"
echo ""

# Start the development server
bun dev

