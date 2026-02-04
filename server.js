const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { pool } = require('./config/database');

// Import routes
const tr069Routes = require('./routes/tr069');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();

// ===== Middleware =====

// Raw body parser for TR-069 SOAP requests
app.use('/acs', bodyParser.text({ type: 'text/xml' }));

// JSON body parser for REST API
app.use(bodyParser.json());
app.use(bodyParser.url encoded({ extended: true }));

// CORS
app.use(cors());

// Static files (dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Firmware downloads
app.use('/firmware', express.static(config.firmware.storagePath));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===== Routes =====

// TR-069 endpoint
app.use('/acs', tr069Routes);

// REST API
app.use('/api', apiRoutes);

// Dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ===== Start Server =====

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, async () => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     ACS (Auto Configuration Server) - GRACS          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📡 TR-069 endpoint: http://${HOST}:${PORT}/acs`);
    console.log(`🌐 Dashboard: http://${HOST}:${PORT}`);
    console.log(`🔧 Environment: ${config.server.env}\n`);

    // Test database connection
    try {
        await pool.query('SELECT NOW()');
        console.log('✓ Database connection successful\n');
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        console.error('Please check your database configuration in .env file\n');
    }

    console.log('Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await pool.end();
    process.exit(0);
});

module.exports = app;
