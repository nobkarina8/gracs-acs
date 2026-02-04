const soapBuilder = require('../utils/soapBuilder');
const Device = require('../models/Device');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

/**
 * CWMP Controller - Handles TR-069 protocol communication
 */
class CWMPController {
    /**
     * Main TR-069 endpoint handler
     */
    async handleRequest(req, res) {
        try {
            const soapXML = req.body;
            console.log('\n📨 Received SOAP Request:');
            console.log(soapXML);

            // Parse SOAP request
            const soapObj = await soapBuilder.parseSOAPRequest(soapXML);
            const body = soapObj['soap:Envelope']['soap:Body'];

            let response;

            // Handle different CWMP methods
            if (body['cwmp:Inform']) {
                response = await this.handleInform(body, req);
            } else if (body['cwmp:GetParameterValuesResponse']) {
                response = await this.handleGetParameterValuesResponse(body);
            } else if (body['cwmp:SetParameterValuesResponse']) {
                response = await this.handleSetParameterValuesResponse(body);
            } else if (body['cwmp:DownloadResponse']) {
                response = await this.handleDownloadResponse(body);
            } else if (body['cwmp:RebootResponse']) {
                response = await this.handleRebootResponse(body);
            } else if (body['cwmp:TransferComplete']) {
                response = await this.handleTransferComplete(body);
            } else {
                console.log('⚠️  Unknown CWMP method');
                response = soapBuilder.buildEmptyResponse();
            }

            console.log('\n📤 Sending SOAP Response:');
            console.log(response);

            res.set('Content-Type', 'text/xml');
            res.send(response);
        } catch (error) {
            console.error('❌ Error handling CWMP request:', error);
            await ActivityLog.logError(null, 'CWMP request handling failed', error);

            res.status(500).send(
                soapBuilder.buildEnvelope({
                    'soap:Fault': {
                        faultcode: 'Server',
                        faultstring: error.message,
                    },
                })
            );
        }
    }

    /**
     * Handle Inform message from CPE
     */
    async handleInform(body, req) {
        const informData = soapBuilder.parseInform({ 'soap:Envelope': { 'soap:Body': body } });

        console.log('📱 Device Inform:', informData.deviceId);
        console.log('🔔 Events:', informData.events);

        const serialNumber = informData.deviceId.serialNumber;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Find or create device
        let device = await Device.findBySerialNumber(serialNumber);

        if (!device) {
            console.log('➕ Creating new device:', serialNumber);
            device = await Device.create({
                serialNumber: serialNumber,
                manufacturer: informData.deviceId.manufacturer,
                model: informData.deviceId.productClass,
                hardwareVersion: '',
                softwareVersion: '',
                connectionUrl: '',
                connectionUsername: '',
                connectionPassword: '',
                ipAddress: ipAddress,
                macAddress: null,
            });

            await ActivityLog.logDeviceEvent(
                device.id,
                'device_registered',
                `New device registered: ${serialNumber}`,
                informData.deviceId
            );
        } else {
            // Update last inform
            await Device.updateLastInform(serialNumber, ipAddress);
        }

        // Store parameters
        if (informData.parameters && informData.parameters.length > 0) {
            await Device.setParameters(device.id, informData.parameters);
        }

        // Log events
        for (const event of informData.events) {
            await ActivityLog.logDeviceEvent(
                device.id,
                event.eventCode.toLowerCase().replace(/ /g, '_'),
                `Device event: ${event.eventCode}`,
                event
            );
        }

        // Check for pending tasks
        const pendingTask = await Task.getNextTask(device.id);

        if (pendingTask) {
            console.log('📋 Found pending task:', pendingTask.task_type);
            await Task.updateStatus(pendingTask.id, 'in_progress');

            // Execute task
            return await this.executeTask(device, pendingTask);
        }

        // No tasks, just send InformResponse
        return soapBuilder.buildInformResponse();
    }

    /**
     * Execute a task based on type
     */
    async executeTask(device, task) {
        const params = typeof task.parameters === 'string'
            ? JSON.parse(task.parameters)
            : task.parameters;

        switch (task.task_type) {
            case 'provision':
            case 'setparameters':
                return soapBuilder.buildSetParameterValues(params.parameters || []);

            case 'getparameters':
                return soapBuilder.buildGetParameterValues(params.parameters || []);

            case 'firmware':
                return soapBuilder.buildDownload(
                    params.fileUrl,
                    params.fileType || '1 Firmware Upgrade Image',
                    params.fileSize || 0
                );

            case 'reboot':
                return soapBuilder.buildReboot();

            default:
                await Task.fail(task.id, 'Unknown task type');
                return soapBuilder.buildInformResponse();
        }
    }

    /**
     * Handle GetParameterValuesResponse
     */
    async handleGetParameterValuesResponse(body) {
        const params = soapBuilder.parseGetParameterValuesResponse({
            'soap:Envelope': { 'soap:Body': body },
        });

        console.log('📊 Received parameters:', params);

        // Find the device and task (simplified - in production use session management)
        // Store parameters in database
        // Mark task as completed

        return soapBuilder.buildEmptyResponse();
    }

    /**
     * Handle SetParameterValuesResponse
     */
    async handleSetParameterValuesResponse(body) {
        console.log('✅ SetParameterValues completed');

        // Mark task as completed
        // Log success

        return soapBuilder.buildEmptyResponse();
    }

    /**
     * Handle DownloadResponse (firmware update acknowledgment)
     */
    async handleDownloadResponse(body) {
        console.log('⬇️  Download initiated');

        return soapBuilder.buildEmptyResponse();
    }

    /**
     * Handle RebootResponse
     */
    async handleRebootResponse(body) {
        console.log('🔄 Reboot initiated');

        return soapBuilder.buildEmptyResponse();
    }

    /**
     * Handle TransferComplete (firmware download completed)
     */
    async handleTransferComplete(body) {
        console.log('✅ Transfer completed');

        // Mark firmware task as completed
        // Log success

        return soapBuilder.buildEmptyResponse();
    }
}

module.exports = new CWMPController();
