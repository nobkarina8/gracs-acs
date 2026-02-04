#!/bin/bash

###############################################
# GRACS ACS - Quick Deploy Script
# Untuk deployment cepat dengan default settings
###############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}GRACS Quick Deploy - Starting...${NC}"

# Update sistem
echo -e "${YELLOW}Updating system...${NC}"
apt-get update -y

# Install Node.js
echo -e "${YELLOW}Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
apt-get install -y postgresql postgresql-contrib git

# Setup database dengan password default
echo -e "${YELLOW}Setting up database...${NC}"
sudo -u postgres psql <<EOF
CREATE USER acs_user WITH PASSWORD 'acs_default_pass_123';
CREATE DATABASE acs_database OWNER acs_user;
GRANT ALL PRIVILEGES ON DATABASE acs_database TO acs_user;
EOF

# Install aplikasi
INSTALL_DIR="/opt/gracs"
echo -e "${YELLOW}Enter GitHub repository URL:${NC}"
read REPO_URL

git clone $REPO_URL $INSTALL_DIR
cd $INSTALL_DIR

# Install dependencies
npm install --production

# Setup .env dengan defaults
cat > .env <<EOF
PORT=7547
NODE_ENV=production
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=acs_database
DB_USER=acs_user
DB_PASSWORD=acs_default_pass_123
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
ACS_URL=http://$(curl -s ifconfig.me):7547/acs
ACS_USERNAME=acs_admin
ACS_PASSWORD=acs_pass_$(openssl rand -base64 8)
CPE_DEFAULT_USERNAME=cpe_user
CPE_DEFAULT_PASSWORD=cpe_pass_$(openssl rand -base64 8)
PERIODIC_INFORM_INTERVAL=300
FIRMWARE_STORAGE_PATH=./storage/firmware
FIRMWARE_BASE_URL=http://$(curl -s ifconfig.me):7547/firmware
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@localhost
LOG_LEVEL=info
EOF

mkdir -p storage/firmware

# Run migrations
npm run db:migrate

# Create systemd service
cat > /etc/systemd/system/gracs.service <<EOF
[Unit]
Description=GRACS ACS
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gracs
systemctl start gracs

# Open firewall
if command -v ufw &> /dev/null; then
    ufw allow 7547/tcp
fi

echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "Dashboard: http://$(curl -s ifconfig.me):7547"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Run 'systemctl status gracs' to check status"
