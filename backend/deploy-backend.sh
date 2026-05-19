#!/usr/bin/env bash
# Deploys the FastAPI backend to Cloud Run (asia-south1).
# Run this once GCP billing is enabled on project canteen-56f17.
#
# Usage:  cd backend && bash deploy-backend.sh

set -euo pipefail

PROJECT="canteen-56f17"
REGION="asia-south1"
SERVICE="canteen-backend"

echo "▶ Setting GCP project..."
gcloud config set project "$PROJECT"

echo "▶ Enabling required APIs (needs billing)..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

echo "▶ Building & deploying to Cloud Run from source..."
# Convert .env → YAML for --env-vars-file (handles JSON values and special chars)
python3 - <<'PYEOF'
import re, sys

skip = {"DEBUG"}
out = []
with open(".env") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if key in skip:
            continue
        # YAML: escape backslashes then wrap in double quotes
        val = val.replace("\\", "\\\\").replace('"', '\\"')
        out.append(f'{key}: "{val}"')

with open("/tmp/canteen_env.yaml", "w") as f:
    f.write("\n".join(out) + "\n")

print(f"  wrote {len(out)} vars to /tmp/canteen_env.yaml")
PYEOF

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --env-vars-file /tmp/canteen_env.yaml \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1

echo ""
echo "✅ Backend deployed!"
echo "   Cloud Run URL:"
gcloud run services describe "$SERVICE" --region "$REGION" --format "value(status.url)"
echo ""
echo "ℹ️  Firebase Hosting rewrites /api/v1/** → this service automatically."
echo "   No further config needed — just redeploy the frontend if the URL changed."
