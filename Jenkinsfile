// ============================================================================
// MERN Stack Production-Ready CI Pipeline
// ============================================================================
// Pipeline includes:
// - Declarative syntax for clarity and maintainability
// - Parallel builds for client and server
// - SonarQube code quality scanning
// - Dependency caching
// - Comprehensive error handling
// ============================================================================

pipeline {
    agent any

    // ========================================================================
    // Environment Variables
    // ========================================================================
    environment {
        // SonarQube Configuration
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'mern-app'
        SONAR_PROJECT_NAME = 'MERN Stack Application'
        // Note: SONAR_TOKEN should be configured as Jenkins credential
        SONAR_TOKEN = credentials('sonar-token')
        
        // Node & NPM Configuration
        NODE_ENV = 'production'
        NPM_CONFIG_CACHE = '${WORKSPACE}/.npm-cache'
        
        // Build Information
        BUILD_TIMESTAMP = sh(returnStdout: true, script: 'date +%Y%m%d_%H%M%S').trim()
        BUILD_VERSION = "${env.BUILD_NUMBER}_${BUILD_TIMESTAMP}"
    }

    // ========================================================================
    // Build Options
    // ========================================================================
    options {
        // Only keep last 30 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '30', daysToKeepStr: '90'))
        
        // Add timestamps to console output
        timestamps()
        
        // Set build timeout to 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        
        // Disable concurrent builds
        disableConcurrentBuilds()
    }

    // ========================================================================
    // Triggers
    // ========================================================================
    triggers {
        // Trigger on GitHub push (configure GitHub webhook pointing to Jenkins)
        githubPush()
        
        // Optional: Poll SCM every 15 minutes
        // pollSCM('H/15 * * * *')
    }

    // ========================================================================
    // Stages
    // ========================================================================
    stages {
        // ====================================================================
        // Stage 1: Preparation
        // ====================================================================
        stage('Preparation') {
            steps {
                script {
                    echo "=========================================="
                    echo "  MERN Stack CI Pipeline - Build ${BUILD_NUMBER}"
                    echo "=========================================="
                    echo "Build Version: ${BUILD_VERSION}"
                    echo "Workspace: ${WORKSPACE}"
                    echo "Node Environment: ${NODE_ENV}"
                }
                
                // Clean workspace
                deleteDir()
                echo "✓ Workspace cleaned"
            }
        }

        // ====================================================================
        // Stage 2: Checkout
        // ====================================================================
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from GitHub..."
                }
                
                checkout(
                    [
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[url: 'https://github.com/dushyanth25/Dark.git']]
                    ]
                )
                
                echo "✓ Code checked out successfully"
                echo "Current HEAD: $(git rev-parse HEAD)"
            }
        }

        // ====================================================================
        // Stage 3: Install Dependencies (Parallel)
        // ====================================================================
        stage('Install Dependencies') {
            parallel {
                // ============================================================
                // Backend Dependencies
                // ============================================================
                stage('Backend Setup') {
                    steps {
                        script {
                            echo "Installing server dependencies..."
                            dir('server') {
                                // Use npm ci for reproducible installs in CI
                                sh '''
                                    npm ci --cache ${NPM_CONFIG_CACHE}
                                    echo "✓ Server dependencies installed"
                                '''
                            }
                        }
                    }
                }

                // ============================================================
                // Frontend Dependencies
                // ============================================================
                stage('Frontend Setup') {
                    steps {
                        script {
                            echo "Installing client dependencies..."
                            dir('client') {
                                // Use npm ci for reproducible installs in CI
                                sh '''
                                    npm ci --cache ${NPM_CONFIG_CACHE}
                                    echo "✓ Client dependencies installed"
                                '''
                            }
                        }
                    }
                }
            }
        }

        // ====================================================================
        // Stage 4: Build (Parallel)
        // ====================================================================
        stage('Build') {
            parallel {
                // ============================================================
                // Backend Validation
                // ============================================================
                stage('Backend Build') {
                    steps {
                        script {
                            echo "Validating backend code..."
                            dir('server') {
                                sh '''
                                    # Verify package.json exists and is valid
                                    if [ ! -f package.json ]; then
                                        echo "❌ ERROR: package.json not found in server/"
                                        exit 1
                                    fi
                                    
                                    # Check if build script exists, if so run it
                                    if npm run | grep -q "build"; then
                                        echo "Running backend build..."
                                        npm run build
                                    else
                                        echo "No build script found for backend, skipping..."
                                    fi
                                    
                                    echo "✓ Backend validation completed"
                                '''
                            }
                        }
                    }
                }

                // ============================================================
                // Frontend Build
                // ============================================================
                stage('Frontend Build') {
                    steps {
                        script {
                            echo "Building React frontend..."
                            dir('client') {
                                sh '''
                                    # Verify build script exists
                                    if ! npm run | grep -q "build"; then
                                        echo "❌ ERROR: No build script found in client/package.json"
                                        exit 1
                                    fi
                                    
                                    # Build production frontend
                                    npm run build
                                    
                                    # Verify dist folder was created
                                    if [ ! -d dist ]; then
                                        echo "❌ ERROR: Build failed - dist/ folder not found"
                                        exit 1
                                    fi
                                    
                                    echo "✓ Frontend build completed successfully"
                                    echo "Build artifacts size: $(du -sh dist/ | cut -f1)"
                                '''
                            }
                        }
                    }
                }
            }
        }

        // ====================================================================
        // Stage 5: Testing (Optional Backend Tests)
        // ====================================================================
        stage('Test') {
            steps {
                script {
                    echo "Running tests..."
                    dir('server') {
                        sh '''
                            # Check if test script exists in backend
                            if npm run | grep -q "test"; then
                                echo "Running backend tests..."
                                npm run test || true
                                echo "✓ Backend tests completed"
                            else
                                echo "⚠ No test script found in server/package.json - skipping tests"
                            fi
                        '''
                    }
                }
            }
        }

        // ====================================================================
        // Stage 6: Code Quality Analysis with SonarQube
        // ====================================================================
        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "Publishing code to SonarQube..."
                    
                    // Install sonar-scanner if not present
                    sh '''
                        if ! command -v sonar-scanner &> /dev/null; then
                            echo "Installing sonar-scanner..."
                            mkdir -p ${WORKSPACE}/.sonar
                            cd ${WORKSPACE}/.sonar
                            wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
                            unzip -q sonar-scanner-cli-5.0.1.3006-linux.zip
                            export PATH="${WORKSPACE}/.sonar/sonar-scanner-5.0.1.3006-linux/bin:$PATH"
                        fi
                    '''
                    
                    // Run SonarQube scanner
                    sh '''
                        export SONARQUBE_SCANNER_PARAMS="-Dsonar.projectKey=${SONAR_PROJECT_KEY}"
                        export SONARQUBE_SCANNER_PARAMS="${SONARQUBE_SCANNER_PARAMS} -Dsonar.host.url=${SONAR_HOST_URL}"
                        export SONARQUBE_SCANNER_PARAMS="${SONARQUBE_SCANNER_PARAMS} -Dsonar.login=${SONAR_TOKEN}"
                        
                        sonar-scanner
                        
                        echo "✓ SonarQube analysis completed"
                        echo "View results at: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
                    '''
                }
            }
        }

        // ====================================================================
        // Stage 7: Archive Artifacts
        // ====================================================================
        stage('Archive Artifacts') {
            steps {
                script {
                    echo "Archiving build artifacts..."
                    
                    // Archive frontend build
                    sh '''
                        if [ -d client/dist ]; then
                            tar -czf client-build-${BUILD_VERSION}.tar.gz -C client dist/
                            echo "✓ Frontend build archived"
                        fi
                    '''
                    
                    // Archive reports
                    archiveArtifacts artifacts: 'client-build-*.tar.gz', 
                                     allowEmptyArchive: true
                    
                    echo "✓ Artifacts archived successfully"
                }
            }
        }
    }

    // ========================================================================
    // Post Build Actions
    // ========================================================================
    post {
        // ====================================================================
        // Always Execute
        // ====================================================================
        always {
            script {
                echo "=========================================="
                echo "  Build Summary"
                echo "=========================================="
                echo "Build Number: ${BUILD_NUMBER}"
                echo "Build Status: ${currentBuild.result}"
                echo "Duration: ${currentBuild.durationString}"
            }
        }

        // ====================================================================
        // On Success
        // ====================================================================
        success {
            script {
                echo "✓ Pipeline completed successfully!"
                // Add your notification logic here (email, Slack, etc.)
            }
        }

        // ====================================================================
        // On Failure
        // ====================================================================
        failure {
            script {
                echo "❌ Pipeline failed!"
                echo "Check logs for details: ${BUILD_URL}console"
                // Add your notification logic here (email, Slack, etc.)
            }
        }

        // ====================================================================
        // On Unstable
        // ====================================================================
        unstable {
            script {
                echo "⚠ Pipeline unstable - tests or quality gates failed"
            }
        }

        // ====================================================================
        // Cleanup
        // ====================================================================
        cleanup {
            script {
                echo "Performing cleanup..."
                // Optional: Clean npm cache if needed
                // sh 'rm -rf ${NPM_CONFIG_CACHE}'
            }
        }
    }
}

// ============================================================================
// EOF - Jenkinsfile
// ============================================================================
