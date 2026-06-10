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
                sh 'docker-compose up -d backend frontend'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline ejecutado exitosamente. La aplicación está desplegada.'
        }
        failure {
            echo '❌ El pipeline falló en alguna de las etapas.'
        }
    }
}
