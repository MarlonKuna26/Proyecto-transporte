pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'proyecto-transporte-backend'
        DOCKER_IMAGE_FRONTEND = 'proyecto-transporte-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                // Descargar el código desde la rama feature/jenkins
                git branch: 'feature/jenkins', url: 'https://github.com/MarlonKuna26/Proyecto-transporte.git'
            }
        }

        stage('Test & Coverage') {
            steps {
                echo 'Ejecutando pruebas y extrayendo coverage...'
                
                // 1. Construir una imagen temporal que ejecute las pruebas con coverage
                writeFile file: 'Dockerfile.test', text: '''FROM node:20-alpine
RUN npm install -g pnpm@9.0.0
WORKDIR /app
COPY . .
ENV CYPRESS_INSTALL_BINARY=0
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @u-ride/backend run test:coverage
'''
                sh 'docker build -t test-coverage-img -f Dockerfile.test .'
                
                // 2. Extraer la carpeta de coverage al workspace de Jenkins
                sh '''
                # Si existe una carpeta anterior, la borramos
                rm -rf packages/backend/coverage
                
                docker create --name temp-test test-coverage-img
                docker cp temp-test:/app/packages/backend/coverage ./packages/backend/coverage
                docker rm temp-test
                '''
            }
        }


        stage('Build Docker Images & Run Tests') {
            steps {
                echo 'Construyendo imagen del Backend (y ejecutando pruebas internamente)...'
                sh 'docker build -t ${DOCKER_IMAGE_BACKEND}:latest -f packages/backend/Dockerfile .'
                
                echo 'Construyendo imagen del Frontend'
                sh 'docker build -t ${DOCKER_IMAGE_FRONTEND}:latest -f packages/frontend/Dockerfile .'
            }
        }

        stage('Deploy con Docker Compose') {
            steps {
                echo 'Desplegando servicios localmente'
                sh 'docker-compose -p proyecto-transporte up -d backend frontend'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline ejecutado exitosamente. La aplicación está desplegada.'
            
            // Publicar el reporte HTML de coverage en Jenkins
            // Requiere el plugin "HTML Publisher" en Jenkins
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: 'packages/backend/coverage/lcov-report',
                reportFiles: 'index.html',
                reportName: 'Backend Coverage Report'
            ])
        }
        failure {
            echo '❌ El pipeline falló en alguna de las etapas.'
        }
    }
}
