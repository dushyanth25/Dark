# MERN Stack CI/CD Pipeline - Complete Setup Architecture

## 📋 Document Overview

This document provides a complete overview of the CI/CD pipeline setup for your MERN stack project. It includes file descriptions, setup instructions, and best practices.

---

## 🗂️ CI/CD Pipeline Files

### Files Created for CI/CD Setup

```
/
├── Jenkinsfile                          # Jenkins declarative pipeline definition
├── sonar-project.properties             # SonarQube configuration
├── docker-compose.yml                   # Docker Compose for Jenkins + SonarQube
├── .gitignore                           # Git ignore file (updated for CI/CD)
├── .env.example                         # Environment variables template
├── CI_CD_SETUP_GUIDE.md                # Comprehensive setup guide (THIS FILE)
└── CI_CD_QUICK_REFERENCE.md            # Quick reference commands
```

---

## 📄 File Descriptions

### 1. **Jenkinsfile** (Production-Ready CI Pipeline)

**Purpose:** Defines the complete CI/CD pipeline in declarative syntax

**Key Features:**
- ✅ Declarative pipeline syntax (vs scripted)
- ✅ Parallel dependency installation (client & server)
- ✅ Frontend build with optimization
- ✅ SonarQube integration for code quality
- ✅ Artifact archiving
- ✅ Comprehensive error handling
- ✅ Build caching for npm dependencies
- ✅ Clean workspace on each build

**Stages:**
1. **Preparation** - Workspace cleaning
2. **Checkout** - Git clone from GitHub
3. **Install Dependencies** - Parallel: Frontend + Backend
4. **Build** - Parallel: Backend validation + Frontend build
5. **Test** - Optional backend tests
6. **SonarQube Analysis** - Code quality scanning
7. **Archive Artifacts** - Store build outputs

**Environment Variables Set:**
- `SONAR_HOST_URL` = http://localhost:9000
- `SONAR_PROJECT_KEY` = mern-app
- `NODE_ENV` = production
- `NPM_CONFIG_CACHE` = .npm-cache

**Key Practices:**
- Uses `npm ci` instead of `npm install` (reproducible builds)
- Does NOT run `npm run dev` (no dev servers)
- Uses parallel stages for faster builds
- Captures build artifacts
- Proper timeout handling (30 minutes)

---

### 2. **sonar-project.properties** (SonarQube Configuration)

**Purpose:** Configures SonarQube scanner behavior

**Key Sections:**
- Project identification (key, name, version)
- Source code locations (client/src, server/src)
- File inclusion/exclusion patterns
- Language-specific settings
- Coverage configuration
- Quality gate setup

**Important Settings:**
```properties
sonar.projectKey=mern-app                    # Unique identifier
sonar.sources=client/src,server/src          # Directories to scan
sonar.exclusions=**/node_modules/**,...      # Exclude dependencies
sonar.inclusions=**/*.js,**/*.jsx,...        # Include patterns
```

**Coverage Reports:**
Can be uncommented to integrate with Jest coverage:
```properties
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info
```

---

### 3. **docker-compose.yml** (Container Orchestration)

**Purpose:** Define and run Jenkins and SonarQube containers

**Services:**
```yaml
jenkins:
  - Port: 8080 (Web UI) + 50000 (Agents)
  - Volume: jenkins_home (persistent data)
  - Network: ci_network
  - Health check: Built-in
  
sonarqube:
  - Port: 9000 (Web UI) + 9092 (Internal)
  - Volumes: sonarqube_data, sonarqube_logs, sonarqube_extensions
  - Network: ci_network
  - Health check: Built-in
```

**Networks:**
- Custom bridge network: `ci_network` (172.20.0.0/16)
- Allows services to communicate by name (jenkins → sonarqube)

**Volumes:**
- `jenkins_home` - Jenkins configuration and build history
- `sonarqube_data` - SonarQube database and indexes
- `sonarqube_logs` - Application logs
- `sonarqube_extensions` - Installed plugins

**Usage:**
```bash
docker-compose up -d                # Start all services
docker-compose down                 # Stop services
docker-compose down -v             # Stop and remove volumes
docker-compose logs -f             # View live logs
```

---

### 4. **.gitignore** (Git Configuration)

**Purpose:** Prevent sensitive files and build artifacts from being committed

