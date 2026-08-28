#!/usr/bin/env bash
set -euo pipefail

echo "PlaneoFUT — entorno independiente"

command -v node >/dev/null || { echo "Node.js es obligatorio"; exit 1; }
command -v npm >/dev/null || { echo "npm es obligatorio"; exit 1; }

if ! command -v supabase >/dev/null; then
  echo "Supabase CLI no está instalado. Instálalo desde la documentación oficial antes de continuar."
  exit 1
fi

npm install
echo "Ejecuta 'supabase start' en otra terminal si quieres usar la base local."
npm run dev
