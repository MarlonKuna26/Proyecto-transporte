# Pipeline Jenkins + Docker para PROYECTO-TRANSPORTE

Este proyecto queda preparado para desplegar la aplicacion en un entorno controlado con Docker Compose desde Jenkins.

## Archivos agregados

- `Jenkinsfile`: pipeline declarativo para construir imagenes Docker, desplegar contenedores y validar el backend.
- `docker-compose.deploy.yml`: entorno controlado con PostgreSQL, backend y frontend.
- `packages/backend/Dockerfile`: imagen productiva del backend Node.js/Express.
- `packages/frontend/Dockerfile`: build del frontend React/Vite y publicacion con Nginx.
- `packages/frontend/nginx.conf`: configuracion para servir la SPA.

## Requisitos en el servidor Jenkins

- Jenkins con acceso al repositorio.
- Docker instalado y ejecutandose.
- Docker Compose v2 disponible con `docker compose`.
- El usuario/agente de Jenkins debe tener permisos para ejecutar Docker.

## Ejecucion local equivalente

```bash
docker compose -f docker-compose.deploy.yml build
docker compose -f docker-compose.deploy.yml up -d
docker compose -f docker-compose.deploy.yml ps
```

La aplicacion queda disponible en:

- Frontend: `http://localhost:8080`
- Backend health check: `http://localhost:3002/health`
- Base de datos PostgreSQL: `localhost:5433`

## Variables principales

Puedes configurarlas como variables de entorno en Jenkins:

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `VITE_API_URL`
- `FRONTEND_PORT`
- `BACKEND_PORT`
- `DB_PORT_HOST`

## Flujo del pipeline

1. Jenkins descarga el codigo fuente.
2. Docker construye la imagen del backend.
3. Docker construye la imagen del frontend.
4. Docker Compose levanta PostgreSQL, backend y frontend.
5. Jenkins valida `http://localhost:3002/health`.

Si falla el despliegue, el pipeline imprime el estado y logs de los contenedores.
