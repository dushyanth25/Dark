# Jenkins Credentials Configuration Guide

## ⚠️ CRITICAL: Pipeline Will Fail Without These Credentials

Your Jenkinsfile now requires **3 credentials** to be configured in Jenkins. Without them, the pipeline will use fallback dev credentials (`localhost` MongoDB) and deployments will fail.

---

## Step 1: Access Jenkins Credentials

1. **Open Jenkins UI** → `http://your-jenkins-server:8080`
2. Click **"Manage Jenkins"** (left sidebar)
3. Click **"Manage Credentials"** (or **Credentials** → **System**)
4. Click **"Global credentials (unrestricted)"**

---

## Step 2: Add MONGO_URI Credential

1. Click **"+ Add Credentials"** button
2. **Kind**: Select `Secret text`
3. **Scope**: `Global (Jenkins, nodes, items, all child items, etc)`
4. **Secret**: Paste your MongoDB Atlas connection string:
   ```
   mongodb+srv://dushyanth520:904918@cluster0.kag8m76.mongodb.net/batman_auth?retryWrites=true&w=majority&appName=Cluster0
   ```
5. **ID**: `MONGO_URI` (MUST match exactly - case-sensitive)
6. **Description**: `MongoDB Atlas Connection String`
7. Click **"Create"**

---

## Step 3: Add JWT_SECRET Credential

1. Click **"+ Add Credentials"** button
2. **Kind**: `Secret text`
3. **Scope**: `Global`
4. **Secret**: 
   ```
   batman_dark_knight_secret_key_2024
   ```
5. **ID**: `JWT_SECRET` (MUST match exactly - case-sensitive)
6. **Description**: `JWT Secret Key`
7. Click **"Create"**

---

## Step 4: Add GROQ_API_KEY Credential

1. Click **"+ Add Credentials"** button
2. **Kind**: `Secret text`
3. **Scope**: `Global`
4. **Secret**:
   ```
   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
   ```
5. **ID**: `GROQ_API_KEY` (MUST match exactly - case-sensitive)
6. **Description**: `Groq API Key`
7. Click **"Create"**

---

## Verification Checklist

After adding all 3 credentials, verify they're configured:

```bash
# In Jenkins, go to: Manage Credentials → System → Global credentials
# You should see:
✓ MONGO_URI (Secret text)
✓ JWT_SECRET (Secret text)
✓ GROQ_API_KEY (Secret text)
```

---

## How Jenkinsfile Uses These

The `Setup K8s Secrets` stage now does:

```groovy
withCredentials([
    string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
    string(credentialsId: 'GROQ_API_KEY', variable: 'GROQ_API_KEY')
]) {
    // Credentials injected as $MONGO_URI, $JWT_SECRET, $GROQ_API_KEY
    // Then created as Kubernetes secrets
}
```

---

## Expected Pipeline Output After Configuration

When credentials are properly configured, you should see:

```
23:00:00  🔐 Creating Kubernetes secrets...
23:00:00     ✅ Jenkins credentials loaded successfully
23:00:00     MONGO_URI: mongodb+srv://dushyanth520:904...
23:00:00     JWT_SECRET: batman_dark_knight_secret...
23:00:00     GROQ_API_KEY: gsk_jSXhBJmMzRQokR2sZvg...
23:00:00  ✅ Secrets configured
```

**Not** ⚠️ this (which means credentials aren't loaded):

```
23:00:00  ⚠️  Using fallback defaults (Jenkins credentials not configured)
23:00:00  MONGO_URI: mongodb+srv://localhost/db...  ← This will break!
```

---

## Troubleshooting

### "Logs show 'fallback defaults' but I added credentials"
- **Check credential IDs**: Must be exactly `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY` (case-sensitive)
- **Verify scope**: Credentials must be "Global" scope
- **Jenkins restart**: Sometimes Jenkins UI doesn't acknowledge new credentials immediately
  ```bash
  # Wait 30 seconds and trigger pipeline again
  ```

### "Pipeline still fails after adding credentials"
- Check pod logs for actual error:
  ```bash
  kubectl logs -n mern -l app=mern-app --tail=20
  ```
- Common issues:
  - MongoDB Atlas network access (whitelist Jenkins server IP)
  - Groq API rate limiting (429 errors)
  - Invalid credentials format

### "MongoDB connection failed: querySrv ENOTFOUND _mongodb._tcp.localhost"
- ❌ This means fallback dev credentials are still being used
- **Solution**: Add credentials to Jenkins (see steps above)

### "Jenkins can't connect to MongoDB Atlas"
1. Check Atlas network access (whitelist Jenkins server IP)
2. Verify connection string is correct
3. Test locally:
   ```bash
   mongosh "mongodb+srv://dushyanth520:904918@cluster0.kag8m76.mongodb.net/batman_auth?retryWrites=true&w=majority&appName=Cluster0"
   ```

---

## Security Best Practices

✅ **What we're doing right:**
- Credentials stored in Jenkins (not Git) ✓
- Secrets created in K8s (base64 encoded) ✓
- .env files gitignored ✓
- `withCredentials` block ensures secrets aren't logged ✓

⚠️ **Additional recommendations:**
- Use secret scanning on GitHub (already enabled)
- Rotate credentials regularly
- Use Jenkins audit logs to track credential usage
- Consider using Jenkins Credentials as Code for GitOps approach

---

## Next Steps

1. **Add the 3 credentials** to Jenkins (follow steps above)
2. **Trigger a new pipeline run** (push to GitHub or click "Build Now")
3. **Monitor deployment** 
   ```bash
   kubectl get pods -n mern -w
   kubectl logs -f -n mern -l app=mern-app
   ```

---

## Quick Command Reference

```bash
# Verify K8s secrets created with correct values
kubectl get secret mern-app-secrets -n mern -o jsonpath='{.data.MONGO_URI}' | base64 -d

# Check which credential version deployed
kubectl get pods -n mern -o jsonpath='{.items[*].spec.containers[0].image}'

# View recent pod events
kubectl describe pod -n mern -l app=mern-app | grep -A 20 "Events:"

# Check Jenkins logs
tail -f /var/log/jenkins/jenkins.log
```
