# Informe de Despliegue Automatizado con Jenkins, Docker y Kubernetes

## 1. Investigación Teórica

### 1.1. Jenkins
**Funcionamiento Básico:** Jenkins es un servidor de automatización de código abierto escrito en Java. Su objetivo es ayudar a automatizar las partes del desarrollo de software relacionadas con la construcción, pruebas y despliegue, facilitando la integración continua y la entrega continua.
**Configuración de Pipelines:** En Jenkins, un "Pipeline" es un conjunto de plugins que soportan la implementación y la integración continua. Se define típicamente a través de un archivo llamado `Jenkinsfile` que describe las etapas de construcción, como el "checkout" de código, "build", "test" y "deploy".
**Integración Continua y Entrega Continua (CI/CD):** La CI permite a los desarrolladores integrar código en un repositorio compartido frecuentemente, y Jenkins realiza compilaciones y pruebas automáticas. La CD automatiza el despliegue del código hacia los entornos de prueba o producción.

### 1.2. Docker
**Uso de Contenedores para Empaquetar y Desplegar:** Docker permite empaquetar una aplicación y todas sus dependencias (bibliotecas, variables de entorno, configuraciones) en una unidad estandarizada llamada "contenedor".
**Creación de Imágenes:** Una imagen de Docker es una plantilla de solo lectura que contiene instrucciones para crear un contenedor. Se crea utilizando un archivo de texto llamado `Dockerfile`, que detalla los pasos para configurar el entorno.
**Ejecución de Contenedores:** A partir de una imagen, Docker lanza una instancia en ejecución llamada contenedor, la cual está aislada del sistema operativo anfitrión pero comparte su núcleo (kernel).

### 1.3. Kubernetes
**Orquestación de Contenedores:** Kubernetes (K8s) es un sistema de código abierto para automatizar el despliegue, el escalado y el manejo de aplicaciones en contenedores.
**Despliegue en Clústeres:** K8s distribuye contenedores a través de múltiples máquinas (nodos) que forman un clúster, asegurando alta disponibilidad.
**Escalabilidad:** Permite escalar fácilmente horizontalmente creando o eliminando réplicas de los contenedores según la demanda de tráfico.
**Gestión:** Monitoriza el estado de los contenedores; si un contenedor falla, K8s lo reinicia automáticamente.

---

## 2. Aplicación Práctica: Pipeline y Contenedorización

### 2.1. Creación de Imágenes Docker
Se crearon archivos `Dockerfile` tanto para el **Backend** (`packages/backend/Dockerfile`) como para el **Frontend** (`packages/frontend/Dockerfile`). 
- El backend utiliza `node:20-alpine`, compila el proyecto y lo expone en el puerto 3002.
- El frontend utiliza Vite, compila a archivos estáticos y utiliza `nginx:alpine` para servirlos por el puerto 80.

**Instrucción de Captura:** _(Tomar captura de pantalla ejecutando `docker build -t u-ride-backend:latest -f packages/backend/Dockerfile .` en la terminal)_.

### 2.2. Pipeline de Jenkins
El archivo `Jenkinsfile` ubicado en la raíz del proyecto define un pipeline declarativo con las siguientes etapas:
1. **Checkout:** Clona/actualiza el código desde el repositorio de GitHub.
2. **Test & Coverage:** Utiliza una imagen Docker temporal basada en Node para instalar las dependencias, ejecutar las pruebas automatizadas del backend (`test:coverage`) y extraer los resultados de la cobertura de código. Estos resultados se publican en la interfaz de Jenkins mediante el plugin HTML Publisher.
3. **Build Docker Images:** Construye las imágenes definitivas de producción tanto para el Backend como para el Frontend utilizando sus respectivos `Dockerfile`.
4. **Deploy con Docker Compose:** Utiliza `docker-compose up -d backend frontend` para levantar los servicios orquestados localmente junto a la base de datos y Jenkins.

**Instrucción de Captura:** _(Tomar captura de pantalla de la interfaz de BlueOcean o del Dashboard de Jenkins mostrando el Pipeline ejecutándose con todos los recuadros en verde)_.

### 2.3. Despliegue en Kubernetes (Opcional)
Se crearon los siguientes manifiestos en la carpeta `k8s/`:
- `database-deployment.yaml`: Levanta Postgresql con un volumen persistente.
- `backend-deployment.yaml`: Despliega el backend con 2 réplicas (escalabilidad).
- `frontend-deployment.yaml`: Despliega el frontend web usando Nginx con 2 réplicas.

**Ejecución de K8s:**
Para probar la escalabilidad en Minikube o Docker Desktop:
```bash
kubectl apply -f k8s/database-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl get pods
```

**Instrucción de Captura:** _(Tomar captura de la terminal mostrando el comando `kubectl get pods` donde se vean los pods `Running`)_.

---

## 3. Guía para Convertir este Informe a PDF

Para generar el archivo PDF que debes entregar:
1. Asegúrate de insertar tus **capturas de pantalla** donde indica `Instrucción de Captura`.
2. En tu terminal, instala globalmente o ejecuta:
   ```bash
   npx md-to-pdf informe_despliegue.md
   ```
3. Esto generará el archivo `informe_despliegue.pdf` en la misma carpeta.
