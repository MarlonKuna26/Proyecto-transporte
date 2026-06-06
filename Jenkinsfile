pipeline {
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.deploy.yml'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    BACKEND_IMAGE = "u-ride-backend:${env.BUILD_NUMBER}"
    FRONTEND_IMAGE = "u-ride-frontend:${env.BUILD_NUMBER}"
    VITE_API_URL = 'http://localhost:3002/api/v1'
    FRONTEND_PORT = '8080'
    BACKEND_PORT = '3002'
    DB_PORT_HOST = '5433'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Images') {
      steps {
        script {
          if (isUnix()) {
            sh 'docker compose -f "$COMPOSE_FILE" build --pull'
          } else {
            bat 'docker compose -f %COMPOSE_FILE% build --pull'
          }
        }
      }
    }

    stage('Deploy Controlled Environment') {
      steps {
        script {
          if (isUnix()) {
            sh 'docker compose -f "$COMPOSE_FILE" up -d --remove-orphans'
          } else {
            bat 'docker compose -f %COMPOSE_FILE% up -d --remove-orphans'
          }
        }
      }
    }

    stage('Health Check') {
      steps {
        script {
          if (isUnix()) {
            sh '''
              for i in $(seq 1 30); do
                if curl -fsS "http://localhost:${BACKEND_PORT}/health"; then
                  exit 0
                fi
                sleep 3
              done
              docker compose -f "$COMPOSE_FILE" logs backend
              exit 1
            '''
          } else {
            bat '''
            powershell -NoProfile -ExecutionPolicy Bypass -Command ^
              "$ErrorActionPreference='Stop'; ^
              for ($i=1; $i -le 30; $i++) { ^
                try { ^
                  $r = Invoke-WebRequest -UseBasicParsing http://localhost:%BACKEND_PORT%/health; ^
                  if ($r.StatusCode -eq 200) { exit 0 } ^
                } catch { Start-Sleep -Seconds 3 } ^
              }; ^
              docker compose -f %COMPOSE_FILE% logs backend; ^
              exit 1"
            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo "Despliegue completado: frontend http://localhost:${FRONTEND_PORT}, backend http://localhost:${BACKEND_PORT}/health"
    }
    failure {
      script {
        if (isUnix()) {
          sh 'docker compose -f "$COMPOSE_FILE" ps'
          sh 'docker compose -f "$COMPOSE_FILE" logs --no-color'
        } else {
          bat 'docker compose -f %COMPOSE_FILE% ps'
          bat 'docker compose -f %COMPOSE_FILE% logs --no-color'
        }
      }
    }
  }
}
