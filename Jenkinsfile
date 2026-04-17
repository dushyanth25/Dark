pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        DOCKER_IMAGE = "dushyanth25/mern-app"
        IMAGE_TAG = "latest"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('server') {
                    sh 'npm ci || npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('client') {
                    sh 'npm ci || npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }

        stage('Run Tests + Coverage') {
            steps {
                dir('server') {
                    sh 'npm test -- --coverage --ci'
                }
            }
        }

        /* =========================
           FS SECURITY SCAN
        ========================== */

        stage('Trivy FS Scan') {
            steps {
                sh """
                    echo "🔍 Running Trivy FS Scan..."
                    trivy fs server --severity HIGH,CRITICAL || true
                """
            }
        }

        stage('SonarQube Scan') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'

                    withSonarQubeEnv('sonar') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=server,client \
                            -Dsonar.javascript.lcov.reportPaths=server/coverage/lcov.info \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/** \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        /* =========================
           DOCKER BUILD
        ========================== */

        stage('Build Docker Image') {
            steps {
                sh """
                    echo "🐳 Building Docker image..."
                    docker build --pull --rm -t ${DOCKER_IMAGE}:${IMAGE_TAG} .
                """
            }
        }

        stage('Trivy Image Scan') {
    steps {
        sh """
            echo "🔍 Running Trivy Image Scan..."

            trivy image \
              --exit-code 1 \
              --severity CRITICAL \
              --ignore-unfixed \
              --no-progress \
              ${DOCKER_IMAGE}:${IMAGE_TAG}
        """
    }
}

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh """
                    echo "📦 Pushing Docker image..."
                    docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                """
            }
        }
    }

    post {
        always {
            cleanWs()
        }

        success {
            echo '✅ CI/CD Pipeline completed successfully!'
        }

        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
