const { query } = require('../config/database');

class Task {
    /**
     * Create a new task
     */
    static async create(taskData) {
        const result = await query(
            `INSERT INTO tasks (device_id, task_type, task_name, parameters, priority, max_retries)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                taskData.deviceId,
                taskData.taskType,
                taskData.taskName || taskData.taskType,
                JSON.stringify(taskData.parameters || {}),
                taskData.priority || 5,
                taskData.maxRetries || 3,
            ]
        );
        return result.rows[0];
    }

    /**
     * Get pending tasks for a device
     */
    static async getPendingTasks(deviceId) {
        const result = await query(
            `SELECT * FROM tasks 
       WHERE device_id = $1 AND status = 'pending'
       ORDER BY priority DESC, created_at ASC`,
            [deviceId]
        );
        return result.rows;
    }

    /**
     * Get next pending task for a device
     */
    static async getNextTask(deviceId) {
        const result = await query(
            `SELECT * FROM tasks 
       WHERE device_id = $1 AND status = 'pending'
       ORDER BY priority DESC, created_at ASC
       LIMIT 1`,
            [deviceId]
        );
        return result.rows[0];
    }

    /**
     * Get task by ID
     */
    static async findById(id) {
        const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);
        return result.rows[0];
    }

    /**
     * Get all tasks with optional filters
     */
    static async findAll(filters = {}) {
        let sql = 'SELECT t.*, d.serial_number, d.manufacturer, d.model FROM tasks t JOIN devices d ON t.device_id = d.id';
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (filters.status) {
            conditions.push(`t.status = $${paramIndex++}`);
            params.push(filters.status);
        }

        if (filters.taskType) {
            conditions.push(`t.task_type = $${paramIndex++}`);
            params.push(filters.taskType);
        }

        if (filters.deviceId) {
            conditions.push(`t.device_id = $${paramIndex++}`);
            params.push(filters.deviceId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY t.created_at DESC LIMIT 100';

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Update task status
     */
    static async updateStatus(id, status, result = null, errorMessage = null) {
        const updates = ['status = $2'];
        const params = [id, status];
        let paramIndex = 3;

        if (status === 'in_progress') {
            updates.push(`started_at = CURRENT_TIMESTAMP`);
        }

        if (status === 'completed' || status === 'failed') {
            updates.push(`completed_at = CURRENT_TIMESTAMP`);
        }

        if (result) {
            updates.push(`result = $${paramIndex++}`);
            params.push(JSON.stringify(result));
        }

        if (errorMessage) {
            updates.push(`error_message = $${paramIndex++}`);
            params.push(errorMessage);
        }

        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
        const queryResult = await query(sql, params);
        return queryResult.rows[0];
    }

    /**
     * Mark task as completed
     */
    static async complete(id, result = null) {
        return this.updateStatus(id, 'completed', result);
    }

    /**
     * Mark task as failed
     */
    static async fail(id, errorMessage) {
        return this.updateStatus(id, 'failed', null, errorMessage);
    }

    /**
     * Increment retry count
     */
    static async incrementRetry(id) {
        const result = await query(
            `UPDATE tasks SET retry_count = retry_count + 1 WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Cancel task
     */
    static async cancel(id) {
        return this.updateStatus(id, 'cancelled');
    }

    /**
     * Delete old completed tasks
     */
    static async cleanupOldTasks(daysOld = 30) {
        const result = await query(
            `DELETE FROM tasks 
       WHERE status IN ('completed', 'failed', 'cancelled') 
       AND completed_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`,
        );
        return result.rowCount;
    }

    /**
     * Get task statistics
     */
    static async getStatistics() {
        const result = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks
      FROM tasks
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
        return result.rows[0];
    }
}

module.exports = Task;
