const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const config = require('../config/env');

const migrationsDir = __dirname;

async function runMigrations() {
    console.log('🔄 Starting database migrations...\n');

    try {
        // Get all SQL migration files
        const files = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`📄 Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            await pool.query(sql);
            console.log(`✓ ${file} completed\n`);
        }

        // Create default admin user
        console.log('👤 Creating default admin user...');
        const passwordHash = await bcrypt.hash(config.admin.password, 10);

        await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (username) DO NOTHING`,
            [config.admin.username, config.admin.email, passwordHash, 'admin']
        );

        console.log('✓ Default admin user created\n');

        console.log('✅ All migrations completed successfully!');
        console.log(`\nDefault admin credentials:`);
        console.log(`Username: ${config.admin.username}`);
        console.log(`Password: ${config.admin.password}`);
        console.log('\n⚠️  Please change the default password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