**Key Exclusions:**
- `node_modules/` - Dependencies
- `dist/`, `build/` - Build artifacts
- `.env` - Environment files with secrets
- `.idea/`, `.vscode/` - IDE files
- `coverage/`, `.nyc_output/` - Test coverage
- `.sonar/`, `.scannerwork/` - CI/CD artifacts
- `*.log` - Log files
- OS-specific files (Thumbs.db, .DS_Store)

**Why Important:**
- Prevents accidental secrets exposure
- Keeps repository clean
- Reduces repo size
- Improves clone/fetch performance

---

### 5. **.env.example** (Environment Variables Template)

**Purpose:** Document all environment variables needed

**Sections Include:**
- **Node Configuration** - NODE_ENV, ports
- **Database** - MongoDB connection
- **Authentication** - JWT secrets
- **API Keys** - Groq, OpenAI, etc.
- **Email** - SMTP configuration
- **OAuth** - Google, GitHub credentials
- **Frontend Config** - React app settings
- **CI/CD** - SonarQube, Jenkins tokens
- **Security** - CORS, HTTPS settings

**Usage Instructions:**
```bash
# Copy template to actual .env file
cp .env.example .env

# Fill in your actual values
nano .env

# .env is in .gitignore, so it won't be committed
```

**For Developers:**
- Copy .env.example to .env
- Fill in values for local development
- Never commit .env file

**For CI/CD:**
- Set environment variables in Jenkins
- Use Jenkins credentials for secrets
- Override defaults in pipeline

---

### 6. **CI_CD_SETUP_GUIDE.md** (Comprehensive Setup Documentation)

**Purpose:** Detailed step-by-step setup instructions

**Covers:**
1. Prerequisites and tools needed
2. Docker container setup (Jenkins & SonarQube)
3. Git initialization and GitHub push
4. Jenkins configuration and job creation
5. SonarQube setup and token generation
6. Pipeline execution and monitoring
7. Troubleshooting common issues
8. Best practices summary
9. References and useful commands

**Key Sections:**
- Docker commands with detailed explanations
- GitHub PAT (Personal Access Token) creation
- Jenkins credentials setup
- SonarQube project creation
- Quality gate configuration
- Webhook setup for automatic triggers

---

### 7. **CI_CD_QUICK_REFERENCE.md** (Quick Reference Card)

**Purpose:** Copy-paste ready commands for common tasks

**Includes:**
- Quick start Docker commands
- Git setup and push commands
- Container management commands
- URLs and credentials summary
- Common issues and fixes
- Pipeline workflow diagram
- Useful git commands

**Best For:**
- Quick lookup during setup
- Copy-paste command execution
- Jumping back in after time away
- Quick reference during troubleshooting

---

## 🔄 Complete Setup Workflow

### Step 1: Prepare Your Environment (5 minutes)

```bash
# 1. Navigate to project root
cd /path/to/Dark

# 2. Create .env from template
cp .env.example .env
# Edit .env with your values

# 3. Verify project structure
ls -la | grep -E "client|server|Jenkinsfile|sonar"
```

### Step 2: Start Docker Containers (2 minutes)

```bash
# Option A: Using Docker Compose (Recommended)
docker-compose up -d

# Option B: Using individual docker run commands
# See CI_CD_SETUP_GUIDE.md for details
```

### Step 3: Configure Jenkins (15 minutes)

```bash
# 1. Get Jenkins initial password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 2. Open http://localhost:8080 in browser
# 3. Enter password and install recommended plugins
# 4. Create admin user
# 5. Add credentials (GitHub token + SonarQube token)
```

### Step 4: Configure SonarQube (10 minutes)

```bash
# 1. Open http://localhost:9000 in browser
# 2. Login with admin / admin
# 3. Create project with key: mern-app
# 4. Generate token in User > My Account > Security
```

### Step 5: Initialize Git and Push to GitHub (5 minutes)

```bash
cd /path/to/Dark

# Initialize repository
git init
git add .
git commit -m "Initial commit: MERN stack with CI/CD pipeline"

# Add remote
git remote add origin https://github.com/dushyanth25/Dark.git
git branch -M main
git push -u origin main
```

### Step 6: Create Jenkins Pipeline Job (10 minutes)

