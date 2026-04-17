pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        // Docker image with versioned tag (NOT latest)
        DOCKER_REGISTRY = "dushyanth25"
        DOCKER_IMAGE_NAME = "mern-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
        DOCKER_LATEST = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest"

        // Kubernetes
        K8S_NAMESPACE = "mern"
        K8S_DEPLOYMENT = "mern-app"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
        
        // ⚠️ DEV ONLY: MongoDB Atlas & API Credentials
        // TODO: Move to Jenkins Credentials Plugin for production
        MONGO_ATLAS_URI = "mongodb+srv://dushyanth520:904918@cluster0.kag8m76.mongodb.net/batman_auth?retryWrites=true&w=majority&appName=Cluster0"
        JENKINS_JWT_SECRET = "batman_dark_knight_secret_key_2024"
        JENKINS_GROQ_KEY = "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"
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
                    docker build --pull --rm -t ${DOCKER_IMAGE} .
                    docker tag ${DOCKER_IMAGE} ${DOCKER_LATEST}
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
                    echo "📦 Pushing Docker image with tag ${IMAGE_TAG}..."
                    docker push ${DOCKER_IMAGE}
                    docker push ${DOCKER_LATEST}
                """
            }
        }

        /* =========================
           ☸️ KUBERNETES DEPLOYMENT
        ========================== */

        stage('Setup K8s Secrets') {
            steps {
                sh '''
                    echo "🔐 Creating Kubernetes secrets..."
                    
                    # Create namespace if not exists
                    kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                    
                    # Use environment variables from Jenkinsfile environment block
                    echo "   ✅ Credentials loaded from Jenkinsfile environment"
                    echo "   MONGO_URI: ${MONGO_ATLAS_URI:0:30}..."
                    echo "   JWT_SECRET: ${JENKINS_JWT_SECRET:0:20}..."
                    echo "   GROQ_API_KEY: ${JENKINS_GROQ_KEY:0:20}..."
                    
                    kubectl create secret generic mern-app-secrets \
                      --from-literal=MONGO_URI="${MONGO_ATLAS_URI}" \
                      --from-literal=JWT_SECRET="${JENKINS_JWT_SECRET}" \
                      --from-literal=GROQ_API_KEY="${JENKINS_GROQ_KEY}" \
                      -n ${K8S_NAMESPACE} \
                      --dry-run=client -o yaml | kubectl apply -f -
                    
                    echo "✅ Secrets configured"
                '''
            }
        }

        stage('Setup K8s RBAC & Namespace') {
            steps {
                sh """
                    echo "☸️ Setting up Kubernetes RBAC and namespace..."
                    
                    # Apply namespace
                    kubectl apply -f k8s/namespace.yaml
                    
                    # Apply ServiceAccount with RBAC (CRITICAL - must be before deployment)
                    kubectl apply -f k8s/serviceaccount.yaml -n ${K8S_NAMESPACE}
                    
                    # Wait for ServiceAccount to be created
                    sleep 2
                    
                    echo "✅ RBAC and ServiceAccount configured"
                """
            }
        }

        stage('Deploy K8s Manifests') {
            steps {
                sh """
                    set -e
                    echo "☸️ Deploying Kubernetes manifests..."
                    
                    # Verify cluster access
                    echo "📊 Checking cluster access..."
                    kubectl cluster-info
                    kubectl get nodes
                    
                    # Apply ConfigMap (non-sensitive env vars)
                    echo "📄 Applying ConfigMap..."
                    kubectl apply -f k8s/configmap.yaml -n ${K8S_NAMESPACE}
                    
                    # Apply HPA
                    echo "📄 Applying HorizontalPodAutoscaler..."
                    kubectl apply -f k8s/hpa.yaml -n ${K8S_NAMESPACE}
                    
                    # Apply Deployment (will use secrets created in previous stage)
                    echo "📄 Applying Deployment..."
                    kubectl apply -f k8s/deployment.yaml -n ${K8S_NAMESPACE}
                    
                    # Apply Service
                    echo "📄 Applying Service..."
                    kubectl apply -f k8s/service.yaml -n ${K8S_NAMESPACE}
                    
                    echo "✅ Manifests deployed"
                """
            }
        }

        stage('Update Image & Rollout') {
            steps {
                sh """
                    echo "🚀 Updating deployment image to ${DOCKER_IMAGE}..."
                    
                    # Update image using versioned tag (NOT latest)
                    kubectl set image deployment/${K8S_DEPLOYMENT} \
                        ${K8S_DEPLOYMENT}=${DOCKER_IMAGE} \
                        -n ${K8S_NAMESPACE} \
                        --record
                    
                    echo "⏳ Waiting for rollout to complete (timeout: 5m)..."
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                        -n ${K8S_NAMESPACE} \
                        --timeout=5m
                    
                    echo "✅ Rollout completed successfully"
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    echo "✅ Verifying Kubernetes deployment..."
                    echo ""
                    echo "=== Deployment Status ==="
                    kubectl get deployment ${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}
                    
                    echo ""
                    echo "=== Pod Status ==="
                    kubectl get pods -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT}
                    
                    echo ""
                    echo "=== Service Status ==="
                    kubectl get svc -n ${K8S_NAMESPACE}
                    
                    echo ""
                    echo "=== Recent Logs ==="
                    kubectl logs -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT} --tail=20 --all-containers=true || true
                    
                    echo ""
                    echo "✅ All resources verified"
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
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ Deployment Successful"
                echo "=========================================="
                echo "Image: ${DOCKER_IMAGE}"
                echo "Namespace: ${K8S_NAMESPACE}"
                echo "Deployment: ${K8S_DEPLOYMENT}"
                echo ""
                echo "To access your application:"
                echo "  kubectl port-forward svc/${K8S_DEPLOYMENT}-service 8080:80 -n ${K8S_NAMESPACE}"
                echo "  then visit: http://localhost:8080"
                echo "=========================================="
            '''
        }

        failure {
            echo '❌ Pipeline failed!'
            sh '''
                set +e
                echo ""
                echo "=========================================="
                echo "❌ Checking Deployment Status..."
                echo "=========================================="
                
                kubectl get pods -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT}
                
                echo ""
                echo "=== Recent Errors ==="
                kubectl describe pod -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT} || true
                
                echo ""
                echo "=== Pod Logs ==="
                kubectl logs -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT} --tail=50 --all-containers=true || true
                
                echo ""
                echo "Attempting rollback..."
                if kubectl get deployment ${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} >/dev/null 2>&1; then
                    echo "↩️ Rolling back to previous version..."
                    kubectl rollout undo deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} --timeout=5m
                    echo "✅ Rollback completed"
                else
                    echo "⚠️ Deployment not found - skipping rollback"
                fi
                echo "=========================================="
            '''
        }
    }
}
