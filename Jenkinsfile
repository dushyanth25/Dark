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
        DOCKER_LATEST = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest"

        K8S_NAMESPACE = "mern"
        K8S_DEPLOYMENT = "mern-app"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"

        // ⚠️ DEV ONLY
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
                script {
                    checkout scm
                    def commitMsg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    if (commitMsg.contains('[skip ci]')) {
                        currentBuild.result = 'NOT_BUILT'
                        error('Skipping — image tag commit from Jenkins')
                    }
                }
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
                    sh 'npm test -- --coverage --ci || true'
                }
            }
        }

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
           🚀 ARGO CD GitOps DEPLOY
        ========================== */

        stage('Update Image Tag in Git') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-token',
                    variable: 'GIT_TOKEN'
                )]) {
                    sh """
                        echo "📝 Updating image tag to ${IMAGE_TAG} in k8s/deployment.yaml..."

                        git config user.email "jenkins@ci.local"
                        git config user.name "Jenkins CI"

                        sed -i 's|image: dushyanth25/mern-app:.*|image: dushyanth25/mern-app:${IMAGE_TAG}|g' k8s/deployment.yaml

                        git add k8s/deployment.yaml
                        git commit -m "ci: update image tag to ${IMAGE_TAG} [skip ci]"
                        git push https://\${GIT_USER}:\${GIT_TOKEN}@github.com/dushyanth25/Dark.git HEAD:main

                        echo "✅ Git updated — Argo CD will auto-sync within 3 minutes"
                    """
                }
            }
        }

        stage('Verify Argo CD Sync') {
            steps {
                sh """
                    echo "⏳ Waiting 30s for Argo CD to detect Git change..."
                    sleep 30

                    echo "=== Argo CD App Status ==="
                    argocd app get mern-app --server localhost:8086 --insecure || true

                    echo ""
                    echo "=== Pod Status ==="
                    kubectl get pods -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT}

                    echo ""
                    echo "=== Recent Logs ==="
                    kubectl logs -n ${K8S_NAMESPACE} -l app=${K8S_DEPLOYMENT} --tail=20 || true

                    echo "✅ Argo CD sync triggered"
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
                echo "✅ Deployment Handed to Argo CD"
                echo "=========================================="
                echo "Image pushed: ${DOCKER_IMAGE}"
                echo "Git updated:  k8s/deployment.yaml → tag ${IMAGE_TAG}"
                echo "Argo CD:      auto-syncing to cluster"
                echo ""
                echo "Monitor sync:"
                echo "  argocd app get mern-app --server localhost:8086 --insecure"
                echo "=========================================="
            '''
        }

        failure {
            echo '❌ Pipeline failed!'
            sh '''
                set +e
                echo ""
                echo "=========================================="
                echo "❌ Pipeline Failure Summary"
                echo "=========================================="
                echo "This typically means a test, quality gate, or security scan failed."
                echo "Check the logs above for the specific failure reason."
                echo ""
                echo "NOTE: Argo CD was NOT updated — cluster state unchanged."
                echo "=========================================="
            '''
        }
    }
}