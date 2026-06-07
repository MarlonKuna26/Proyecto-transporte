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

    stage('Health Check') {
      steps {
        sh '''
          echo "========================================="
          echo "Checking services health"
          echo "========================================="
          
          echo "Waiting for database..."
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
          if [ "$db_ready" != true ]; then
            echo "❌ Database failed to become ready"
            docker compose -f \"$COMPOSE_FILE\" logs database || true
            exit 1
          fi
          
          echo "Waiting for backend..."
          backend_ready=false
          for i in $(seq 1 30); do
            if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
              echo "✅ Backend is ready"
              backend_ready=true
              break
            fi
            echo "Attempt $i/30 - Waiting for backend..."
            sleep 2
          done
          if [ "$backend_ready" != true ]; then
            echo "❌ Backend failed to become ready"
            docker compose -f \"$COMPOSE_FILE\" logs u-ride-backend || true
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
            docker compose -f \"$COMPOSE_FILE\" logs u-ride-frontend || true
            exit 1
          fi
          
          echo "========================================="
          echo "All services are ready!"
          echo "========================================="
        '''
      }
    }

    stage('Unit Tests (with DB available)') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          sh '''
            echo "========================================="
            echo "Running Unit Tests"
            echo "========================================="
            echo "⚠️  Unit Tests run in ISOLATED mode - NO database variables exported"
            echo "Tests must use mocks for all database operations"
            echo "========================================="
            
            # DO NOT export DB variables - Unit Tests should use .env.unit without BD config
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
            
            # Run integration tests with verbose output
            pnpm -r run test:integration || (
              echo "Integration tests failed - showing logs:"
              docker compose -f "$COMPOSE_FILE" logs u-ride-backend || true
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
            
            # Verify frontend is running
            curl -v http://localhost:8081 || true
            
            # Run Cypress tests - use pnpm filter to ensure proper context
            echo "Starting Cypress tests..."
            pnpm --filter @u-ride/tests test:e2e -- --config baseUrl=http://localhost:8081 || (
              echo "E2E tests failed - showing frontend logs:"
              docker compose -f "$COMPOSE_FILE" logs u-ride-frontend || true
              exit 1
            )
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
      // Archive coverage reports
      archiveArtifacts artifacts: '**/coverage/**,**/test-results/**', 
                        fingerprint: true,
                        allowEmptyArchive: true
      
      // Pipeline finished message
      echo "========================================="
      echo "🏁 Pipeline finished for build ${env.BUILD_NUMBER}"
      echo "========================================="
      // Opcional: Limpiar contenedores después de las pruebas
      // Descomenta la siguiente línea si quieres limpiar automáticamente
      // sh 'docker compose -f "$COMPOSE_FILE" down'
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