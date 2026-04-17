# ============================================================================
# MERN Stack CI/CD Pipeline Setup Guide
# ============================================================================
# This comprehensive guide provides all commands and configurations needed
# to set up a production-ready CI pipeline with Jenkins and SonarQube
# ============================================================================

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Docker Setup](#docker-setup)
3. [Git Initialization and Push](#git-initialization)
4. [Jenkins Configuration](#jenkins-configuration)
5. [SonarQube Configuration](#sonarqube-configuration)
6. [Pipeline Execution](#pipeline-execution)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have the following installed:
- Docker and Docker Compose
- Git
- GitHub account and repository
- Jenkins container running (instructions below)
- SonarQube container running (instructions below)

---

## Docker Setup

### 1. Run Jenkins Container

```bash
# Pull the latest Jenkins image
docker pull jenkins/jenkins:lts

# Run Jenkins container
docker run -d \
  --name jenkins \
  --publish 8080:8080 \
  --publish 50000:50000 \
  --volume jenkins_home:/var/jenkins_home \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --env JENKINS_OPTS="--httpPort=8080" \
  jenkins/jenkins:lts

# Get initial admin password (needed for first login)
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Jenkins will be available at: http://localhost:8080
```

**Important Notes:**
- First login requires the admin password from above
- Install recommended plugins when prompted
- Create an admin user
- Configure Jenkins URL to `http://localhost:8080`

---

### 2. Run SonarQube Container

```bash
# Pull the latest SonarQube image
docker pull sonarqube:latest

# Create named volume for SonarQube data persistence
docker volume create sonarqube_data
docker volume create sonarqube_logs

# Run SonarQube container
docker run -d \
  --name sonarqube \
  --publish 9000:9000 \
  --publish 9092:9092 \
  --volume sonarqube_data:/opt/sonarqube/data \
  --volume sonarqube_logs:/opt/sonarqube/logs \
  --env sonar.web.javaAdditionalOpts="-Dsonar.web.systemPasscode=admin" \
  sonarqube:latest

# SonarQube will be available at: http://localhost:9000
# Default credentials: admin / admin
```

**Important Notes:**
- First login uses admin / admin (change password immediately)
- Give SonarQube 1-2 minutes to fully start
- Check status: `docker logs sonarqube`

---

### 3. Optional: Docker Compose (Recommended for production)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JENKINS_OPTS=--httpPort=8080
    networks:
      - ci_network
    restart: unless-stopped

  sonarqube:
    image: sonarqube:latest
    container_name: sonarqube
    ports:
      - "9000:9000"
      - "9092:9092"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
    environment:
      - sonar.web.javaAdditionalOpts=-Dsonar.web.systemPasscode=admin
    networks:
      - ci_network
    restart: unless-stopped

volumes:
  jenkins_home:
  sonarqube_data:
  sonarqube_logs:

networks:
  ci_network:
    driver: bridge
```

**Run with Docker Compose:**

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f jenkins
docker-compose logs -f sonarqube

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

### 4. Stop and Remove Containers

```bash
# Stop containers
docker stop jenkins sonarqube

# Remove containers
docker rm jenkins sonarqube

# Remove volumes (WARNING: deletes all data)
docker volume rm jenkins_home sonarqube_data sonarqube_logs

# Clean up all
docker system prune -a
```

---

## Git Initialization and Push

### 1. Initialize Git Repository

```bash
# Navigate to project root
cd /path/to/Dark

# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: MERN stack with CI/CD pipeline"
```

### 2. Add GitHub Remote

```bash
# Add remote repository
git remote add origin https://github.com/dushyanth25/Dark.git

# Verify remote
git remote -v
```

### 3. Create and Switch to Main Branch (if needed)

```bash
# Rename branch to main (if currently on master)
git branch -M main

# Or just create main branch
git checkout -b main
```

### 4. Push to GitHub

```bash
# Push to GitHub (first time)
git push -u origin main

# Subsequent pushes
git push origin main
```

### 5. Verify Push

```bash
# Verify remote branches
git branch -r

# Check remote URL
git remote -v

# View git log
git log --oneline
```

---

## Jenkins Configuration

### 1. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token"
3. Select scopes:
   - ✓ repo (full control of private repositories)
   - ✓ admin:repo_hook (write access to hooks)
   - ✓ admin:org_hook (write access to org hooks)
4. Generate and copy token (save it securely!)

---

### 2. Configure Jenkins Credentials

1. Go to `http://localhost:8080`
2. Click "Manage Jenkins" → "Manage Credentials"
3. Click "System" → "Global credentials"
4. Click "Add Credentials"
5. Create GitHub credential:
   - Kind: Username with password
   - Username: your-github-username
   - Password: (paste the token from step 1)
   - ID: github-credentials
   - Description: GitHub Access Token

6. Create SonarQube credential:
   - Kind: Secret text
   - Secret: (your SonarQube token - see SonarQube section)
   - ID: sonar-token
   - Description: SonarQube Token

---

### 3. Create Jenkins Pipeline Job

1. Click "New Item"
2. Enter job name: `mern-app-pipeline`
3. Select "Pipeline"
4. Click "OK"
5. Configure Pipeline:

```
Definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/dushyanth25/Dark.git
Credentials: github-credentials (from step 2)
Branch Specifier: */main
Script Path: Jenkinsfile
Lightweight checkout: ✓ (checked)
```

6. Click "Save"

---

### 4. Configure GitHub Webhook (Optional but Recommended)

On GitHub Repository:
1. Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - Payload URL: `http://YOUR_JENKINS_URL:8080/github-webhook/`
   - Content type: application/json
   - Events: Push events
   - Active: ✓ (checked)
4. Click "Add webhook"

---

## SonarQube Configuration

### 1. Access SonarQube

```bash
# Open in browser
# http://localhost:9000

# Default credentials
Username: admin
Password: admin
```

### 2. Create SonarQube Project

1. Click "Create project"
2. Select "Manually"
3. Project key: `mern-app`
4. Project name: `MERN Stack Application`
5. Click "Set Up" next to "Baseline"
6. Setup Step 1:
   - Select "Main branch"
   - Click "Create project"
7. Successfully created!

### 3. Generate SonarQube Token

1. Go to User Menu → My Account → Security
2. Click "Generate Tokens"
3. Enter token name: `jenkins-sonar-token`
4. Click "Generate"
5. Copy the token (you'll need it for Jenkins credential)

**Store this token in Jenkins as described in Jenkins Configuration section**

---

### 4. Configure Quality Gate (Optional)

1. Go to Quality Gates
2. Create or select default quality gate
3. Set conditions (examples):
   - Code Coverage: >= 80%
   - Duplicated Lines: < 3%
   - Blocker Issues: 0
4. Set as default

---

## Pipeline Execution

### 1. Manual Pipeline Trigger

1. Go to `http://localhost:8080`
2. Select job `mern-app-pipeline`
3. Click "Build Now"
4. Monitor progress in "Build History"
5. Click build number to view logs

---

### 2. Automated Triggers

Pipeline automatically runs when:
- Code is pushed to GitHub (via webhook)
- Scheduled (if configured with cron)

---

### 3. Monitor Build Logs

```bash
# In Jenkins UI:
# Click on build number → Console Output

# Via Docker:
docker logs -f jenkins

# Via Jenkins CLI:
java -jar jenkins-cli.jar -s http://localhost:8080 console mern-app-pipeline BUILD_NUMBER
```

---

### 4. View SonarQube Results

After successful pipeline:

1. Go to `http://localhost:9000`
2. Navigate to "Projects"
3. Click on `mern-app`
4. View results:
   - Code coverage
   - Bugs and vulnerabilities
   - Code smells
   - Duplications
   - Hotspots

---

## Troubleshooting

### Jenkins Issues

#### Issue: "Cannot connect to Docker"

```bash
# Check Docker permissions
sudo usermod -aG docker $(whoami)
newgrp docker

# Verify Docker socket
ls -la /var/run/docker.sock

# Restart Docker
sudo systemctl restart docker
```

#### Issue: "sonar-scanner not found"

```bash
# Manual installation
mkdir -p ~/.sonar
cd ~/.sonar
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH="$PATH:~/.sonar/sonar-scanner-5.0.1.3006-linux/bin"

# Verify
sonar-scanner --version
```

#### Issue: "npm ci: command not found"

```bash
# Ensure Node.js is installed in Jenkins container
docker exec jenkins apt-get update
docker exec jenkins apt-get install -y nodejs npm

# Verify
docker exec jenkins node --version
docker exec jenkins npm --version
```

#### Issue: "Git repository not found"

```bash
# Check repository URL
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/dushyanth25/Dark.git

# Test connection
git ls-remote origin HEAD
```

### SonarQube Issues

#### Issue: "SonarQube is not responding"

```bash
# Check container status
docker ps | grep sonarqube

# View logs
docker logs sonarqube

# Wait 1-2 minutes for startup, then retry
sleep 120
curl http://localhost:9000
```

#### Issue: "Authentication failed"

```bash
# Verify SonarQube credentials
# Reset admin password in SonarQube UI:
# Admin menu → Security → Users → admin → Reset password

# Regenerate token if needed (see SonarQube Configuration)
```

#### Issue: "No coverage reports found"

```bash
# Check if coverage files exist
find . -name "*.lcov" -o -name "coverage.xml"

# Generate coverage in package.json:
"test": "jest --coverage"

# Uncomment coverage paths in sonar-project.properties
```

### Network Issues

#### Issue: "Cannot reach Jenkins from another machine"

```bash
# Check firewall
sudo ufw allow 8080/tcp
sudo ufw allow 9000/tcp

# Get container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' jenkins

# Test from another machine
curl http://YOUR_MACHINE_IP:8080
```

---

## Best Practices Summary

✓ Use `npm ci` instead of `npm install` for reproducible builds
✓ Never run `npm run dev` in CI pipeline
✓ Use parallel stages for faster builds
✓ Cache dependencies to speed up builds
✓ Clean workspace before each build
✓ Archive build artifacts for traceability
✓ Generate and store SonarQube tokens securely
✓ Configure quality gates to enforce standards
✓ Use GitHub webhooks for automatic triggers
✓ Regularly review SonarQube reports
✓ Keep Jenkins and SonarQube updated

---

## Useful Commands Reference

```bash
# Jenkins
docker exec -it jenkins bash
docker logs -f jenkins
docker restart jenkins

# SonarQube
docker exec -it sonarqube bash
docker logs -f sonarqube
docker restart sonarqube

# Git
git status
git log --oneline
git diff
git branch
git remote -v

# NPM
npm list
npm outdated
npm audit
npm cache clean --force
```

---

## References

- Jenkins Documentation: https://www.jenkins.io/doc/
- SonarQube Documentation: https://docs.sonarqube.org/latest/
- Docker Documentation: https://docs.docker.com/
- GitHub Webhooks: https://docs.github.com/en/developers/webhooks-and-events/webhooks
- Declarative Pipeline: https://www.jenkins.io/doc/book/pipeline/syntax/

---

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Jenkins/SonarQube logs
3. Consult official documentation
4. Check GitHub issues in the repository

---

**Generated:** 2026-04-16
**Pipeline Version:** 1.0.0
**Status:** Production Ready

