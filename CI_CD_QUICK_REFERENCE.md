# Quick Reference: CI/CD Commands

## 🚀 Quick Start (Copy-Paste Ready)

### 1️⃣ Start Docker Containers

```bash
# Jenkins (port 8080)
docker run -d --name jenkins --publish 8080:8080 --publish 50000:50000 \
  --volume jenkins_home:/var/jenkins_home \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get Jenkins password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# SonarQube (port 9000)
docker run -d --name sonarqube --publish 9000:9000 --publish 9092:9092 \
  --volume sonarqube_data:/opt/sonarqube/data \
  --volume sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:latest
```

### 2️⃣ Git Setup & Push

```bash
# Initialize and push to GitHub
cd /path/to/Dark
git init
git add .
git commit -m "Initial commit: MERN stack with CI/CD pipeline"
git remote add origin https://github.com/dushyanth25/Dark.git
git branch -M main
git push -u origin main
```

---

## 📋 Container Management

| Command | Purpose |
|---------|---------|
| `docker ps` | List running containers |
| `docker logs -f jenkins` | View Jenkins logs (live) |
| `docker logs -f sonarqube` | View SonarQube logs (live) |
| `docker stop jenkins sonarqube` | Stop containers |
| `docker rm jenkins sonarqube` | Remove containers |
| `docker exec jenkins bash` | Shell into Jenkins |
| `docker exec sonarqube bash` | Shell into SonarQube |

---

## 🔑 Critical Configuration Steps

### Jenkins Setup
1. Open `http://localhost:8080`
2. Enter admin password (from docker exec command above)
3. Install recommended plugins
4. Create admin user
5. Manage Jenkins → Manage Credentials → Add:
   - GitHub token (as "Username with password")
   - SonarQube token (as "Secret text")

### SonarQube Setup
1. Open `http://localhost:9000`
2. Login: admin / admin
3. Create project (key: `mern-app`, name: `MERN Stack Application`)
4. Generate token: User → My Account → Security → Generate Tokens
5. Copy token to Jenkins credentials

### Jenkins Job Setup
1. New Item → Pipeline
2. Name: `mern-app-pipeline`
3. Pipeline → Definition: Pipeline script from SCM
4. SCM: Git
5. Repository URL: `https://github.com/dushyanth25/Dark.git`
6. Credentials: (select GitHub credentials)
7. Branch: `*/main`
8. Script Path: `Jenkinsfile`
9. Save and Build Now

---

## 🧪 Verify Setup

```bash
# Check Jenkins
curl http://localhost:8080

# Check SonarQube
curl http://localhost:9000

# Verify Git remote
git remote -v

# Check if Jenkinsfile exists
ls -la Jenkinsfile

# Check if sonar-project.properties exists
ls -la sonar-project.properties
```

---

## 📊 Pipeline Workflow

```
User Push to GitHub
        ↓
GitHub Webhook (optional)
        ↓
Jenkins Trigger
        ↓
Checkout Code
        ↓
Install Dependencies (parallel)
  ├─ Backend: npm ci (server/)
  └─ Frontend: npm ci (client/)
        ↓
Build (parallel)
  ├─ Backend: validation
  └─ Frontend: npm run build → dist/
        ↓
Test (optional)
  └─ Backend: npm run test
        ↓
SonarQube Analysis
  ├─ Code quality scan
  └─ Results at http://localhost:9000
        ↓
Archive Artifacts
        ↓
Success / Failure Report
```

---

## ⚠️ Common Issues & Fixes

### "Cannot connect to Docker"
```bash
sudo usermod -aG docker $(whoami)
newgrp docker
sudo systemctl restart docker
```

### "sonar-scanner not found"
```bash
mkdir -p ~/.sonar && cd ~/.sonar
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH="$PATH:~/.sonar/sonar-scanner-5.0.1.3006-linux/bin"
```

### "npm ci: command not found"
```bash
docker exec jenkins apt-get update
docker exec jenkins apt-get install -y nodejs npm
```

### "SonarQube not responding"
```bash
docker logs sonarqube
# Wait 1-2 minutes for startup
sleep 120 && curl http://localhost:9000
```

---

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Jenkins | http://localhost:8080 | admin / (initial password) |
| SonarQube | http://localhost:9000 | admin / admin |
| GitHub | https://github.com/dushyanth25/Dark | your-credentials |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `Jenkinsfile` | CI/CD pipeline definition |
| `sonar-project.properties` | SonarQube configuration |
| `CI_CD_SETUP_GUIDE.md` | Detailed setup guide |

---

## 🔄 Useful Git Commands

```bash
git status                    # View changes
git log --oneline            # View commit history
git branch -a                # View all branches
git remote -v               # View remote repositories
git diff                    # View file differences
git add .                   # Stage all changes
git commit -m "message"     # Commit changes
git push origin main        # Push to GitHub
git pull origin main        # Pull from GitHub
```

---

**Quick Reference Card | Version 1.0 | Production Ready**

