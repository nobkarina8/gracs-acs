require('dotenv').config();

module.exports = {
    server: {
        port: parseInt(process.env.PORT || '7547'),
        host: process.env.HOST || '0.0.0.0',
        env: process.env.NODE_ENV || 'development',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'acs_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'change_this_secret_key',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    tr069: {
        acsUrl: process.env.ACS_URL || 'http://localhost:7547/acs',
        acsUsername: process.env.ACS_USERNAME || 'acs_admin',
        acsPassword: process.env.ACS_PASSWORD || 'acs_secure_password',
        cpeDefaultUsername: process.env.CPE_DEFAULT_USERNAME || 'cpe_user',
        cpeDefaultPassword: process.env.CPE_DEFAULT_PASSWORD || 'cpe_password',
        periodicInformInterval: parseInt(process.env.PERIODIC_INFORM_INTERVAL || '300'),
    },
    firmware: {
        storagePath: process.env.FIRMWARE_STORAGE_PATH || './storage/firmware',
        baseUrl: process.env.FIRMWARE_BASE_URL || 'http://localhost:7547/firmware',
    },
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        email: process.env.ADMIN_EMAIL || 'admin@localhost',
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};
