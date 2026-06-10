pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'u-ride-backend'
        DOCKER_IMAGE_FRONTEND = 'u-ride-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins automáticamente hace checkout del SCM si el pipeline está configurado desde Git
                // Pero si es local, podemos hacer checkout explícito:
                checkout scm
                echo 'Código descargado correctamente'
            }
        }

        stage('Test Backend') {
            steps {
                echo 'Ejecutando pruebas de unidad en el Backend'
                sh 'pnpm --filter @u-ride/backend run test:unit'
            }
        }

        stage('Test Frontend') {
            steps {
                echo 'Ejecutando pruebas de unidad en el Frontend'
                sh 'pnpm --filter @u-ride/frontend run test'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo imagen del Backend'
                sh 'docker build -t ${DOCKER_IMAGE_BACKEND}:latest -f packages/backend/Dockerfile .'
                
                echo 'Construyendo imagen del Frontend'
                sh 'docker build -t ${DOCKER_IMAGE_FRONTEND}:latest -f packages/frontend/Dockerfile .'
            }
        }

        stage('Deploy con Docker Compose') {
            steps {
                echo 'Desplegando servicios localmente'
                sh 'docker-compose up -d backend frontend'
            }
        }
    }

    post {
        success {
            echo 'Pipeline ejecutado exitosamente. La aplicación está desplegada.'
        }
        failure {
            echo 'El pipeline falló en alguna de las etapas.'
        }
    }
}
