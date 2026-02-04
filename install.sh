#!/bin/bash

###########################################
# GRACS ACS - Automated Installation Script
# For Ubuntu 20.04/22.04 LTS
###########################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     GRACS - Auto Configuration Server Installer       ║"
echo "║              Ubuntu/VPS Installation                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

echo -e "${YELLOW}[2/8] Installing Node.js...${NC}"
# Install Node.js 18.x LTS
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

echo -e "${YELLOW}[3/8] Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL already installed${NC}"
fi

echo -e "${YELLOW}[4/8] Installing additional dependencies...${NC}"
apt-get install -y git curl wget build-essential

echo -e "${YELLOW}[5/8] Setting up PostgreSQL database...${NC}"
# Get database configuration from user
read -p "Enter database name [acs_database]: " DB_NAME
DB_NAME=${DB_NAME:-acs_database}

read -p "Enter database username [acs_user]: " DB_USER
DB_USER=${DB_USER:-acs_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

# Create database and user
sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo -e "${GREEN}✓ Database configured${NC}"

echo -e "${YELLOW}[6/8] Installing GRACS application...${NC}"
# Get application directory
INSTALL_DIR="/opt/gracs"
read -p "Install directory [$INSTALL_DIR]: " USER_DIR
INSTALL_DIR=${USER_DIR:-$INSTALL_DIR}

# Clone or copy application
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd $INSTALL_DIR
    git pull || echo "Not a git repository, skipping pull"
else
    echo -e "${YELLOW}Enter GitHub repository URL (or press Enter to skip):${NC}"
    read REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git clone $REPO_URL $INSTALL_DIR
        cd $INSTALL_DIR
    else
        echo -e "${RED}Please manually copy application files to $INSTALL_DIR${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}[7/8] Installing NPM dependencies...${NC}"
cd $INSTALL_DIR
npm install --production

echo -e "${YELLOW}[8/8] Configuring application...${NC}"

# Create .env file
cat > .env <<EOF
# Server Configuration
PORT=7547
NODE_ENV=production
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Security
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# TR-069 Configuration
ACS_URL=http://$(curl -s ifconfig.me):7547/acs
ACS_USERNAME=acs_admin
ACS_PASSWORD=$(openssl rand -base64 12)

# CPE Authentication
CPE_DEFAULT_USERNAME=cpe_user
CPE_DEFAULT_PASSWORD=$(openssl rand -base64 12)

# Periodic Inform Interval (seconds)
PERIODIC_INFORM_INTERVAL=300

# Firmware Storage
FIRMWARE_STORAGE_PATH=./storage/firmware
FIRMWARE_BASE_URL=http://$(curl -s ifconfig.me):7547/firmware

# Admin Credentials (Change after first login!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@localhost

# Logging
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

# Create storage directory
mkdir -p storage/firmware
chmod 755 storage/firmware

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run db:migrate

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/gracs.service <<EOF
[Unit]
Description=GRACS Auto Configuration Server
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gracs
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
systemctl daemon-reload
systemctl enable gracs
systemctl start gracs

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Configuring firewall...${NC}"
    ufw allow 7547/tcp
    echo -e "${GREEN}✓ Firewall configured (port 7547 opened)${NC}"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║         Installation Complete! 🚀                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}✓ GRACS ACS is now running!${NC}"
echo ""
echo "Access Information:"
echo "  Dashboard:        http://$SERVER_IP:7547"
echo "  TR-069 Endpoint:  http://$SERVER_IP:7547/acs"
echo "  API:              http://$SERVER_IP:7547/api"
echo ""
echo "Default Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change the default password immediately!${NC}"
echo ""
echo "Service Management:"
echo "  Start:   systemctl start gracs"
echo "  Stop:    systemctl stop gracs"
echo "  Restart: systemctl restart gracs"
echo "  Status:  systemctl status gracs"
echo "  Logs:    journalctl -u gracs -f"
echo ""
echo "Configuration file: $INSTALL_DIR/.env"
echo ""
echo -e "${YELLOW}Note: For production use, configure HTTPS/SSL${NC}"
echo ""

# Show service status
systemctl status gracs --no-pager
