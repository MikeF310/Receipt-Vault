#!/bin/bash
set -a
source ../.env
set +a      # stop auto-exporting
set -e

# This script stands up EC2 and S3 Buckets
# On startup, EC2 pulls updated github image.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# --- CONFIGURATION ---
KEY_PATH="~/.ssh/receipt-vault-key.pem" # Fixed placeholder to match your real key name
REMOTE_USER="ubuntu"

LOCAL_BACKUP_DIR="./backups"
LOCAL_BACKUP="./backups/latest.sql"

if [ ! -f "$LOCAL_BACKUP" ]; then
    echo "❌ Error: No backup file found at $LOCAL_BACKUP"
    exit 1
fi

# 1. Build the fresh infrastructure
echo "🚀 Starting EC2 and S3 via Terraform..."

export TF_VAR_github_token="$GITHUB_TOKEN"
export TF_VAR_github_user="$GITHUB_USER"
export TF_VAR_dockerhub_user="$DOCKER_USERNAME"
export TF_VAR_dockerhub_token="$DOCKERHUB_TOKEN"
export TF_VAR_gemini_key="$GEMINI_API_KEY"
terraform apply -auto-approve

# 2. Dynamically fetch the new IP assigned by AWS
NEW_IP=$(terraform output -raw ec2_public_ip 2>/dev/null)
echo "✅ New EC2 Instance IP: $NEW_IP"

# 3. Wait for Docker Compose to fully stand up inside the user_data boot cycle
echo "⏳ Waiting for Docker containers to fully initialize on the server..."
# Added explicit SSH bypass flags below to stop the endless loop
until ssh -i "$KEY_PATH" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=5 \
    "$REMOTE_USER@$NEW_IP" "sudo docker exec -i receipt_postgres_db pg_isready -U postgres" &>/dev/null; do
    printf "."
    sleep 5
done
echo -e "\n🐘 PostgreSQL is online and accepting connections!"

# 4. Upload and stream the backup data straight into the new Postgres container
echo "🔄 Restoring database snapshot..."
ssh -i "$KEY_PATH" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "$REMOTE_USER@$NEW_IP" "sudo docker exec -i receipt_postgres_db psql -U postgres -d receipts" < "$LOCAL_BACKUP"


echo "🎉 Migration complete! Your cloud architecture is completely restored."