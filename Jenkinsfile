pipeline {
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.deploy.yml'
    COMPOSE_PROJECT_NAME = 'proyecto-transporte'
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

    stage('Initialize Database Schema') {
      steps {
        sh '''
          echo "========================================="
          echo "Waiting for database to be ready..."
          echo "========================================="
          
          db_ready=false
          for i in $(seq 1 20); do
            if docker exec u-ride-db-jenkins pg_isready -U postgres > /dev/null 2>&1; then
              echo "✅ Database is ready"
              db_ready=true
              break
            fi
            echo "Attempt $i/20 - Waiting for database..."
            sleep 2
          done
          
          echo "========================================="
          echo "Initializing database from ElBueno.sql..."
          echo "========================================="
          
          # Verificar que el archivo existe
          if [ ! -f ElBueno.sql ]; then
            echo "❌ ElBueno.sql not found in workspace!"
            ls -la
            exit 1
          fi
          
          # Copiar el archivo al contenedor
          docker cp ElBueno.sql u-ride-db-jenkins:/tmp/init.sql
          
          # Ejecutar el script (ignorando errores de tablas existentes)
          docker exec u-ride-db-jenkins psql -U postgres -d u_ride_esp -f /tmp/init.sql 2>&1 || true
          
          # Verificar tablas
          echo "========================================="
          echo "Verifying tables..."
          echo "========================================="
          docker exec u-ride-db-jenkins psql -U postgres -d u_ride_esp -c "\\dt" | head -20
          
          echo "✅ Database initialization completed!"
        '''
      }
    }

    stage('Health Check') {
      steps {
        sh '''
          echo "========================================="
          echo "Checking services health"
          echo "========================================="
          
          echo "Waiting for backend..."
          if ! command -v curl > /dev/null 2>&1; then
            echo "❌ curl is not installed on this agent. Backend health check cannot run."
            exit 1
          fi

          backend_ready=false
          for i in $(seq 1 30); do
            if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
              echo "✅ Backend is ready"
              backend_ready=true
              break
            fi
            echo "Attempt $i/30 - Waiting for backend..."
            docker compose -f "$COMPOSE_FILE" ps backend || true
            sleep 2
          done
          
          if [ "$backend_ready" != true ]; then
            echo "❌ Backend failed to become ready"
            docker compose -f "$COMPOSE_FILE" ps -a
            docker compose -f "$COMPOSE_FILE" logs backend || true
            exit 1
          fi
          
          echo "Waiting for frontend..."
          frontend_ready=false
          for i in $(seq 1 30); do
            if curl -sf http://localhost:8081 > /dev/null 2>&1; then
              echo "✅ Frontend is ready"
              frontend_ready=true
              break
            fi
            echo "Attempt $i/30 - Waiting for frontend..."
            sleep 2
          done
          
          if [ "$frontend_ready" != true ]; then
            echo "❌ Frontend failed to become ready"
            docker compose -f "$COMPOSE_FILE" logs u-ride-frontend || true
            exit 1
          fi
          
          echo "========================================="
          echo "All services are ready!"
          echo "========================================="
        '''
      }
    }

    stage('Unit Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          sh '''
            echo "========================================="
            echo "Running Unit Tests"
            echo "========================================="
            echo "⚠️  Unit Tests run in ISOLATED mode - NO database variables exported"
            echo "Tests must use mocks for all database operations"
            echo "========================================="
            
            pnpm -r run test:unit
          '''
        }
      }
      post {
        always {
          junit allowEmptyResults: true, 
                testResults: '**/test-results/unit/*.xml, **/coverage/*.xml'
        }
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
            echo "========================================="
            
            export JENKINS=true
            export DB_HOST=${DB_HOST}
            export DB_PORT=${DB_PORT}
            export DB_USER=${DB_USER}
            export DB_PASSWORD=${DB_PASSWORD}
            export DB_NAME=${DB_NAME}
            
            pnpm -r run test:integration || (
              echo "Integration tests failed - showing logs:"
              docker compose -f "$COMPOSE_FILE" logs backend || true
              exit 1
            )
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
            echo "Running E2E Tests with Cypress"
            echo "========================================="
            
            echo "Waiting for frontend to be ready for E2E tests..."
            for i in $(seq 1 30); do
              if curl -sf http://localhost:8081 > /dev/null 2>&1; then
                echo "✅ Frontend is ready for E2E"
                break
              fi
              echo "Attempt $i/30 - Waiting for frontend..."
              sleep 2
            done
            
            cd tests
            export CYPRESS_BASE_URL=http://localhost:8081
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
    always {
      archiveArtifacts artifacts: '**/coverage/**,**/test-results/**', 
                        fingerprint: true,
                        allowEmptyArchive: true
      
      echo "========================================="
      echo "🏁 Pipeline finished for build ${env.BUILD_NUMBER}"
      echo "========================================="
    }
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
  }
}