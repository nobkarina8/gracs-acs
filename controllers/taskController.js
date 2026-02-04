const Task = require('../models/Task');

class TaskController {
    /**
     * Get all tasks
     */
    async index(req, res) {
        try {
            const { status, taskType, deviceId } = req.query;
            const tasks = await Task.findAll({ status, taskType, deviceId });

            res.json({ success: true, data: tasks });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    }

    /**
     * Get task by ID
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            res.json({ success: true, data: task });
        } catch (error) {
            console.error('Get task error:', error);
            res.status(500).json({ error: 'Failed to fetch task' });
        }
    }

    /**
     * Cancel task
     */
    async cancel(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.cancel(id);

            res.json({ success: true, message: 'Task cancelled', data: task });
        } catch (error) {
            console.error('Cancel task error:', error);
            res.status(500).json({ error: 'Failed to cancel task' });
        }
    }

    /**
     * Get task statistics
     */
    async statistics(req, res) {
        try {
            const stats = await Task.getStatistics();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Get task statistics error:', error);
            res.status(500).json({ error: 'Failed to fetch task statistics' });
        }
    }
}

module.exports = new TaskController();
