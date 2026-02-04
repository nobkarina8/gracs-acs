const { query } = require('../config/database');

class Device {
    /**
     * Find device by serial number
     */
    static async findBySerialNumber(serialNumber) {
        const result = await query(
            'SELECT * FROM devices WHERE serial_number = $1',
            [serialNumber]
        );
        return result.rows[0];
    }

    /**
     * Find device by ID
     */
    static async findById(id) {
        const result = await query('SELECT * FROM devices WHERE id = $1', [id]);
        return result.rows[0];
    }

    /**
     * Get all devices
     */
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM devices';
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (filters.status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(filters.status);
        }

        if (filters.manufacturer) {
            conditions.push(`manufacturer = $${paramIndex++}`);
            params.push(filters.manufacturer);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY last_inform DESC';

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Create new device
     */
    static async create(deviceData) {
        const result = await query(
            `INSERT INTO devices (
        serial_number, manufacturer, model, hardware_version, 
        software_version, connection_url, connection_username, 
        connection_password, ip_address, mac_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
            [
                deviceData.serialNumber,
                deviceData.manufacturer,
                deviceData.model,
                deviceData.hardwareVersion,
                deviceData.softwareVersion,
                deviceData.connectionUrl,
                deviceData.connectionUsername,
                deviceData.connectionPassword,
                deviceData.ipAddress,
                deviceData.macAddress,
            ]
        );
        return result.rows[0];
    }

    /**
     * Update device
     */
    static async update(id, deviceData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(deviceData).forEach((key) => {
            if (deviceData[key] !== undefined) {
                fields.push(`${key} = $${paramIndex++}`);
                params.push(deviceData[key]);
            }
        });

        params.push(id);
        const result = await query(
            `UPDATE devices SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );
        return result.rows[0];
    }

    /**
     * Update last inform timestamp
     */
    static async updateLastInform(serialNumber, ipAddress = null) {
        const result = await query(
            `UPDATE devices 
       SET last_inform = CURRENT_TIMESTAMP, 
           status = 'online',
           ip_address = COALESCE($2, ip_address)
       WHERE serial_number = $1
       RETURNING *`,
            [serialNumber, ipAddress]
        );
        return result.rows[0];
    }

    /**
     * Set device status
     */
    static async setStatus(id, status) {
        const result = await query(
            'UPDATE devices SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    /**
     * Get device parameters
     */
    static async getParameters(deviceId) {
        const result = await query(
            'SELECT * FROM device_parameters WHERE device_id = $1 ORDER BY parameter_name',
            [deviceId]
        );
        return result.rows;
    }

    /**
     * Set device parameter
     */
    static async setParameter(deviceId, parameterName, parameterValue, parameterType = 'string') {
        const result = await query(
            `INSERT INTO device_parameters (device_id, parameter_name, parameter_value, parameter_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (device_id, parameter_name) 
       DO UPDATE SET parameter_value = $3, parameter_type = $4, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
            [deviceId, parameterName, parameterValue, parameterType]
        );
        return result.rows[0];
    }

    /**
     * Set multiple parameters at once
     */
    static async setParameters(deviceId, parameters) {
        const promises = parameters.map((param) =>
            this.setParameter(deviceId, param.name, param.value, param.type)
        );
        return Promise.all(promises);
    }

    /**
     * Delete device
     */
    static async delete(id) {
        await query('DELETE FROM devices WHERE id = $1', [id]);
        return true;
    }

    /**
     * Get device statistics
     */
    static async getStatistics() {
        const result = await query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE status = 'online') as online_devices,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_devices,
        COUNT(*) FILTER (WHERE last_inform > NOW() - INTERVAL '1 hour') as active_last_hour
      FROM devices
    `);
        return result.rows[0];
    }
}

module.exports = Device;
