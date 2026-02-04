const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    /**
     * Create new user
     */
    static async create(userData) {
        const passwordHash = await bcrypt.hash(userData.password, 10);

        const result = await query(
            `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, is_active, created_at`,
            [
                userData.username,
                userData.email,
                passwordHash,
                userData.role || 'admin',
                userData.isActive !== undefined ? userData.isActive : true,
            ]
        );
        return result.rows[0];
    }

    /**
     * Verify password
     */
    static async verifyPassword(user, password) {
        return bcrypt.compare(password, user.password_hash);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(id) {
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    }

    /**
     * Update user
     */
    static async update(id, userData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        if (userData.email) {
            fields.push(`email = $${paramIndex++}`);
            params.push(userData.email);
        }

        if (userData.password) {
            const passwordHash = await bcrypt.hash(userData.password, 10);
            fields.push(`password_hash = $${paramIndex++}`);
            params.push(passwordHash);
        }

        if (userData.role) {
            fields.push(`role = $${paramIndex++}`);
            params.push(userData.role);
        }

        if (userData.isActive !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            params.push(userData.isActive);
        }

        params.push(id);
        const result = await query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, username, email, role, is_active, created_at`,
            params
        );
        return result.rows[0];
    }

    /**
     * Get all users
     */
    static async findAll() {
        const result = await query(
            'SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        return result.rows;
    }

    /**
     * Delete user
     */
    static async delete(id) {
        await query('DELETE FROM users WHERE id = $1', [id]);
        return true;
    }
}

module.exports = User;
