pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {

        /* =========================
           SONAR
        ========================== */
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        /* =========================
           DOCKER
        ========================== */
        DOCKER_REGISTRY = "dushyanth25"
        DOCKER_IMAGE_NAME = "mern-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"

        /* =========================
           KUBERNETES
        ========================== */
        K8S_NAMESPACE = "mern"
        K8S_DEPLOYMENT = "mern-app"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
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
           INSTALL + BUILD
        ========================== */
        stage('Install Backend') {
            steps {
                dir('server') {
                    sh 'npm ci || npm install'
                }
            }
        }

        stage('Install Frontend') {
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

        stage('Run Tests') {
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
                sh 'trivy fs server --severity HIGH,CRITICAL || true'
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.sources=server,client \
                        -Dsonar.javascript.lcov.reportPaths=server/coverage/lcov.info \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/** \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.token=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        /* =========================
           DOCKER
        ========================== */
        stage('Build Docker Image') {
            steps {
                sh "docker build --pull --rm -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                    trivy image \
                    --exit-code 1 \
                    --severity CRITICAL \
                    --ignore-unfixed \
                    --no-progress \
                    ${DOCKER_IMAGE}
                """
            }
        }

        stage('Docker Login') {
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

        stage('Push Image') {
            steps {
                sh "docker push ${DOCKER_IMAGE}"
            }
        }

        /* =========================
           KUBERNETES DEPLOYMENT
        ========================== */
        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    set -e

                    echo "☸️ Deploying to Kubernetes..."

                    kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                    kubectl apply -f k8s/configmap.yaml -n ${K8S_NAMESPACE}
                    kubectl apply -f k8s/deployment.yaml -n ${K8S_NAMESPACE}
                    kubectl apply -f k8s/service.yaml -n ${K8S_NAMESPACE}

                    kubectl set image deployment/${K8S_DEPLOYMENT} \
                    ${K8S_DEPLOYMENT}=${DOCKER_IMAGE} \
                    -n ${K8S_NAMESPACE}
                '''
            }
        }

        stage('Rollout Status') {
            steps {
                sh """
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                    -n ${K8S_NAMESPACE} --timeout=5m
                """
            }
        }

        stage('Verify') {
            steps {
                sh """
                    kubectl get pods -n ${K8S_NAMESPACE}
                    kubectl get svc -n ${K8S_NAMESPACE}
                """
            }
        }
    }

    post {

        success {
            echo "✅ CI/CD Pipeline completed successfully!"
        }

        failure {
            echo "❌ Pipeline failed — checking rollback..."

            sh """
                if kubectl get deployment ${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} >/dev/null 2>&1; then
                    kubectl rollout undo deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}
                else
                    echo "⚠️ No deployment found — skipping rollback"
                fi
            """
        }

        always {
            cleanWs()
        }
    }
}
