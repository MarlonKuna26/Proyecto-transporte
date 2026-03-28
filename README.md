# 🚗 U-Ride - Sistema de Viajes Compartidos Universitario

**U-Ride** es una plataforma web que permite a estudiantes de una institución educativa coordinar viajes compartidos de manera segura y verificada.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Guía de Desarrollo](#guía-de-desarrollo)
- [Credenciales de Prueba](#credenciales-de-prueba)
- [Próximos Pasos](#próximos-pasos)

---

## ✨ Características

### Usuarios
- ✅ Registro y login con correo institucional verificado
- ✅ Sistema de reputación (calificaciones)
- ✅ Tres roles: Pasajero, Conductor, Administrador

### Core del Negocio
- ✅ Publicación de viajes por zonas
- ✅ Filtrado de viajes disponibles
- ✅ Gestión de solicitudes (aceptar/rechazar pasajeros)
- ✅ Confirmación de viajes
- 🔄 Procesamiento de pagos (futuro)

### Seguridad
- ✅ Autenticación JWT
- ✅ Tokens de acceso y refresco
- ✅ Middleware de autorización
- ✅ Auditoría de todas las acciones

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **Vite** - Build tool
- **React Router** - Routing

### Backend
- **Node.js** - Runtime
- **Express.js** - API framework
- **TypeScript** - Type safety
- **JWT** - Autenticación
- **PostgreSQL** - Base de datos

### Infraestructura
- **Docker** - Containerización
- **Docker Compose** - Orquestación
- **pnpm** - Package manager (monorepo)

### Testing (Preparado)
- **Jest** - Unit tests
- **Supertest** - API tests
- **Cypress** - E2E tests
- **Apache JMeter** - Performance tests

---

## 📦 Requisitos

- **Node.js** v18+ (verificar con `node --version`)
- **pnpm** v8+ (instalar con `npm install -g pnpm`)
- **PostgreSQL** 14+ (debe estar corriendo localmente)
- **Git** para clonar el repositorio

---

## 🚀 Instalación y Setup Rápido

### ⚡ La forma más fácil (Recomendado)

**Solo 3 comandos y listo:**

```bash
# 1. Clonar el repositorio
git clone https://github.com/MarlonKuna26/Proyecto-transporte.git
cd Proyecto-transporte

# 2. Ejecutar script de setup (instala todo automáticamente)
bash setup.sh

# 3. Listo! Ya puedes desarrollar 🎉
```

El script hace automáticamente:
- ✅ Instala todas las dependencias con pnpm
- ✅ Crea la base de datos PostgreSQL
- ✅ Compila el código TypeScript
- ✅ Te da instrucciones para ejecutar

---

### Manual (Si prefieres hacerlo paso a paso)

#### 1. Clonar el repositorio

```bash
git clone https://github.com/MarlonKuna26/Proyecto-transporte.git
cd Proyecto-transporte
```

#### 2. Instalar dependencias

```bash
pnpm install
```

#### 3. Crear la base de datos

```bash
PGPASSWORD=182004 psql -U postgres -f init.sql
```

---

## ⚡ Cómo Ejecutar

Después de ejecutar `bash setup.sh`, abre **dos terminales separadas**:

### Terminal 1: Backend

```bash
pnpm -F @u-ride/backend dev
```

Espera a ver:
```
🚀 Server running on http://localhost:3002
✅ Database connected successfully
```

### Terminal 2: Frontend

```bash
pnpm -F @u-ride/frontend dev
```

Espera a ver:
```
VITE v5.4.21 ... http://localhost:5173
```

### 3. Abre el navegador

```
http://localhost:5173
```

**↓ Deberías ver:**
- Página de login
- Campo de email y contraseña
- Botón "Inicia Sesión"

---

## 🔐 Inicia Sesión

### Credenciales de prueba

```
Email: test@institucion.edu
Contraseña: password123
```

**Después de iniciar sesión:**
- ✅ Automáticamente redirige al dashboard
- ✅ Muestra tu nombre y rol (Estudiante)
- ✅ Botón "Cerrar Sesión" (rojo en la esquina superior derecha)
- ✅ 3 opciones: Buscar Viajes, Publicar Viaje, Mis Viajes

---

## 📁 Estructura del Proyecto

```
u-ride/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts                 # Entry point
│   │   │   ├── app.ts                  # Configuración Express
│   │   │   ├── config/                 # BD, logger, etc
│   │   │   ├── modules/
│   │   │   │   └── auth/               # Módulo de autenticación
│   │   │   │       ├── domain/         # Entidades e interfaces
│   │   │   │       ├── application/    # DTOs y UseCases
│   │   │   │       ├── infrastructure/ # Controllers y Repositories
│   │   │   │       └── auth.routes.ts  # Rutas
│   │   │   └── shared/
│   │   │       ├── errors/             # Errores personalizados
│   │   │       ├── services/           # JWT, Password, etc
│   │   │       ├── middlewares/        # Auth, CORS, etc
│   │   │       └── types/              # Interfaces globales
│   │   └── .env                        # Variables de entorno
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.tsx                 # Router principal
│   │   │   ├── main.tsx                # Entry point
│   │   │   ├── components/             # Componentes reutilizables
│   │   │   ├── pages/                  # Páginas (Login, Dashboard)
│   │   │   ├── services/               # Servicios (API calls)
│   │   │   ├── hooks/                  # Custom hooks
│   │   │   └── types/                  # Tipos TypeScript
│   │   └── vite.config.ts
│   │
│   └── shared/
│       ├── src/
│       │   ├── types/                  # Tipos compartidos
│       │   ├── constants/              # Constantes
│       │   └── utils/                  # Utilidades
│       └── package.json
│
├── init.sql                            # Script inicialización BD
├── .env                                # Variables de entorno
├── package.json                        # Root workspace
├── pnpm-workspace.yaml                 # Configuración monorepo
├── tsconfig.base.json                  # TypeScript base config
└── README.md                           # Este archivo
```

---

## 🏗️ Arquitectura

### Clean Architecture (Backend)

El backend sigue **Clean Architecture** con separación de capas:

```
┌─────────────────────────────────────────┐
│          HTTP / Express                 │  ← Controllers
├─────────────────────────────────────────┤
│     Application / UseCases              │  ← Lógica de negocio
├─────────────────────────────────────────┤
│     Domain / Entities & Interfaces      │  ← Reglas de negocio
├─────────────────────────────────────────┤
│   Infrastructure / Repositories & DB    │  ← Datos
└─────────────────────────────────────────┘
```

**Beneficios:**
- ✅ Fácil de testear
- ✅ Independiente del framework
- ✅ Escalable
- ✅ Mantenible

### Dependency Injection

Todas las dependencias se inyectan en los constructores:

```typescript
// Ejemplo: LoginUseCase recibe IUserRepository
const userRepository = new UserRepository();
const loginUseCase = new LoginUseCase(userRepository);
```

---

## 💻 Guía de Desarrollo

### Agregar una nueva ruta en el backend

**1. Crear el UseCase** (`modules/auth/application/usecases/MyUseCase.ts`):

```typescript
import { IUseCase } from '@shared/types';

export class MyUseCase implements IUseCase<InputDTO, OutputDTO> {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: InputDTO): Promise<OutputDTO> {
    // Tu lógica aquí
  }
}
```

**2. Crear el Controller** (`modules/auth/infrastructure/controllers/MyController.ts`):

```typescript
export class MyController {
  constructor(private myUseCase: MyUseCase) {}

  async myMethod(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.myUseCase.execute(dto);
      res.json({ success: true, data: result });
    } catch (error) {
      // Manejo de error
    }
  }
}
```

**3. Registrar la ruta** (`modules/auth/auth.routes.ts`):

```typescript
router.post('/my-endpoint', (req, res) =>
  myController.myMethod(req, res)
);
```

### Hot Reload Automático

**Backend:** Los cambios en TypeScript se recompilan automáticamente y reinician el servidor.

**Frontend:** Vite hace hot reload sin recargar la página.

---

## 🧪 Credenciales de Prueba

### Usuario por defecto (Automáticamente creado después de `bash setup.sh`)

```
Email: test@institucion.edu
Contraseña: password123
Rol: STUDENT (Estudiante)
Verificado: ✅ Sí
```

**Este usuario ya está en la BD gracias al script `setup.sh`.**

Para crear más usuarios en el futuro, usaremos el endpoint de registro (proximamente).

---

## 🔄 Flujo de Autenticación

### 1. Login
```bash
POST http://localhost:3002/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@institucion.edu",
  "password": "password123"
}

# Response
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "550e8400...",
    "email": "test@institucion.edu",
    "name": "Usuario Test",
    "role": "STUDENT"
  }
}
```

### 2. Acceder a ruta protegida
```bash
GET http://localhost:3002/api/v1/auth/me
Authorization: Bearer eyJhbGc...
```

### 3. Refrescar token
```bash
POST http://localhost:3002/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

---

## 🌳 Endpoints Disponibles

### Autenticación (Públicos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/refresh` | Refrescar token |

### Autenticación (Protegidos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/auth/me` | Obtener usuario actual |
| POST | `/api/v1/auth/logout` | Cerrar sesión |

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Verificar estado del servidor |

---

## 🚀 Próximos Pasos

### PASO 2: Módulo de Usuarios
- [ ] Registro de nuevos usuarios
- [ ] Verificación de email
- [ ] Perfil de usuario
- [ ] Actualizar información

### PASO 3: Módulo de Viajes
- [ ] Crear viaje (POST)
- [ ] Listar viajes (GET)
- [ ] Filtrado por zona y horario
- [ ] Actualizar viaje (PUT)
- [ ] Eliminar viaje (DELETE)

### PASO 4: Módulo de Solicitudes
- [ ] Enviar solicitud de pasajero
- [ ] Aceptar/Rechazar solicitud
- [ ] Listar solicitudes pendientes
- [ ] Confirmar viaje

### PASO 5: Sistema de Reputación
- [ ] Calificar usuario
- [ ] Historial de calificaciones
- [ ] Banear usuarios con baja reputación

### PASO 6: Pagos (Futuro)
- [ ] Integrar Stripe/PayPal
- [ ] Procesamiento de transacciones
- [ ] Historial de pagos

---

## 🐛 Troubleshooting

### "Port 3002 already in use"

El comando dev ya lo arregla automáticamente gracias a `kill-port`, pero si persiste:

```bash
pnpm -F @u-ride/backend dev
```

### "Cannot connect to database"

```bash
# Verificar que PostgreSQL esté corriendo
psql -U postgres -c "SELECT 1"

# Verificar credenciales en .env
PGPASSWORD=182004 psql -U postgres -d u_ride_dev

# Si no existe la BD, crear:
PGPASSWORD=182004 psql -U postgres -f init.sql
```

### "Module not found" en imports

```bash
# Limpiar y reininstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📚 Recursos Útiles

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Auth](https://jwt.io/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 📝 Licencia

Este proyecto es privado y propiedad del equipo de desarrollo.

---

## 👥 Contribuidores

- **Marlon** - Arquitecto & Developer
- **Claude** - Asistente de Desarrollo

---

**Última actualización:** 28 de Marzo de 2026

**Estado:** ✅ Alpha (Autenticación completa y funcional)
