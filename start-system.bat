@echo off
cd /d "C:\Users\ASUS\OneDrive\Escritorio\Proyecto-transporte"
:: Esperar 5 segundos para asegurar que la base de datos y otros servicios del sistema estén listos
ping 127.0.0.1 -n 6 > NUL
:: Compilar el backend
call pnpm --filter @u-ride/backend build
:: Compilar el frontend (opcional pero recomendado para mantener todo al día)
call pnpm --filter @u-ride/frontend build
:: Iniciar las aplicaciones en segundo plano usando PM2
call npx pm2 start ecosystem.config.js
:: Guardar la lista de procesos de PM2
call npx pm2 save
