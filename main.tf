# Add this at the top of main.tf
variable "github_token" {
  type        = string
  description = "GitHub Personal Access Token for pulling private repositories"
  sensitive   = true
}

variable "github_user" {
  type        = string
  description = "GitHub username used for building the repository clone URL"
}

variable "dockerhub_user"{
  type = string
  description ="Dockerhub username needed for pulling from dockerhub"
}

variable "dockerhub_token" {
  type      = string
  sensitive = true
}

variable "gemini_key"{
  type = string
  sensitive = true
}
# 1. AWS Provider Setup
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" 
}

resource "aws_security_group" "receipt_app_sg" {
  name        = "receipt-vault-security-group"
  description = "Allow inbound traffic for SSH, React frontend, and FastAPI backend"

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # For production, restrict this to your personal IP
  }

  # React Frontend Container Port
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # FastAPI Backend Container Port
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Rules (Allow the server to talk to the internet to download updates/Docker images)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_s3_bucket" "receipt_storage" {
  bucket        = "receipt-vault-storage-unique-id" # S3 bucket names must be globally unique
  force_destroy = true                                # Allows terraform to wipe the bucket when destroying
}

# Block all public access to the S3 bucket to prevent leaks
resource "aws_s3_bucket_public_access_block" "receipt_storage_privacy" {
  bucket = aws_s3_bucket.receipt_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 4. EC2 Instance Configuration
resource "aws_instance" "receipt_server" {
  ami           = "ami-0c7217cdde317cfec" # Standard Ubuntu 22.04 LTS AMI in us-east-1
  instance_type = "t3.micro"              # Free-tier eligible in us-east-1/us-east-2
  key_name      = "receipt-vault-key"     # Must exactly match the name of the Key Pair created in your AWS Console
  vpc_security_group_ids = [aws_security_group.receipt_app_sg.id]

  # Root block device setup utilizing free-tier gp3 storage
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20 # GB (Free tier covers up to 30 GB total)
    delete_on_termination = true
    }   
    user_data = <<-EOF
      #!/bin/bash
      set -e

      exec > >(tee /var/log/user-data.log|logger -t user-data ) 2>&1

      sudo apt-get update -y
      sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common git

      # Install Docker
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

      sudo apt-get update -y
      sudo apt-get install -y docker-ce docker-ce-cli containerd.io

      # Enable docker
      sudo systemctl enable docker
      sudo systemctl start docker

      # Install Docker Compose
      sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
        -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose

      # Fix docker permissions
      sudo groupadd -f docker
      sudo usermod -aG docker ubuntu
      sudo chown root:docker /var/run/docker.sock || true

      # Go to home
      cd /home/ubuntu

      # Clone repo (FIXED auth format)
      git clone https://${var.github_user}:${var.github_token}@github.com/${var.github_user}/Receipt-Vault.git

      cd Receipt-Vault

      # Create .env (ONLY ONCE, NO DUPLICATES)
      cat > .env <<ENV
      GEMINI_API_KEY=${var.gemini_key}
      DOCKER_USERNAME=${var.dockerhub_user}
      ENV

      # Start stack
      echo "${var.dockerhub_token}" | docker login -u "${var.dockerhub_user}" --password-stdin
      sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up
      EOF

  tags = {
    Name = "receipt-vault-app-server"
  }
}

# 5. Outputs (Crucial for your migration scripts to run cleanly)
output "ec2_public_ip" {
  value       = aws_instance.receipt_server.public_ip
  description = "The public IP address of the EC2 instance to target with automation scripts."
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.receipt_storage.id
  description = "The name of the bucket to pass into your FastAPI configuration."
}