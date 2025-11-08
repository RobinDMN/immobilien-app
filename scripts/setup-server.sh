#!/bin/bash

# =============================================================================
# Server Setup Script für Hetzner
# =============================================================================
# Dieses Script richtet den Hetzner-Server für das Deployment ein.
# 
# Verwendung:
#   chmod +x setup-server.sh
#   ./setup-server.sh
#
# Voraussetzungen:
#   - Ubuntu 22.04 LTS oder neuer
#   - Root-Zugriff oder sudo-Berechtigung
#   - SSH-Key für GitHub Actions hinterlegt
# =============================================================================

set -e

echo "=== Immobilien-App Server Setup ==="
echo ""

# -----------------------------------------------------------------------------
# 1. System Update
# -----------------------------------------------------------------------------
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# -----------------------------------------------------------------------------
# 2. Install Docker
# -----------------------------------------------------------------------------
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# -----------------------------------------------------------------------------
# 3. Install Docker Compose
# -----------------------------------------------------------------------------
echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# -----------------------------------------------------------------------------
# 4. Install Caddy
# -----------------------------------------------------------------------------
echo "🌐 Installing Caddy..."
if ! command -v caddy &> /dev/null; then
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy -y
    echo "✅ Caddy installed"
else
    echo "✅ Caddy already installed"
fi

# -----------------------------------------------------------------------------
# 5. Create Application Directory
# -----------------------------------------------------------------------------
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/immobilien-app
sudo chown $USER:$USER /opt/immobilien-app
cd /opt/immobilien-app

# -----------------------------------------------------------------------------
# 6. Create .env file
# -----------------------------------------------------------------------------
echo "⚙️  Creating environment file..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# GitHub Container Registry
GITHUB_REPOSITORY_OWNER=your-github-username

# Application Settings
USE_REMOTE_STORAGE=false
API_BASE_URL=

# Schema
SCHEMA_VERSION=ms-2024.1

# Users
ALLOWED_USERS=robin,friedrich,freddy,salih
EOF
    echo "⚠️  Please edit /opt/immobilien-app/.env with your settings"
else
    echo "✅ .env file already exists"
fi

# -----------------------------------------------------------------------------
# 7. Setup Firewall
# -----------------------------------------------------------------------------
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw --force enable
    echo "✅ Firewall configured"
fi

# -----------------------------------------------------------------------------
# 8. Configure Caddy
# -----------------------------------------------------------------------------
echo "🌐 Configuring Caddy..."
echo "⚠️  Please copy Caddyfile to /etc/caddy/Caddyfile manually"
echo "    and edit it with your domain name, then run:"
echo "    sudo systemctl reload caddy"

# -----------------------------------------------------------------------------
# 9. Setup Log Rotation
# -----------------------------------------------------------------------------
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/immobilien-app > /dev/null << 'EOF'
/var/log/caddy/immobilien-app*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 caddy caddy
    sharedscripts
    postrotate
        systemctl reload caddy > /dev/null 2>&1 || true
    endscript
}
EOF

# -----------------------------------------------------------------------------
# 10. Final Instructions
# -----------------------------------------------------------------------------
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/immobilien-app/.env with your GitHub username"
echo "2. Copy and edit /etc/caddy/Caddyfile with your domain"
echo "3. Reload Caddy: sudo systemctl reload caddy"
echo "4. Add SSH key to GitHub Secrets: SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY"
echo "5. Push to main branch to trigger deployment"
echo ""
echo "Manual deployment test:"
echo "  cd /opt/immobilien-app"
echo "  docker-compose pull"
echo "  docker-compose up -d"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Health check:"
echo "  curl http://localhost:3000/health"
echo ""
