# Kubernetes Deployment Diagnosis & Fixes

**Date**: April 17, 2026  
**Status**: ✅ **RESOLVED - All pods running**

---

## 🔴 Issues Found

### Issue #1: ServiceAccount Missing ❌
**Error**: `error looking up service account mern/mern-app: serviceaccount "mern-app" not found`

**Cause**: When `kubectl apply -f k8s/` was called, the deployment tried to create pods before the ServiceAccount resource existed.

**Impact**: All pods failed to create (0/2 ready)

**Fix**: 
- Recreated missing `k8s/serviceaccount.yaml` with ServiceAccount + RBAC Role/RoleBinding
- Applied: `kubectl apply -f k8s/serviceaccount.yaml`
- Force restart deployment: `kubectl rollout restart deployment/mern-app -n mern`

---

### Issue #2: Health Check Probes Failing ❌
**Error**: `spec.containers{mern-app}: Liveness probe failed: HTTP probe failed with statuscode: 404`

**Cause**: Deployment health checks were querying `/` endpoint which returns 404. The actual health endpoint is `/api/health`.

**Server Endpoints**:
- ✅ `/api/health` - Health check endpoint (returns `{ status: 'Gotham server is online', timestamp: ... }`)
- ✅ `/api/auth` - Authentication routes
- ✅ `/api` - Market & Trade routes
- ❌ `/` - Returns 404 (not implemented)

**Impact**: Pods were restarted continuously due to failed liveness probe

**Fix**:
- Updated `k8s/deployment.yaml` - changed probe path from `/` to `/api/health`
- Applied: `kubectl apply -f k8s/deployment.yaml`
- Restarted deployment: `kubectl rollout restart deployment/mern-app -n mern`

---

## ✅ Current Status

```
DEPLOYMENT: 2/2 READY ✅
├── Pod 1: mern-app-649cf45cf-f4lj8  [1/1 Ready]
├── Pod 2: mern-app-8576bc9955-kvl54 [1/1 Ready]
└── Pod 3: (old pod terminating)

SERVICE: NodePort 30000 ✅
├── Port: 80 → 5000 (container)
└── Access via: http://<node-ip>:30000

HPA: Configured ✅
├── Min Replicas: 2
├── Max Replicas: 10
├── CPU Trigger: 70%
└── Memory Trigger: 80%
```

---

## 📋 Resources Applied

| Resource | Status | Namespace |
|----------|--------|-----------|
| Namespace | ✅ mern | - |
| ServiceAccount | ✅ mern-app | mern |
| Role | ✅ mern-app-role | mern |
| RoleBinding | ✅ mern-app-rolebinding | mern |
| ConfigMap | ✅ mern-app-config | mern |
| Secret | ✅ mern-app-secrets | mern |
| Deployment | ✅ mern-app | mern |
| Service | ✅ mern-app-service | mern |
| HPA | ✅ mern-app-hpa | mern |

---

## 🔧 Steps Applied to Fix

### Step 1: Create Missing ServiceAccount
```bash
kubectl apply -f k8s/serviceaccount.yaml
```
**Output**: ServiceAccount, Role, RoleBinding created

### Step 2: Fix Health Check Probes
**File**: `k8s/deployment.yaml`
```yaml
# BEFORE
livenessProbe:
  httpGet:
    path: /              # ❌ Returns 404
    
# AFTER
livenessProbe:
  httpGet:
    path: /api/health    # ✅ Returns 200 OK
```

### Step 3: Apply Updated Deployment
```bash
kubectl apply -f k8s/deployment.yaml
kubectl rollout restart deployment/mern-app -n mern
```

---

## 📊 Health Check Status

```bash
$ kubectl get pods -n mern

mern-app-649cf45cf-f4lj8    1/1 Running ✅
mern-app-8576bc9955-kvl54   1/1 Running ✅
```

Both pods pass health checks:
✅ Readiness probe: HTTP GET /api/health → 200 OK  
✅ Liveness probe: HTTP GET /api/health → 200 OK  

---

## 🚀 Access Application

### Via NodePort (Local Development)
```bash
# Get Node IP
kubectl get nodes -o wide

# Access app on Node IP + NodePort
curl http://<NODE_IP>:30000

# Or port-forward
kubectl port-forward svc/mern-app-service 8080:80 -n mern
curl http://localhost:8080
```

### Check Health
```bash
kubectl exec -it mern-app-649cf45cf-f4lj8 -n mern -- \
  node -e "require('http').get('http://localhost:5000/api/health', (r) => { 
    let data=''; 
    r.on('data', chunk => data+=chunk); 
    r.on('end', () => console.log(data)) 
  })"
```

---

## 📝 Lessons Learned

1. **Apply manifests in order**: ServiceAccount must be created before Deployment
   - Better: Use Kustomize or Helm for dependency management
   - Alternative: Use `kubectl apply -k k8s/` (Kustomization handles ordering)

2. **Configure correct health check endpoints**: Match your application's actual endpoints
   - Check `server.js` or `app.js` for available routes before setting probes
   - Use endpoints that don't require database connectivity

3. **Missing files in Git**: The `serviceaccount.yaml` wasn't being persisted properly
   - Ensure all manifest files are committed to Git
   - Use version control to track infrastructure changes

---

## 🔍 Verification Commands

```bash
# Full status
kubectl get all -n mern

# Describe deployment
kubectl describe deployment mern-app -n mern

# Pod logs (recent)
kubectl logs -n mern -l app=mern-app --tail=50

# Watch pod changes
kubectl get pods -n mern -w

# Check metrics (requires metrics-server)
kubectl top pods -n mern

# Health check test
kubectl get pods -n mern --no-headers -o custom-columns=NAME:.metadata.name | \
  xargs -I {} kubectl exec {} -n mern -- \
  sh -c 'echo "Pod: {}"; curl -s http://localhost:5000/api/health'
```

---

## Next Steps

1. **Commit fixes to Git**:
   ```bash
   git add k8s/deployment.yaml k8s/serviceaccount.yaml
   git commit -m "Fix deployment: add missing ServiceAccount and correct health check endpoints"
   git push origin main
   ```

2. **Monitor deployment**:
   ```bash
   kubectl get pods -n mern -w
   ```

3. **Test application endpoints**:
   ```bash
   kubectl port-forward svc/mern-app-service 8080:80 -n mern
   # Test in another terminal
   curl http://localhost:8080/api/health
   ```

4. **Set up metrics monitoring** (optional):
   ```bash
   kubectl top nodes
   kubectl top pods -n mern
   ```

---

## 📚 Related Documentation

- [README.md](README.md) - Full deployment guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - kubectl commands
- [JENKINS_INTEGRATION.md](JENKINS_INTEGRATION.md) - CI/CD pipeline setup
