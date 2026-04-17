# Kubernetes Secrets Setup Guide

## 📋 Overview

Instead of hardcoding secrets in YAML files, you can use environment variables with the `.env` file to create Kubernetes secrets securely.

**Key Benefits:**
✅ Never commit real secrets to Git  
✅ Easy to manage locally and in CI/CD  
✅ Works seamlessly with kubectl  
✅ `.env` is gitignored automatically  

---

## 🔧 Setup Process

### Step 1: Configure `.env` File

The `.env` file in `k8s/` directory contains your actual secrets:

```bash
cat k8s/.env
```

**Contents:**
```bash
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority"
JWT_SECRET="your-secret-key"
GROQ_API_KEY="your-groq-key"
```

**⚠️ IMPORTANT:** This file is `gitignored` - it will NOT be committed to Git!

---

### Step 2: Create Kubernetes Secrets

**Option A: Using the helper script (RECOMMENDED)**

```bash
cd k8s
bash setup-secrets.sh
```

**What it does:**
1. Loads variables from `.env`
2. Creates namespace `mern` if it doesn't exist
3. Runs kubectl create secret with your variables
4. Updates existing secrets if they already exist

**Output:**
```
🔐 Setting up Kubernetes Secrets...
📄 Loading environment variables from k8s/.env...
✓ Checking variables...
✓ MONGO_URI: loaded
✓ JWT_SECRET: loaded
✓ GROQ_API_KEY: loaded

📦 Checking namespace 'mern'...
✓ Namespace 'mern' ready

🔑 Creating Kubernetes secrets...
secret/mern-app-secrets configured

✅ Secrets created successfully!

📋 Verify:
   kubectl get secret mern-app-secrets -n mern
   kubectl get secret mern-app-secrets -n mern -o yaml
```

---

**Option B: Manual command (if you prefer)**

```bash
# 1. Source the .env file
source k8s/.env

# 2. Create secrets using kubectl
kubectl create secret generic mern-app-secrets \
  --from-literal=MONGO_URI="$MONGO_URI" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  -n mern \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

### Step 3: Verify Secrets

```bash
# List secrets
kubectl get secret mern-app-secrets -n mern

# View secret in YAML (base64 encoded)
kubectl get secret mern-app-secrets -n mern -o yaml

# Decode a specific secret (example)
kubectl get secret mern-app-secrets -n mern \
  -o jsonpath='{.data.JWT_SECRET}' | base64 --decode
```

---

### Step 4: Deploy Application

```bash
# Apply all K8s manifests
kubectl apply -f k8s/

# Or restart existing deployment to pick up new secrets
kubectl rollout restart deployment/mern-app -n mern
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep `.env` locally only
- `.gitignore` prevents accidental commits
- For CI/CD, use Jenkins/GitHub Secrets
- Rotate secrets regularly
- Use different secrets per environment

### ❌ DON'T:
- Commit `.env` to Git
- Hardcode secrets in deployment.yaml
- Use `latest` tag for images
- Store secrets in logs
- Use weak JWT secrets

---

## 🔄 How It Works

```
┌─────────────────────────────────────────┐
│ k8s/.env (Local file, gitignored)       │
│ • MONGO_URI=...                         │
│ • JWT_SECRET=...                        │
│ • GROQ_API_KEY=...                      │
└────────────┬────────────────────────────┘
             │
             │ source k8s/.env
             │ (exports variables)
             ↓
┌─────────────────────────────────────────┐
│ Environment Variables in Shell          │
│ $MONGO_URI                              │
│ $JWT_SECRET                             │
│ $GROQ_API_KEY                           │
└────────────┬────────────────────────────┘
             │
             │ kubectl create secret \
             │   --from-literal=...
             │
             ↓
┌─────────────────────────────────────────┐
│ Kubernetes Secret (encrypted in etcd)   │
│ mern-app-secrets                        │
│ • MONGO_URI (base64)                    │
│ • JWT_SECRET (base64)                   │
│ • GROQ_API_KEY (base64)                 │
└────────────┬────────────────────────────┘
             │
             │ envFrom secretRef
             │ in deployment.yaml
             │
             ↓
┌─────────────────────────────────────────┐
│ Pod Container                           │
│ process.env.MONGO_URI ✅                │
│ process.env.JWT_SECRET ✅               │
│ process.env.GROQ_API_KEY ✅             │
└─────────────────────────────────────────┘
```

---

## 🔄 Update Secrets

To update secrets after they're already created:

```bash
# Edit .env
vim k8s/.env

# Re-run setup script (it will update/overwrite)
bash k8s/setup-secrets.sh

# Restart deployment to apply new secrets
kubectl rollout restart deployment/mern-app -n mern

# Verify pods are running with new secrets
kubectl get pods -n mern
```

---

## 🚀 CI/CD Integration

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    environment {
        KUBECONFIG = credentials('kube-config')
    }
    
    stages {
        stage('Setup K8s Secrets') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GROQ_API_KEY', variable: 'GROQ_API_KEY')
                ]) {
                    sh '''
                        kubectl create secret generic mern-app-secrets \
                          --from-literal=MONGO_URI="$MONGO_URI" \
                          --from-literal=JWT_SECRET="$JWT_SECRET" \
                          --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
                          -n mern \
                          --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
                sh 'kubectl rollout status deployment/mern-app -n mern'
            }
        }
    }
}
```

---

## 📂 File Structure

```
k8s/
├── .env (NOT COMMITTED - contains real secrets)
├── setup-secrets.sh (Helper script)
├── deployment.yaml (envFrom: secretRef)
├── configmap.yaml
├── secret.yaml (template with placeholders)
├── service.yaml
└── ...
```

---

## ✅ Checklist

- [ ] Created `k8s/.env` with real values
- [ ] Verified `k8s/.env` is in `.gitignore`
- [ ] Ran `bash k8s/setup-secrets.sh`
- [ ] Verified secrets exist: `kubectl get secret mern-app-secrets -n mern`
- [ ] Deployed app: `kubectl apply -f k8s/`
- [ ] Verified pods are running: `kubectl get pods -n mern`
- [ ] Tested health endpoint: `kubectl port-forward svc/mern-app-service 8080:80 -n mern`

---

## 🆘 Troubleshooting

### Secret not loading in pod?

```bash
# Check if secret exists
kubectl get secret mern-app-secrets -n mern

# Verify pod can access secret
kubectl exec <pod-name> -n mern -- env | grep MONGO_URI

# Restart deployment
kubectl rollout restart deployment/mern-app -n mern
```

### .env file not sourcing?

```bash
# Check file permissions
ls -la k8s/.env

# Test sourcing manually
source k8s/.env && echo "MONGO_URI: $MONGO_URI"
```

### kubectl command not found?

Make sure kubectl is installed and in PATH:
```bash
which kubectl
kubectl version --client
```

---

## 📚 See Also

- [README.md](README.md) - Full deployment guide
- [DIAGNOSIS.md](DIAGNOSIS.md) - Troubleshooting
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - kubectl cheat sheet
