# GRACS Setup Guide

## Windows Installation

This guide will help you set up GRACS on Windows.

### Step 1: Install PostgreSQL

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer (PostgreSQL 14 or higher recommended)
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Keep the default port `5432`
   - Install pgAdmin 4 (optional but recommended)

4. After installation, create the database:
   - Open pgAdmin or Command Prompt
   - Run:
   ```sql
   CREATE DATABASE acs_database;
   ```

### Step 2: Install Node.js

1. Download Node.js from https://nodejs.org/ (LTS version recommended)
2. Run the installer
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### Step 3: Setup GRACS

1. Navigate to the project directory:
   ```cmd
   cd e:\gracs
   ```

2. Install dependencies:
   ```cmd
   npm install
   ```

3. Create `.env` file from template:
   ```cmd
   copy .env.example .env
   ```

4. Edit `.env` file with Notepad or your preferred editor:
   - Update `DB_PASSWORD` with your PostgreSQL password
   - Update `JWT_SECRET` with a random secure string
   - Optionally change `ADMIN_PASSWORD`

### Step 4: Initialize Database

Run the migration script:
```cmd
npm run db:migrate
```

This will create all tables and the default admin user.

### Step 5: Start the Server

```cmd
npm start
```

Or for development with auto-restart:
```cmd
npm run dev
```

### Step 6: Access Dashboard

Open your browser and go to:
```
http://localhost:7547
```

Login with:
- Username: `admin`
- Password: `admin123` (or what you set in .env)

## Troubleshooting

### PostgreSQL Connection Failed

1. Check if PostgreSQL service is running:
   - Open Services (services.msc)
   - Find "postgresql-x64-XX" service
   - Ensure it's running

2. Verify database credentials in `.env`
3. Test connection with pgAdmin

### Port 7547 Already in Use

Change the port in `.env`:
```env
PORT=8080
```

### Node.js Not Found

Ensure Node.js is installed and added to PATH:
1. Close and reopen Command Prompt
2. Run: `node --version`

## Running as Windows Service

To run GRACS as a Windows service, you can use `node-windows`:

1. Install node-windows:
   ```cmd
   npm install -g node-windows
   ```

2. Create a service script `install-service.js`:
   ```javascript
   var Service = require('node-windows').Service;
   var svc = new Service({
     name: 'GRACS ACS',
     description: 'Auto Configuration Server',
     script: 'E:\\gracs\\server.js'
   });
   svc.on('install', function(){
     svc.start();
   });
   svc.install();
   ```

3. Run the script:
   ```cmd
   node install-service.js
   ```

## Next Steps

- Configure your CPE devices to connect to `http://YOUR_IP:7547/acs`
- Change the default admin password
- Review the TR-069 protocol documentation
- Setup HTTPS for production use

## Support

If you encounter issues, check:
- Server logs in the console
- PostgreSQL logs
- Activity logs in the dashboard