```bash
# In Jenkins UI:
# 1. New Item > Pipeline
# 2. Name: mern-app-pipeline
# 3. Pipeline > Definition: Pipeline script from SCM
# 4. SCM: Git
# 5. Repository URL: https://github.com/dushyanth25/Dark.git
# 6. Credentials: (select your GitHub credentials)
# 7. Branch: */main
# 8. Script Path: Jenkinsfile
```

### Step 7: Test Pipeline (2 minutes)

```bash
# In Jenkins UI:
# 1. Select mern-app-pipeline job
# 2. Click "Build Now"
# 3. Monitor build progress
# 4. Check SonarQube results at http://localhost:9000
```

---

## 📊 Pipeline Architecture Diagram

```
                        Developer Push to GitHub
                                  |
                                  v
                        ┌─────────────────────┐
                        │  GitHub Repository  │
                        └─────────────────────┘
                                  |
                    (Webhook or Manual Trigger)
                                  |
                                  v
                        ┌─────────────────────┐
                        │   Jenkins Server    │
                        │   (Port 8080)       │
                        └─────────────────────┘
                                  |
                    ┌─────────────┼─────────────┐
                    |             |             |
                    v             v             v
            ┌───────────────┐ ┌──────────────┐ ┌──────────┐
            │  Checkout    │ │ Install Deps │ │  Build   │
            │  (Git Clone) │ │  (Parallel)  │ │ (Parallel)
            └───────────────┘ └──────────────┘ └──────────┘
                    |             |             |
                    └─────────────┼─────────────┘
                                  |
                                  v
                        ┌─────────────────────┐
                        │   Test & Quality    │
                        │    SonarQube        │
                        │  (Port 9000)        │
                        └─────────────────────┘
                                  |
                    ┌─────────────┴─────────────┐
                    |                           |
              ✅ SUCCESS                    ❌ FAILURE
                    |                           |
                    v                           v
            ┌───────────────┐         ┌─────────────────┐
            │   Archive     │         │  Notify Team    │
            │  Artifacts    │         │  (Slack/Email)  │
            └───────────────┘         └─────────────────┘
                    |
                    v
            ┌───────────────┐
            │   Ready for   │
            │  Deployment   │
            └───────────────┘
```

---

## 🎯 Key Design Decisions

### 1. **Declarative Pipeline Syntax**
- **Why:** More readable, version-controlled, easier to maintain
- **Alternative:** Scripted pipeline (more flexible but complex)

### 2. **Parallel Stages for Installation & Build**
- **Why:** Faster builds (frontend and backend compile simultaneously)
- **Impact:** ~50% faster build times

### 3. **npm ci Instead of npm install**
- **Why:** Reproducible builds, exact dependency versions
- **Alternative:** npm install (can vary dependency versions)

### 4. **No Dev Servers in Pipeline**
- **Why:** CI pipeline should only build, not run services
- **Why:** Dev servers are for local development/testing

### 5. **SonarQube Integration**
- **Why:** Continuous code quality monitoring
- **Features:** Bug detection, security analysis, technical debt tracking

### 6. **Docker Compose for Local Setup**
- **Why:** Easy one-command setup for entire pipeline infrastructure
- **Alternative:** Manual container management (more complex)

---

## ⚙️ Configuration Reference

| Component | Port | URL | Default Credentials |
|-----------|------|-----|-------------------|
| Jenkins | 8080 | http://localhost:8080 | Initially passworded |
| SonarQube | 9000 | http://localhost:9000 | admin / admin |
| Backend | 5000 | http://localhost:5000 | Varies |
| Frontend | 3000/5173 | http://localhost:3000 | None |

---

## 📈 Performance Optimization Tips

### 1. **Reduce Build Time**
```bash
# Cache npm packages
npm ci --cache ${NPM_CONFIG_CACHE}

# Use parallel stages (already in Jenkinsfile)
# Parallel install: ~40-60% faster

# Use SSD for Jenkins workspace
# Better I/O performance
```

### 2. **Reduce Memory Usage**
```bash
# Adjust Java heap sizes in docker-compose.yml
JAVA_OPTS=-Xmx512m -Xms256m
```

### 3. **Optimize SonarQube**
```bash
# Increase database performance
# Use PostgreSQL instead of embedded DB for production
```

