#!/bin/bash

# 🚀 U-Ride Setup Script
# Este script configura todo automáticamente para que puedas desarrollar localmente

set -e  # Salir si hay error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🚗 U-RIDE Setup - Configuración Inicial            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que PostgreSQL esté corriendo
echo "🔍 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado o no está en el PATH"
    echo "   Por favor, instala PostgreSQL 14+ desde: https://www.postgresql.org/download/"
    exit 1
fi

# Verificar conexión a PostgreSQL
if ! PGPASSWORD=182004 psql -U postgres -h localhost -c "SELECT 1" &>/dev/null; then
    echo "❌ No se puede conectar a PostgreSQL"
    echo "   Verifica que esté corriendo en localhost:5432"
    echo "   Usuario: postgres | Contraseña: 182004"
    exit 1
fi

echo "✅ PostgreSQL detectado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias con pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm no está instalado. Instalando..."
    npm install -g pnpm
fi

pnpm install
echo "✅ Dependencias instaladas"
echo ""

# Crear base de datos
echo "🗄️  Creando base de datos u_ride_dev..."
PGPASSWORD=182004 psql -U postgres -f init.sql > /dev/null 2>&1
echo "✅ Base de datos creada"
echo ""

# Compilar backend
echo "🔨 Compilando backend..."
pnpm -F @u-ride/backend build > /dev/null 2>&1
echo "✅ Backend compilado"
echo ""

# Compilar frontend
echo "🔨 Compilando frontend..."
pnpm -F @u-ride/frontend build > /dev/null 2>&1
echo "✅ Frontend compilado"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETO                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Todo listo para desarrollar!"
echo ""
echo "📝 Para ejecutar el proyecto:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ pnpm -F @u-ride/backend dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ pnpm -F @u-ride/frontend dev"
echo ""
echo "🌐 Abre el navegador en:"
echo "   http://localhost:5173"
echo ""
echo "🔐 Credenciales de prueba:"
echo "   Email: test@institucion.edu"
echo "   Contraseña: password123"
echo ""
echo "📚 Más información en: README.md"
echo ""
