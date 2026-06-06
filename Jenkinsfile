pipeline {
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.deploy.yml'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    BACKEND_IMAGE = "u-ride-backend:${env.BUILD_NUMBER}"
    FRONTEND_IMAGE = "u-ride-frontend:${env.BUILD_NUMBER}"
    FRONTEND_PORT = '8081'
    BACKEND_PORT = '3002'
    // Variables para tests de integración
    DB_HOST = 'localhost'
    DB_PORT = '5434'
    DB_USER = 'postgres'
    DB_PASSWORD = '182004'
    DB_NAME = 'u_ride_esp'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Unit Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          sh 'pnpm -r run test:unit'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, 
                testResults: '**/test-results/unit/*.xml, **/coverage/*.xml'
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker compose -f "$COMPOSE_FILE" build --pull'
      }
    }

    stage('Deploy Services') {
      steps {
        sh 'docker compose -f "$COMPOSE_FILE" up -d --remove-orphans'
      }
    }

    stage('Health Check') {
      steps {
        sh '''
          echo "========================================="
          echo "Checking services health"
          echo "========================================="
          
          echo "Waiting for database..."
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if docker exec u-ride-db-jenkins pg_isready -U postgres 2>/dev/null; then
              echo "✅ Database is ready"
              break
            fi
            echo "Attempt $i/10 - Waiting for database..."
            sleep 3
          done
          
          echo "Waiting for backend..."
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
              echo "✅ Backend is ready"
              break
            fi
            echo "Attempt $i/10 - Waiting for backend..."
            sleep 3
          done
          
          echo "Waiting for frontend..."
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if curl -sf http://localhost:8081 > /dev/null 2>&1; then
              echo "✅ Frontend is ready"
              break
            fi
            echo "Attempt $i/10 - Waiting for frontend..."
            sleep 3
          done
          
          echo "========================================="
          echo "All services are ready!"
          echo "========================================="
        '''
      }
    }

    stage('Integration Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          sh '''
            echo "========================================="
            echo "Running Integration Tests"
            echo "========================================="
            echo "DB_HOST=${DB_HOST}"
            echo "DB_PORT=${DB_PORT}"
            echo "DB_NAME=${DB_NAME}"
            echo "DB_USER=${DB_USER}"
            echo "========================================="
            
            export DB_HOST=${DB_HOST}
            export DB_PORT=${DB_PORT}
            export DB_USER=${DB_USER}
            export DB_PASSWORD=${DB_PASSWORD}
            export DB_NAME=${DB_NAME}
            
            pnpm -r run test:integration
          '''
        }
      }
      post {
        always {
          junit allowEmptyResults: true, 
                testResults: '**/test-results/**/*.xml, **/coverage/*.xml'
        }
      }
    }

    stage('E2E Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          sh '''
            echo "========================================="
            echo "Running E2E Tests"
            echo "========================================="
            
            echo "Waiting for frontend to be ready for E2E tests..."
            for i in 1 2 3 4 5 6 7 8 9 10; do
              if curl -sf http://localhost:8081 > /dev/null 2>&1; then
                echo "✅ Frontend is ready for E2E"
                break
              fi
              echo "Attempt $i/10 - Waiting for frontend..."
              sleep 3
            done
            
            cd tests
            xvfb-run pnpm cypress run --e2e --config baseUrl=http://localhost:8081
            cd ..
          '''
        }
      }
      post {
        always {
          junit allowEmptyResults: true, 
                testResults: 'tests/cypress/results/*.xml, tests/test-results/*.xml'
        }
      }
    }
  }

  post {
    success {
      echo "========================================="
      echo "✅ Pipeline completed successfully!"
      echo "========================================="
      echo "📱 Frontend: http://localhost:8081"
      echo "🔧 Backend: http://localhost:3002/health"
      echo "🗄️ Database: localhost:5434"
      echo "========================================="
    }
    unstable {
      echo "========================================="
      echo "⚠️ Pipeline completed with test failures"
      echo "========================================="
      echo "📊 Check the test reports in Jenkins"
      echo "========================================="
    }
    failure {
      echo "========================================="
      echo "❌ Pipeline failed!"
      echo "========================================="
      sh '''
        echo "Printing container status..."
        docker compose -f "$COMPOSE_FILE" ps
        
        echo ""
        echo "Printing last 50 lines of logs..."
        docker compose -f "$COMPOSE_FILE" logs --tail=50
      '''
    }
    always {
      echo "========================================="
      echo "🏁 Pipeline finished for build ${env.BUILD_NUMBER}"
      echo "========================================="
      // Opcional: Limpiar contenedores después de las pruebas
      // Descomenta la siguiente línea si quieres limpiar automáticamente
      // sh 'docker compose -f "$COMPOSE_FILE" down'
    }
  }
}