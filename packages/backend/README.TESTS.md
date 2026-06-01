Instrucciones para ejecutar pruebas (unitarias e integración)

1) Instalar dependencias (desde la raíz del monorepo):

   pnpm install

2) Preparar variables de entorno de pruebas:

   - Copiar `.env.test.example` a `.env.test` en `packages/backend` y ajustar `DATABASE_URL`.

3) Base de datos de pruebas:

   - Si usas `docker-compose` en la raíz, levanta el servicio de DB: `docker-compose up -d`.
   - Cargar datos de prueba (semillas ficticias):

     cd packages/backend
     pnpm run seed:data

4) Ejecutar pruebas:

   - Unitarias: `pnpm --filter @u-ride/backend run test:unit`  (o desde `packages/backend`: `npm run test:unit`)
   - Integración: `pnpm --filter @u-ride/backend run test:integration` (asegúrate que la DB y el servidor estén disponibles)
   - Ejecutar ambas: `npm test` desde `packages/backend`.

5) Ubicación de tests:

   - Tests unitarios: `packages/backend/tests/unit`
   - Tests de integración: `packages/backend/tests/integration`

Notas:

- Los archivos de ejemplo de test (`.test.ts`) han sido creados vacíos. Añade contenido según los casos de prueba especificados.
- Si necesitas que las pruebas de integración levanten el servidor automáticamente, podemos añadir un `globalSetup` y `globalTeardown` en la configuración de Jest.
