#!/bin/bash
set -e # Exit immediately if any command fails

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

KEY_PATH="~/.ssh/receipt-vault-key.pem"
REMOTE_USER="ubuntu"

# Dynamically extract the IP address from your active Terraform state
EC2_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
BACKUP_NAME="receipt_backup_$(date +%Y%m%d_%H%M%S).sql"
LOCAL_BACKUP_DIR="./backups"

# Validation check
if [ -z "$EC2_IP" ]; then
    echo "Error: Could not fetch EC2 IP from Terraform output. Is the server running?"
    exit 1
fi

echo "Starting automated backup for EC2 IP: $EC2_IP..."

# 1. Trigger pg_dump inside the Docker container over SSH
echo "Creating PostgreSQL dump inside remote container..."
ssh -i "$KEY_PATH" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "$REMOTE_USER@$EC2_IP" "sudo docker exec -i receipt_postgres_db pg_dump -U postgres receipts" > "$LOCAL_BACKUP_DIR/$BACKUP_NAME"

echo "Backup downloaded successfully to: $LOCAL_BACKUP_DIR/$BACKUP_NAME"

# 2. Create a symlink to 'latest.sql' so the startup script always knows which file to use
ln -sf "$BACKUP_NAME" "$LOCAL_BACKUP_DIR/latest.sql"

#3. Destroy the cloud infrastructure safely
echo "Destroying AWS infrastructure with Terraform..."

terraform -chdir="$SCRIPT_DIR/.." destroy -auto-approve

echo "Infrastructure torn down. Data is stored on the local machine."