### 4. **Reduce Network Calls**
```bash
# Use npm cache
# Pre-warm dependency cache
# Use npm mirror (different region)
```

---

## 🔐 Security Best Practices

### 1. **Secrets Management**
```bash
# Never commit secrets
# Use Jenkins credentials
# Rotate tokens regularly
# Use environment variables for CI/CD
```

### 2. **Repository Security**
```bash
# Use branch protection rules
# Require PR reviews
# Enable status checks (SonarQube, tests)
# Restrict who can push to main
```

### 3. **Container Security**
```bash
# Use specific image tags (not latest)
# Scan images for vulnerabilities
# Keep images updated
# Use read-only file systems where possible
```

### 4. **Access Control**
```bash
# Limit Jenkins access to specific users
# Use GitHub PAT with minimal scopes
# Rotate SonarQube tokens regularly
# Use SSH keys for Git over HTTPS tokens
```

---

## 🐛 Common Troubleshooting

### Issue: "Cannot connect to Docker socket"
```bash
# Solution: Add Jenkins to docker group
docker exec jenkins usermod -aG docker jenkins
docker restart jenkins
```

### Issue: "SonarQube takes too long to start"
```bash
# Normal behavior (1-2 minutes first time)
# Wait and check: curl http://localhost:9000
# View logs: docker logs -f sonarqube
```

### Issue: "sonar-scanner not found"
```bash
# Installed automatically in Jenkinsfile
# Or manually install (see CI_CD_SETUP_GUIDE.md)
```

### Issue: "npm ci: command not found"
```bash
# npm should be installed in Jenkins container
# Verify: docker exec jenkins npm --version
# If missing: docker exec jenkins apt-get install -y nodejs npm
```

---

## 📚 Additional Resources

### Documentation Links
- [Jenkins Declarative Pipeline](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [SonarQube Scanner](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)

### Tools & References
- GitHub Personal Access Token: https://github.com/settings/tokens
- Jenkins Credential Types: http://localhost:8080/manage/credentials/store/system/domain/_/
- SonarQube Quality Gates: http://localhost:9000/admin/settings/quality_gates

---

## 🎓 Next Steps

### Immediate (Day 1)
- ✅ Set up Docker containers
- ✅ Initialize Jenkins and SonarQube
- ✅ Create Jenkins pipeline job
- ✅ Run first pipeline build

### Short Term (Week 1)
- Add GitHub webhook for automatic triggering
- Configure quality gates
- Set up notifications (Slack/Email)
- Document team procedures

### Medium Term (Month 1)
- Integrate test coverage reporting
- Set up performance benchmarking
- Configure automated alerts on failures
- Document best practices for team

### Long Term (Quarter 1+)
- Migrate to hosted CI/CD (if needed)
- Implement artifact repository
- Set up deployment automation
- Monitor pipeline metrics

---

## 📞 Support & Getting Help

### For Setup Issues
1. Check the Troubleshooting section above
2. Review CI_CD_SETUP_GUIDE.md
3. Check Docker logs: `docker logs <container>`
4. Check Jenkins logs: `http://localhost:8080/log`

### For Pipeline Issues
1. Check SonarQube results: http://localhost:9000
2. Review Jenkins build logs
3. Check git history for recent changes
4. Verify package.json build scripts

### For Performance Issues
1. Monitor resource usage: `docker stats`
2. Check disk space: `df -h`
3. Review build logs for bottlenecks
4. Consider upgrading resources

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-16 | Initial release - Complete CI/CD pipeline setup |

---

## ✨ Custom Enhancements (Optional)

Consider adding these for advanced setups:

### 1. **Artifact Repository**
```bash
# Nexus or Artifactory for storing builds
```

### 2. **Automated Deployment**
```bash
# Add deployment stage after successful build
# Target: staging or production environment
```

### 3. **Performance Monitoring**
```bash
# Prometheus + Grafana for metrics
# Track build times, success rates
```

### 4. **Advanced Security**
```bash
# OWASP dependency check
# SAST (Static Application Security Testing)
# Container scanning
```

### 5. **Multi-Branch Pipeline**
```bash
# Automatically create pipelines for all branches
# Environment-specific configuration
```

---

**Document Generated:** 2026-04-16  
**Status:** Production Ready  
**Maintained By:** DevOps Team  

---
