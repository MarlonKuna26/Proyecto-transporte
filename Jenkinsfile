pipeline {
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.deploy.yml'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    BACKEND_IMAGE = "u-ride-backend:${env.BUILD_NUMBER}"
    FRONTEND_IMAGE = "u-ride-frontend:${env.BUILD_NUMBER}"
    VITE_API_URL = 'http://localhost:3002/api/v1'
    FRONTEND_PORT = '8081'
    BACKEND_PORT = '3002'
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
        script {
          if (isUnix()) {
            sh 'pnpm install --frozen-lockfile'
          } else {
            bat 'pnpm install --frozen-lockfile'
          }
        }
      }
    }

    stage('Unit Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          script {
            if (isUnix()) {
              sh 'pnpm -r run test:unit'
            } else {
              bat 'pnpm -r run test:unit'
            }
          }
        }
      }
      post {
        always {
          // Publicar resultados de tests unitarios si existen
          junit allowEmptyResults: true, 
                testResults: '**/test-results/unit/*.xml, **/coverage/*.xml'
        }
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
              echo "Waiting for database to be ready..."
              for i in $(seq 1 30); do
                if docker exec u-ride-db-jenkins pg_isready -U ${DB_USER}; then
                  echo "✅ Database is ready!"
                  break
                fi
                echo "Waiting for database... attempt $i"
                sleep 2
              done

              echo "Waiting for backend to be ready..."
              for i in $(seq 1 30); do
                if docker exec u-ride-backend wget -qO- http://localhost:3002/health; then
                  echo "✅ Backend is ready!"
                  break
                fi
                echo "Waiting for backend... attempt $i"
                sleep 2
              done

              echo "Waiting for frontend to be ready..."
              for i in $(seq 1 30); do
                if curl -sf http://localhost:8081; then
                  echo "✅ Frontend is ready!"
                  break
                fi
                echo "Waiting for frontend... attempt $i"
                sleep 2
              done
            '''
          } else {
            bat '''
              powershell -NoProfile -ExecutionPolicy Bypass -Command ^
                "Write-Host 'Waiting for backend...'; ^
                for ($i=1; $i -le 30; $i++) { ^
                  try { ^
                    $r = Invoke-WebRequest -UseBasicParsing http://localhost:%BACKEND_PORT%/health; ^
                    if ($r.StatusCode -eq 200) { Write-Host 'Backend is ready!'; break } ^
                  } catch { Start-Sleep -Seconds 3 } ^
                }"
            '''
          }
        }
      }
    }

    stage('Integration Tests') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          script {
            if (isUnix()) {
              sh '''
                export DB_HOST=localhost
                export DB_PORT=5434
                export DB_USER=${DB_USER}
                export DB_PASSWORD=${DB_PASSWORD}
                export DB_NAME=${DB_NAME}
                pnpm -r run test:integration
              '''
            } else {
              bat '''
                set DB_HOST=localhost
                set DB_PORT=5434
                set DB_USER=%DB_USER%
                set DB_PASSWORD=%DB_PASSWORD%
                set DB_NAME=%DB_NAME%
                pnpm -r run test:integration
              '''
            }
          }
        }
      }
      post {
        always {
          // Publicar resultados de tests de integración
          junit allowEmptyResults: true, 
                testResults: '**/test-results/integration/*.xml, **/coverage/*.xml'
        }
      }
    }

    stage('E2E Tests (Cypress)') {
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
          script {
            if (isUnix()) {
              sh '''
                echo "Waiting for frontend to be ready for E2E tests..."
                for i in $(seq 1 30); do
                  if curl -sf http://localhost:${FRONTEND_PORT}; then
                    echo "✅ Frontend is ready for E2E tests!"
                    break
                  fi
                  echo "Waiting for frontend... attempt $i"
                  sleep 3
                done
                
                cd tests
                export CYPRESS_BASE_URL=http://localhost:${FRONTEND_PORT}
                xvfb-run pnpm cypress run --e2e --config baseUrl=http://localhost:${FRONTEND_PORT}
                cd ..
              '''
            } else {
              bat '''
                cd tests
                set CYPRESS_BASE_URL=http://localhost:%FRONTEND_PORT%
                pnpm cypress run --e2e --config baseUrl=http://localhost:%FRONTEND_PORT%
                cd ..
              '''
            }
          }
        }
      }
      post {
        always {
          // Publicar resultados de E2E
          junit allowEmptyResults: true, 
                testResults: 'tests/test-results/*.xml, tests/cypress/results/*.xml'
          
          // Publicar videos y screenshots si existen
          publishHTML([
            reportDir: 'tests/cypress/videos',
            reportFiles: '*.mp4',
            reportName: 'Cypress Videos',
            allowMissing: true
          ])
          publishHTML([
            reportDir: 'tests/cypress/screenshots',
            reportFiles: '*.png',
            reportName: 'Cypress Screenshots',
            allowMissing: true
          ])
        }
      }
    }
  }

  post {
    success {
      echo "✅ Despliegue exitoso!"
      echo "📱 Frontend: http://localhost:${FRONTEND_PORT}"
      echo "🔧 Backend: http://localhost:${BACKEND_PORT}/health"
      echo "🗄️ Database: localhost:${DB_PORT}"
    }
    unstable {
      echo "⚠️ Despliegue completado con algunos tests fallidos"
      echo "📊 Revisa los reportes de pruebas en Jenkins"
    }
    failure {
      script {
        if (isUnix()) {
          sh '''
            echo "❌ Pipeline failed! Printing logs..."
            docker compose -f "$COMPOSE_FILE" ps
            docker compose -f "$COMPOSE_FILE" logs --tail=100
          '''
        } else {
          bat '''
            echo "❌ Pipeline failed! Printing logs..."
            docker compose -f %COMPOSE_FILE% ps
            docker compose -f %COMPOSE_FILE% logs --tail=100
          '''
        }
      }
    }
    always {
      script {
        // Opcional: Limpiar después de los tests (comentar si quieres mantener los contenedores para debug)
        // if (isUnix()) {
        //   sh 'docker compose -f "$COMPOSE_FILE" down'
        // } else {
        //   bat 'docker compose -f %COMPOSE_FILE% down'
        // }
        echo "🏁 Pipeline finished"
      }
    }
  }
}