# GRACS - Auto Configuration Server

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

GRACS (GemiC ACS) is a comprehensive Auto Configuration Server (ACS) implementation based on the TR-069/CWMP protocol, designed for ISPs to remotely manage, configure, monitor, and update customer premises equipment (CPE) such as modems, routers, and ONTs.

## 🌟 Features

### Core Functionality
- **✅ TR-069/CWMP Protocol** - Full implementation of CWMP for device communication
- **📱 Device Provisioning** - Automated configuration of WiFi, VLAN, VoIP settings
- **📊 Real-time Monitoring** - Track device status, uptime, bandwidth, and errors
- **⬆️ Firmware Management** - Remote firmware updates and patches
- **🔍 Diagnostics** - Connection tests, ping, and log analysis
- **📝 Activity Logging** - Comprehensive event tracking and audit trails

### Dashboard Features
- **🎨 Modern UI** - Premium dark theme with glassmorphism effects
- **📈 Statistics Dashboard** - Real-time device and task statistics
- **🔐 Secure Authentication** - JWT-based authentication with role-based access
- **⚡ Real-time Updates** - Auto-refresh dashboard every 30 seconds
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices

## 🏗️ Architecture

### Components

| Component | Description | Implementation |
|-----------|-------------|----------------|
| **CPE** | Customer premises equipment (modem, router, ONT) | MikroTik, Huawei ONT |
| **ACS Server** | Central management server receiving TR-069 requests | Node.js + Express |
| **Database** | Stores configuration, status, and logs | PostgreSQL |
| **API/Integration** | Connects ACS with billing, CRM, monitoring | REST/HTTP API |
| **Dashboard/GUI** | Admin interface for ISP | Premium Web Dashboard |

### Communication Flow

```
1. CPE Boots → Sends Inform to ACS
2. ACS Authenticates → Verifies device credentials
3. ACS Provisions → Sends configuration (WiFi SSID, VLAN)
4. Continuous Monitoring → ACS receives status updates
5. Firmware Updates → ACS pushes updates to CPE
6. Integration → Data synced with billing/NMS systems
```

## 📋 Prerequisites

- **Node.js** - v16 or higher
- **PostgreSQL** - v12 or higher
- **npm** or **yarn** - Package manager

## 🚀 Installation

### 1. Clone the Repository

```bash
cd e:/gracs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and update with your settings:

```bash
copy .env.example .env
```

Edit `.env` and configure:
- Database connection (PostgreSQL)
- JWT secret key
- Server port (default: 7547)
- Admin credentials

### 4. Setup Database

Create a PostgreSQL database:

```sql
CREATE DATABASE acs_database;
```

Run migrations to create tables:

```bash
npm run db:migrate
```

This will:
- Create all required database tables
- Setup indexes and triggers
- Create a default admin user

### 5. Start the Server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## 🌐 Access

Once the server is running:

- **Dashboard**: http://localhost:7547
- **TR-069 Endpoint**: http://localhost:7547/acs
- **API**: http://localhost:7547/api

### Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## 🔧 Configuration

### TR-069 Endpoint Configuration

Point your CPE devices to the ACS URL:
```
http://YOUR_SERVER_IP:7547/acs
```

Configure CPE authentication credentials to match those in your `.env` file.

### Database Configuration

PostgreSQL connection settings in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=acs_database
DB_USER=postgres
DB_PASSWORD=your_password
```

## 📖 Usage

### Dashboard Operations

1. **View Devices** - Monitor all connected CPE devices
2. **Device Details** - Click any device to view parameters and status
3. **Provision Device** - Configure WiFi SSID and password
4. **Firmware Update** - Push firmware updates remotely
5. **Reboot Device** - Send reboot command
6. **Run Diagnostics** - Fetch device parameters and status
7. **View Tasks** - Monitor provisioning task status
8. **Activity Logs** - Review all device events and system activities

### REST API

The ACS provides a comprehensive REST API for integration:

#### Authentication
```bash
POST /api/auth/login
POST /api/auth/change-password
GET /api/auth/me
```

#### Devices
```bash
GET /api/devices
GET /api/devices/:id
POST /api/devices/:id/provision
POST /api/devices/:id/firmware
POST /api/devices/:id/reboot
POST /api/devices/:id/diagnostic
```

#### Tasks
```bash
GET /api/tasks
GET /api/tasks/:id
POST /api/tasks/:id/cancel
```

#### Logs
```bash
GET /api/logs
GET /api/logs/recent
```

See [docs/API.md](docs/API.md) for detailed API documentation.

## 🏢 TR-069 Protocol Support

### Supported RPC Methods

- **Inform** - Device boot and periodic updates
- **GetParameterValues** - Retrieve device parameters
- **SetParameterValues** - Configure device settings
- **Download** - Firmware and configuration updates
- **Reboot** - Remote device restart
- **TransferComplete** - Firmware transfer confirmation

### Common Parameters

```
InternetGatewayDevice.DeviceInfo.SoftwareVersion
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase
InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username
```

## 📁 Project Structure

```
e:/gracs/
├── config/              # Configuration files
│   ├── database.js      # Database connection
│   └── env.js           # Environment settings
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── cwmpController.js
│   ├── deviceController.js
│   └── taskController.js
├── models/              # Database models
│   ├── Device.js
│   ├── Task.js
│   ├── ActivityLog.js
│   └── User.js
├── routes/              # API routes
│   ├── tr069.js         # TR-069 endpoint
│   └── api.js           # REST API
├── middleware/          # Express middleware
│   └── auth.js          # JWT authentication
├── utils/               # Utilities
│   └── soapBuilder.js   # SOAP/XML builder
├── migrations/          # Database migrations
├── public/              # Frontend files
│   ├── css/
│   ├── js/
│   └── index.html
├── storage/             # File storage
│   └── firmware/        # Firmware files
├── server.js            # Main application
└── package.json         # Dependencies
```

## 🛡️ Security

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-Based Access** - Admin and operator roles
- **HTTPS Support** - Configure SSL certificates for production
- **Input Validation** - Validated and sanitized user inputs

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -d acs_database
```

### CPE Not Connecting

1. Verify TR-069 endpoint URL is correct
2. Check CPE authentication credentials
3. Review activity logs for error messages
4. Ensure firewall allows port 7547

### View Logs

Check server logs for errors:
```bash
npm start
```

## 📚 Documentation

- [TR-069 Protocol Guide](docs/TR069_PROTOCOL.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 💬 Support

For issues, questions, or feature requests, please open an issue on the repository.

## 🙏 Acknowledgments

- Built with Node.js and Express
- TR-069/CWMP protocol specification by the Broadband Forum
- Inspired by GenieACS and OpenACS projects

---

**Made with ⚡ by GRACS Team**
