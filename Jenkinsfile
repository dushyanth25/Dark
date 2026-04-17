pipeline {
    agent any

    tools {
        nodejs "node"
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }

    stages {

        stage('Install Backend') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('client') {
                    sh 'npm install'
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

        stage('Test Backend') {
            steps {
                dir('server') {
                    sh 'npm test'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sonar') {
                        sh '''
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=mern-app \
                        -Dsonar.sources=server,client \
                        -Dsonar.javascript.lcov.reportPaths=server/coverage/lcov.info \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/** \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

    }

    post {
        success {
            echo '✅ CI Pipeline completed successfully!'
        }
        failure {
            echo '❌ CI Pipeline failed!'
        }
    }
}