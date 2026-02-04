const express = require('express');
const authController = require('../controllers/authController');
const deviceController = require('../controllers/deviceController');
const taskController = require('../controllers/taskController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// ===== Authentication Routes =====
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.me);
router.post('/auth/change-password', authenticateToken, authController.changePassword);

// ===== Device Routes =====
router.get('/devices', authenticateToken, deviceController.index);
router.get('/devices/statistics', authenticateToken, deviceController.statistics);
router.get('/devices/:id', authenticateToken, deviceController.show);
router.delete('/devices/:id', authenticateToken, authorizeRole('admin'), deviceController.destroy);

// Device operations
router.post('/devices/:id/provision', authenticateToken, deviceController.provision);
router.post('/devices/:id/firmware', authenticateToken, authorizeRole('admin'), deviceController.firmware);
router.post('/devices/:id/reboot', authenticateToken, deviceController.reboot);
router.post('/devices/:id/diagnostic', authenticateToken, deviceController.diagnostic);

// ===== Task Routes =====
router.get('/tasks', authenticateToken, taskController.index);
router.get('/tasks/statistics', authenticateToken, taskController.statistics);
router.get('/tasks/:id', authenticateToken, taskController.show);
router.post('/tasks/:id/cancel', authenticateToken, taskController.cancel);

// ===== Activity Log Routes =====
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const { deviceId, eventType, severity, limit } = req.query;
        const logs = await ActivityLog.findAll({
            deviceId,
            eventType,
            severity,
            limit: parseInt(limit) || 50,
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.get('/logs/recent', authenticateToken, async (req, res) => {
    try {
        const logs = await ActivityLog.getRecent(50);
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Get recent logs error:', error);
        res.status(500).json({ error: 'Failed to fetch recent logs' });
    }
});

module.exports = router;
