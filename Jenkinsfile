pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        DOCKER_REGISTRY = "dushyanth25"
        DOCKER_IMAGE_NAME = "mern-app"

        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"

        K8S_NAMESPACE = "mern"
        K8S_DEPLOYMENT = "mern-app"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        /* =========================
           INSTALL DEPENDENCIES
        ========================== */

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
           SECURITY SCANS
        ========================== */

        stage('Trivy FS Scan') {
            steps {
                sh '''
                    echo "🔍 Running Trivy FS Scan..."
                    trivy fs server --severity HIGH,CRITICAL || true
                '''
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
           DOCKER BUILD & PUSH
        ========================== */

        stage('Build Docker Image') {
            steps {
                sh """
                    echo "🐳 Building Docker image..."
                    docker build --pull --rm -t ${DOCKER_IMAGE} .
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
                      ${DOCKER_IMAGE}
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
                    docker push ${DOCKER_IMAGE}
                """
            }
        }

        /* =========================
           ☸️ KUBERNETES DEPLOYMENT
        ========================== */

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    echo "☸️ Deploying to Kubernetes..."

                    # Ensure namespace exists
                    kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                    # Apply K8s manifests (NO SECRET YAML — created manually or via Jenkins creds)
                    kubectl apply -f k8s/configmap.yaml -n ${K8S_NAMESPACE}
                    kubectl apply -f k8s/deployment.yaml -n ${K8S_NAMESPACE}
                    kubectl apply -f k8s/service.yaml -n ${K8S_NAMESPACE}

                    # Update deployment image (REAL rollout trigger)
                    kubectl set image deployment/${K8S_DEPLOYMENT} \
                      ${K8S_DEPLOYMENT}=${DOCKER_IMAGE} \
                      -n ${K8S_NAMESPACE}
                """
            }
        }

        stage('Wait for Rollout') {
            steps {
                sh """
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                    -n ${K8S_NAMESPACE} --timeout=5m
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    echo "📊 Pods:"
                    kubectl get pods -n ${K8S_NAMESPACE}

                    echo "🌐 Services:"
                    kubectl get svc -n ${K8S_NAMESPACE}
                """
            }
        }

        stage('Health Check') {
            steps {
                sh """
                    echo "🏥 Basic Health Check"
                    kubectl get pods -n ${K8S_NAMESPACE}
                """
            }
        }
    }

    post {

        success {
            echo "✅ CI/CD Pipeline completed successfully!"
        }

        failure {
            echo "❌ Pipeline failed! Rolling back deployment..."

            sh """
                kubectl rollout undo deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}
            """
        }

        always {
            cleanWs()
        }
    }
}
