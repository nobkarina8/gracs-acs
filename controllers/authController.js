const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

class AuthController {
    /**
     * User login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            // Find user
            const user = await User.findByUsername(username);

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is disabled' });
            }

            // Verify password
            const isValid = await User.verifyPassword(user, password);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            await User.updateLastLogin(user.id);

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
                config.security.jwtSecret,
                { expiresIn: config.security.jwtExpiresIn }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    /**
     * Get current user info
     */
    async me(req, res) {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.is_active,
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user info' });
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current and new password required' });
            }

            const user = await User.findById(req.user.id);

            // Verify current password
            const isValid = await User.verifyPassword(user, currentPassword);

            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Update password
            await User.update(user.id, { password: newPassword });

            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
}

module.exports = new AuthController();
