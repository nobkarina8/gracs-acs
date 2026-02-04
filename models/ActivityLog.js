const { query } = require('../config/database');

class ActivityLog {
    /**
     * Create a new log entry
     */
    static async create(logData) {
        const result = await query(
            `INSERT INTO activity_logs (device_id, event_type, event_code, message, data, severity, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                logData.deviceId || null,
                logData.eventType,
                logData.eventCode || null,
                logData.message,
                logData.data ? JSON.stringify(logData.data) : null,
                logData.severity || 'info',
                logData.source || 'acs',
            ]
        );
        return result.rows[0];
    }

    /**
     * Log device event
     */
    static async logDeviceEvent(deviceId, eventType, message, data = null) {
        return this.create({
            deviceId,
            eventType,
            message,
            data,
            severity: 'info',
            source: 'device',
        });
    }

    /**
     * Log system event
     */
    static async logSystemEvent(eventType, message, severity = 'info') {
        return this.create({
            eventType,
            message,
            severity,
            source: 'acs',
        });
    }

    /**
     * Log error
     */
    static async logError(deviceId, message, error) {
        return this.create({
            deviceId,
            eventType: 'error',
            message,
            data: {
                error: error.message,
                stack: error.stack,
            },
            severity: 'error',
            source: 'acs',
        });
    }

    /**
     * Get logs with filters
     */
    static async findAll(filters = {}) {
        let sql = `
      SELECT l.*, d.serial_number, d.manufacturer, d.model 
      FROM activity_logs l
      LEFT JOIN devices d ON l.device_id = d.id
    `;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (filters.deviceId) {
            conditions.push(`l.device_id = $${paramIndex++}`);
            params.push(filters.deviceId);
        }

        if (filters.eventType) {
            conditions.push(`l.event_type = $${paramIndex++}`);
            params.push(filters.eventType);
        }

        if (filters.severity) {
            conditions.push(`l.severity = $${paramIndex++}`);
            params.push(filters.severity);
        }

        if (filters.startDate) {
            conditions.push(`l.timestamp >= $${paramIndex++}`);
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            conditions.push(`l.timestamp <= $${paramIndex++}`);
            params.push(filters.endDate);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY l.timestamp DESC LIMIT ' + (filters.limit || 100);

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Get recent logs
     */
    static async getRecent(limit = 50) {
        return this.findAll({ limit });
    }

    /**
     * Delete old logs
     */
    static async cleanup(daysOld = 90) {
        const result = await query(
            `DELETE FROM activity_logs 
       WHERE timestamp < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`,
        );
        return result.rowCount;
    }
}

module.exports = ActivityLog;
