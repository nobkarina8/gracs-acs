const Device = require('../models/Device');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

class DeviceController {
    /**
     * Get all devices
     */
    async index(req, res) {
        try {
            const { status, manufacturer } = req.query;
            const devices = await Device.findAll({ status, manufacturer });

            res.json({ success: true, data: devices });
        } catch (error) {
            console.error('Get devices error:', error);
            res.status(500).json({ error: 'Failed to fetch devices' });
        }
    }

    /**
     * Get device by ID
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Get device parameters
            const parameters = await Device.getParameters(id);

            // Get recent logs
            const logs = await ActivityLog.findAll({ deviceId: id, limit: 20 });

            res.json({
                success: true,
                data: {
                    ...device,
                    parameters,
                    recentLogs: logs,
                },
            });
        } catch (error) {
            console.error('Get device error:', error);
            res.status(500).json({ error: 'Failed to fetch device' });
        }
    }

    /**
     * Get device statistics
     */
    async statistics(req, res) {
        try {
            const stats = await Device.getStatistics();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }

    /**
     * Delete device
     */
    async destroy(req, res) {
        try {
            const { id } = req.params;
            await Device.delete(id);

            await ActivityLog.logSystemEvent(
                'device_deleted',
                `Device ID ${id} deleted by ${req.user.username}`,
                'warning'
            );

            res.json({ success: true, message: 'Device deleted successfully' });
        } catch (error) {
            console.error('Delete device error:', error);
            res.status(500).json({ error: 'Failed to delete device' });
        }
    }

    /**
     * Provision device (set parameters)
     */
    async provision(req, res) {
        try {
            const { id } = req.params;
            const { parameters, taskName } = req.body;

            if (!parameters || !Array.isArray(parameters)) {
                return res.status(400).json({ error: 'Parameters array required' });
            }

            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Create provision task
            const task = await Task.create({
                deviceId: id,
                taskType: 'provision',
                taskName: taskName || 'Device Provisioning',
                parameters: { parameters },
                priority: 8,
            });

            await ActivityLog.logDeviceEvent(
                id,
                'provision_task_created',
                `Provisioning task created by ${req.user.username}`,
                { taskId: task.id, parameters }
            );

            res.json({
                success: true,
                message: 'Provisioning task created',
                data: task,
            });
        } catch (error) {
            console.error('Provision error:', error);
            res.status(500).json({ error: 'Failed to create provisioning task' });
        }
    }

    /**
     * Push firmware update
     */
    async firmware(req, res) {
        try {
            const { id } = req.params;
            const { fileUrl, fileType, fileSize } = req.body;

            if (!fileUrl) {
                return res.status(400).json({ error: 'File URL required' });
            }

            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Create firmware update task
            const task = await Task.create({
                deviceId: id,
                taskType: 'firmware',
                taskName: 'Firmware Update',
                parameters: { fileUrl, fileType, fileSize },
                priority: 9,
            });

            await ActivityLog.logDeviceEvent(
                id,
                'firmware_task_created',
                `Firmware update task created by ${req.user.username}`,
                { taskId: task.id, fileUrl }
            );

            res.json({
                success: true,
                message: 'Firmware update task created',
                data: task,
            });
        } catch (error) {
            console.error('Firmware error:', error);
            res.status(500).json({ error: 'Failed to create firmware update task' });
        }
    }

    /**
     * Reboot device
     */
    async reboot(req, res) {
        try {
            const { id } = req.params;

            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Create reboot task
            const task = await Task.create({
                deviceId: id,
                taskType: 'reboot',
                taskName: 'Device Reboot',
                parameters: {},
                priority: 7,
            });

            await ActivityLog.logDeviceEvent(
                id,
                'reboot_task_created',
                `Reboot task created by ${req.user.username}`,
                { taskId: task.id }
            );

            res.json({
                success: true,
                message: 'Reboot task created',
                data: task,
            });
        } catch (error) {
            console.error('Reboot error:', error);
            res.status(500).json({ error: 'Failed to create reboot task' });
        }
    }

    /**
     * Run diagnostics
     */
    async diagnostic(req, res) {
        try {
            const { id } = req.params;
            const { parameters } = req.body;

            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Create diagnostic task
            const task = await Task.create({
                deviceId: id,
                taskType: 'getparameters',
                taskName: 'Device Diagnostics',
                parameters: {
                    parameters: parameters || [
                        'InternetGatewayDevice.DeviceInfo.UpTime',
                        'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress',
                        'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Status',
                    ],
                },
                priority: 6,
            });

            await ActivityLog.logDeviceEvent(
                id,
                'diagnostic_task_created',
                `Diagnostic task created by ${req.user.username}`,
                { taskId: task.id }
            );

            res.json({
                success: true,
                message: 'Diagnostic task created',
                data: task,
            });
        } catch (error) {
            console.error('Diagnostic error:', error);
            res.status(500).json({ error: 'Failed to create diagnostic task' });
        }
    }
}

module.exports = new DeviceController();
