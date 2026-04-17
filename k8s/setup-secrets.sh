#!/bin/bash

# ============================================
# Kubernetes Secrets Setup Script
# ============================================
# This script sources .env file and creates 
# K8s secrets without committing them to Git
#
# Usage:
#   bash k8s/setup-secrets.sh
#
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo "🔐 Setting up Kubernetes Secrets..."
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo ""
    echo "Steps:"
    echo "1. Create .env file in k8s/ directory with:"
    echo "   export MONGO_URI=\"mongodb+srv://...\""
    echo "   export JWT_SECRET=\"your-secret\""
    echo "   export GROQ_API_KEY=\"your-key\""
    echo ""
    exit 1
fi

# Source environment variables from .env
echo "📄 Loading environment variables from $ENV_FILE..."
set -a  # Export all variables
source "$ENV_FILE"
set +a  # Stop exporting all

# Verify variables are set
echo "✓ Checking variables..."
if [ -z "$MONGO_URI" ] || [ -z "$JWT_SECRET" ] || [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Error: Environment variables not set in .env file!"
    exit 1
fi

echo "✓ MONGO_URI: loaded"
echo "✓ JWT_SECRET: loaded"
echo "✓ GROQ_API_KEY: loaded"
echo ""

# Verify namespace exists or create it
echo "📦 Checking namespace 'mern'..."
if ! kubectl get namespace mern > /dev/null 2>&1; then
    echo "Creating namespace 'mern'..."
    kubectl create namespace mern
fi
echo "✓ Namespace 'mern' ready"
echo ""

# Create/Update secrets using environment variables
echo "🔑 Creating Kubernetes secrets..."
kubectl create secret generic mern-app-secrets \
  --from-literal=MONGO_URI="$MONGO_URI" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  -n mern \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Secrets created successfully!"
echo ""
echo "📋 Verify:"
echo "   kubectl get secret mern-app-secrets -n mern"
echo "   kubectl get secret mern-app-secrets -n mern -o yaml"
echo ""
echo "🔄 Restart deployment to apply:"
echo "   kubectl rollout restart deployment/mern-app -n mern"
