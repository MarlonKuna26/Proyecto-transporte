# Jenkins Pipeline - Fixes for DB Connection & Coverage Issues

## Problem Summary
El pipeline de Jenkins fallaba con `connect ECONNREFUSED 127.0.0.1:5434` y no mostraba coverage (N/A).

### Causas Identificadas
1. **Unit Tests ejecutándose ANTES de levantar Docker** → BD no disponible
2. **Archivo `jest.unit.setup.js` faltante** → Variables de entorno no configuradas
3. **Red Docker marcada como `external: true`** → Fallaba al crear la red
4. **Coverage reporters no configurados para Cobertura XML** → Jenkins no puede leer reportes
5. **Sin publicación de reportes en el post block** → Coverage aparece como N/A

## Changes Made

### 1️⃣ Creado `packages/backend/jest.unit.setup.js`
```javascript
// Configura variables de entorno para Unit Tests
// Sin conectar a BD real - deben usar mocks
```
**Por qué:** El archivo faltaba pero se referenciaba en `jest.unit.config.js`, causando que las variables de entorno no se configuren correctamente.

### 2️⃣ Actualizado `docker-compose.deploy.yml`
**Cambio:**
```yaml
# Antes
networks:
  u-ride-network:
    external: true
    name: proyecto-transporte_u-ride-network

# Después
networks:
  u-ride-network:
    driver: bridge
```
**Por qué:** La red externa no se crea automáticamente en Jenkins. Ahora Docker crea la red automáticamente.

### 3️⃣ Reorganizado `Jenkinsfile` - Stages Reordenados
**Antes:**
```
1. Checkout
2. Install dependencies
3. Unit Tests ❌ (Falla: BD no existe)
4. Build Docker
5. Deploy
6. Health Check
7. Integration Tests
8. E2E Tests
```

**Después:**
```
1. Checkout
2. Install dependencies
3. Build Docker
4. Deploy Services
5. Health Check ✅ (BD ya está lista)
6. Unit Tests ✅ (BD disponible si es necesario)
7. Integration Tests
8. E2E Tests
```

**Por qué:** Los Unit Tests ahora se ejecutan después de que Docker está levantado y la BD está saludable.

### 4️⃣ Actualizado Coverage Reporters
**Archivos modificados:**
- `packages/backend/jest.unit.config.js`
- `packages/backend/jest.integration.config.js`

**Cambio:**
```javascript
// Antes
coverageReporters: ['lcov', 'text', 'clover']

// Después
coverageReporters: ['lcov', 'text', 'clover', 'cobertura']
```
**Por qué:** Agregamos formato Cobertura XML que Jenkins puede leer nativamente.

### 5️⃣ Agregada Publicación de Coverage en Jenkinsfile
```groovy
post {
  always {
    // Archiva reportes de coverage
    archiveArtifacts artifacts: '**/coverage/**,**/test-results/**'
    
    // Publica reporte HTML en Jenkins
    publishHTML([
      reportDir: 'packages/backend/coverage/lcov-report',
      reportFiles: 'index.html',
      reportName: 'Coverage Report'
    ])
  }
}
```
**Por qué:** Sin publicación, Jenkins no puede mostrar los reportes de coverage y aparece N/A.

---

## Configuración de Jenkins (UI)

Para que la cobertura de Cobertura XML se muestre, necesitas:

### Opción A: Usar Plugin Cobertura (Recomendado)
1. **Instalar** plugin "Cobertura Plugin" en Jenkins
2. **En el Job → Configure:**
   - **Post-build Actions** → Add post-build action
   - Seleccionar **"Publish Cobertura Coverage Report"**
   - Coberturaxml pattern: `**/cobertura-coverage.xml`

### Opción B: Usar Plugin Coverage (Más moderno)
1. **Instalar** plugin "Coverage"
2. **En el Job → Configure:**
   - **Post-build Actions** → Add post-build action
   - Seleccionar **"Publish Coverage Report"**
   - Patterns: `**/cobertura-coverage.xml`

---

## Verificar Localmente

### Ejecutar tests unit:
```bash
# Con variables de entorno
export DB_HOST=localhost
export DB_PORT=5434
export DB_USER=postgres
export DB_PASSWORD=182004
export DB_NAME=u_ride_esp

pnpm -r run test:unit
```

### Verificar que se generan reportes:
```bash
# Buscar archivos de coverage
find . -name "cobertura-coverage.xml" -print
find . -name "lcov.info" -print

# Verificar carpeta
ls -la packages/backend/coverage/
```

### Ver reporte HTML localmente:
```bash
# Abrir en navegador
open packages/backend/coverage/lcov-report/index.html
# o en Windows
start packages/backend/coverage/lcov-report/index.html
```

---

## Troubleshooting

### ❌ "connect ECONNREFUSED 127.0.0.1:5434"
- ✅ **Solución aplicada:** Reorganizar stages para que BD esté lista antes de Unit Tests

### ❌ Coverage appears "N/A" in Jenkins
- ✅ **Solución aplicada:** 
  - Agregar 'cobertura' a coverageReporters
  - Publicar reportes con archiveArtifacts
  - Configurar plugin en Jenkins UI

### ❌ Unit Tests still failing
- Verificar que `jest.unit.setup.js` existe
- Verificar que los tests usan MOCKS y no conectan a BD real
- Revisar logs: `docker compose -f docker-compose.deploy.yml logs -f u-ride-backend`

### ❌ Docker network issues
- Limpiar redes huérfanas: `docker network prune`
- Recrear services: `docker compose -f docker-compose.deploy.yml down && docker compose -f docker-compose.deploy.yml up -d`

---

## Files Modified
- ✅ `Jenkinsfile` - Reorganizado stages y agregada publicación de coverage
- ✅ `docker-compose.deploy.yml` - Arreglada configuración de red
- ✅ `packages/backend/jest.unit.setup.js` - **CREADO** (faltaba)
- ✅ `packages/backend/jest.unit.config.js` - Agregado setupFiles y cobertura
- ✅ `packages/backend/jest.integration.config.js` - Agregada cobertura

---

## Next Steps
1. Ejecuta la pipeline en Jenkins nuevamente
2. Verifica que Unit Tests pasen (con BD disponible)
3. Configura el plugin de Cobertura en Jenkins UI (ver "Configuración de Jenkins" arriba)
4. Haz commit de los cambios:
   ```bash
   git add Jenkinsfile docker-compose.deploy.yml packages/backend/jest*.* 
   git commit -m "fix: Jenkins pipeline - fix DB connection timing and coverage reporting"
   ```

