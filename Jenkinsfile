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

        K8S_NAMESPACE = "mern"
        K8S_DEPLOYMENT = "mern-app"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
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

        /* =========================
           ☸️ KUBERNETES DEPLOYMENT
        ========================== */

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    set -e
                    echo "☸️ Checking cluster access..."
                    kubectl cluster-info
                    kubectl get nodes

                    echo "📦 Ensuring namespace exists..."
                    kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                    echo "📄 Applying ConfigMap..."
                    kubectl apply -f k8s/configmap.yaml -n ${K8S_NAMESPACE}

                    echo "📄 Applying Deployment..."
                    kubectl apply -f k8s/deployment.yaml -n ${K8S_NAMESPACE}

                    echo "📄 Applying Service..."
                    kubectl apply -f k8s/service.yaml -n ${K8S_NAMESPACE}

                    echo "🚀 Updating image..."
                    kubectl set image deployment/${K8S_DEPLOYMENT} \
                        ${K8S_DEPLOYMENT}=${DOCKER_IMAGE}:${IMAGE_TAG} \
                        -n ${K8S_NAMESPACE}

                    echo "⏳ Waiting for rollout..."
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                        -n ${K8S_NAMESPACE} --timeout=5m
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    echo "✅ Verifying deployment..."
                    kubectl get pods -n ${K8S_NAMESPACE}
                    kubectl get svc -n ${K8S_NAMESPACE}
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
            echo '❌ Pipeline failed — checking rollback...'
            sh """
                if kubectl get deployment ${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} >/dev/null 2>&1; then
                    echo "↩️ Rolling back deployment..."
                    kubectl rollout undo deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} || true
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} || true
                else
                    echo "⚠️ Deployment not created yet — skipping rollback"
                fi
            """
        }
    }
}
