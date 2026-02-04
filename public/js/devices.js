// ===== Device Management =====

let currentDeviceData = null;

async function loadDevices() {
    const deviceGrid = document.getElementById('device-grid');
    deviceGrid.innerHTML = '<div class="loading">Loading devices...</div>';

    try {
        const response = await apiRequest('/devices');
        const devices = response.data || [];

        if (devices.length === 0) {
            deviceGrid.innerHTML = '<div class="loading">No devices found</div>';
            return;
        }

        deviceGrid.innerHTML = devices.map(device => `
            <div class="device-card" onclick="showDeviceDetails(${device.id})">
                <div class="device-header">
                    <div>
                        <div class="device-title">${escapeHtml(device.manufacturer || 'Unknown')} ${escapeHtml(device.model || '')}</div>
                        <div class="device-subtitle">SN: ${escapeHtml(device.serial_number)}</div>
                    </div>
                    <span class="badge badge-${device.status}">${device.status.toUpperCase()}</span>
                </div>
                <div class="device-info">
                    <div class="device-info-item">
                        <span class="device-info-label">IP Address:</span>
                        <span>${device.ip_address || 'N/A'}</span>
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">Last Inform:</span>
                        <span>${device.last_inform ? formatTime(device.last_inform) : 'Never'}</span>
                    </div>
                    <div class="device-info-item">
                        <span class="device-info-label">Software:</span>
                        <span>${escapeHtml(device.software_version || 'N/A')}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load devices:', error);
        deviceGrid.innerHTML = '<div class="loading">Failed to load devices</div>';
    }
}

async function showDeviceDetails(deviceId) {
    try {
        const response = await apiRequest(`/devices/${deviceId}`);
        currentDeviceData = response.data;

        const modal = document.getElementById('device-modal');
        const modalTitle = document.getElementById('modal-device-name');
        const modalBody = document.getElementById('modal-device-body');

        modalTitle.textContent = `${currentDeviceData.manufacturer} ${currentDeviceData.model}`;

        modalBody.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem;">Device Information</h4>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
                    <div style="display: grid; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Serial Number:</span>
                            <span>${escapeHtml(currentDeviceData.serial_number)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Status:</span>
                            <span class="badge badge-${currentDeviceData.status}">${currentDeviceData.status.toUpperCase()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">IP Address:</span>
                            <span>${currentDeviceData.ip_address || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Last Inform:</span>
                            <span>${currentDeviceData.last_inform ? formatTime(currentDeviceData.last_inform) : 'Never'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem;">Quick Actions</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                    <button class="btn btn-primary btn-sm" onclick="showProvisionForm(${deviceId})">
                        📋 Provision
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="rebootDevice(${deviceId})">
                        🔄 Reboot
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="runDiagnostic(${deviceId})">
                        🔍 Diagnostic
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="showFirmwareForm(${deviceId})">
                        ⬆️ Firmware
                    </button>
                </div>
            </div>

            ${currentDeviceData.parameters && currentDeviceData.parameters.length > 0 ? `
                <div>
                    <h4 style="margin-bottom: 0.5rem;">Device Parameters (${currentDeviceData.parameters.length})</h4>
                    <div style="max-height: 300px; overflow-y: auto; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
                        ${currentDeviceData.parameters.slice(0, 20).map(param => `
                            <div style="font-size: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                                <div style="color: var(--text-muted); margin-bottom: 0.25rem;">${escapeHtml(param.parameter_name)}</div>
                                <div>${escapeHtml(param.parameter_value || 'N/A')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        modal.classList.add('show');
    } catch (error) {
        console.error('Failed to load device details:', error);
        alert('Failed to load device details');
    }
}

function closeDeviceModal() {
    document.getElementById('device-modal').classList.remove('show');
    currentDeviceData = null;
}

function showProvisionForm(deviceId) {
    const modalBody = document.getElementById('modal-device-body');
    modalBody.innerHTML = `
        <h4 style="margin-bottom: 1rem;">Provision Device</h4>
        <form id="provision-form" onsubmit="submitProvision(event, ${deviceId})">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label>WiFi SSID</label>
                    <input type="text" name="ssid" required>
                </div>
                <div class="form-group">
                    <label>WiFi Password</label>
                    <input type="password" name="password" required>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="submit" class="btn btn-primary">Apply Configuration</button>
                    <button type="button" class="btn btn-ghost" onclick="showDeviceDetails(${deviceId})">Cancel</button>
                </div>
            </div>
        </form>
    `;
}

async function submitProvision(event, deviceId) {
    event.preventDefault();
    const form = event.target;
    const ssid = form.ssid.value;
    const password = form.password.value;

    try {
        await apiRequest(`/devices/${deviceId}/provision`, {
            method: 'POST',
            body: JSON.stringify({
                taskName: 'WiFi Provisioning',
                parameters: [
                    {
                        name: 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID',
                        value: ssid,
                        type: 'xsd:string'
                    },
                    {
                        name: 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase',
                        value: password,
                        type: 'xsd:string'
                    }
                ]
            })
        });

        alert('Provisioning task created successfully!');
        closeDeviceModal();
        showView('tasks-view');
    } catch (error) {
        alert('Failed to create provisioning task: ' + error.message);
    }
}

async function rebootDevice(deviceId) {
    if (!confirm('Are you sure you want to reboot this device?')) return;

    try {
        await apiRequest(`/devices/${deviceId}/reboot`, {
            method: 'POST'
        });
        alert('Reboot task created successfully!');
        closeDeviceModal();
    } catch (error) {
        alert('Failed to create reboot task: ' + error.message);
    }
}

async function runDiagnostic(deviceId) {
    try {
        await apiRequest(`/devices/${deviceId}/diagnostic`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        alert('Diagnostic task created successfully!');
        closeDeviceModal();
        showView('tasks-view');
    } catch (error) {
        alert('Failed to create diagnostic task: ' + error.message);
    }
}

function showFirmwareForm(deviceId) {
    const modalBody = document.getElementById('modal-device-body');
    modalBody.innerHTML = `
        <h4 style="margin-bottom: 1rem;">Firmware Update</h4>
        <form id="firmware-form" onsubmit="submitFirmware(event, ${deviceId})">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label>Firmware URL</label>
                    <input type="url" name="fileUrl" placeholder="http://example.com/firmware.bin" required>
                </div>
                <div class="form-group">
                    <label>File Size (bytes)</label>
                    <input type="number" name="fileSize" placeholder="Optional">
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="submit" class="btn btn-primary">Push Update</button>
                    <button type="button" class="btn btn-ghost" onclick="showDeviceDetails(${deviceId})">Cancel</button>
                </div>
            </div>
        </form>
    `;
}

async function submitFirmware(event, deviceId) {
    event.preventDefault();
    const form = event.target;

    if (!confirm('Are you sure you want to push this firmware update?')) return;

    try {
        await apiRequest(`/devices/${deviceId}/firmware`, {
            method: 'POST',
            body: JSON.stringify({
                fileUrl: form.fileUrl.value,
                fileType: '1 Firmware Upgrade Image',
                fileSize: parseInt(form.fileSize.value) || 0
            })
        });

        alert('Firmware update task created successfully!');
        closeDeviceModal();
        showView('tasks-view');
    } catch (error) {
        alert('Failed to create firmware update task: ' + error.message);
    }
}

// Tasks view
async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<div class="loading">Loading tasks...</div>';

    try {
        const response = await apiRequest('/tasks');
        const tasks = response.data || [];

        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="loading">No tasks found</div>';
            return;
        }

        taskList.innerHTML = tasks.map(task => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${getTaskStatusColor(task.status)}">
                    ${getTaskStatusIcon(task.status)}
                </div>
                <div class="activity-content">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${escapeHtml(task.task_name)}</strong>
                            <span style="color: var(--text-muted); font-size: 0.75rem;"> - ${task.serial_number}</span>
                        </div>
                        <span class="badge badge-${task.status}">${task.status.toUpperCase()}</span>
                    </div>
                    <div class="activity-time">Created: ${formatTime(task.created_at)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load tasks:', error);
        taskList.innerHTML = '<div class="loading">Failed to load tasks</div>';
    }
}

function getTaskStatusColor(status) {
    const colors = {
        pending: 'rgba(245, 158, 11, 0.15)',
        in_progress: 'rgba(59, 130, 246, 0.15)',
        completed: 'rgba(16, 185, 129, 0.15)',
        failed: 'rgba(239, 68, 68, 0.15)',
        cancelled: 'rgba(156, 163, 175, 0.15)',
    };
    return colors[status] || colors.pending;
}

function getTaskStatusIcon(status) {
    const icons = {
        pending: '⏳',
        in_progress: '⚙️',
        completed: '✅',
        failed: '❌',
        cancelled: '🚫',
    };
    return icons[status] || icons.pending;
}

// Logs view
async function loadLogs() {
    const logList = document.getElementById('log-list');
    logList.innerHTML = '<div class="loading">Loading logs...</div>';

    try {
        const response = await apiRequest('/logs?limit=100');
        const logs = response.data || [];

        if (logs.length === 0) {
            logList.innerHTML = '<div class="loading">No logs found</div>';
            return;
        }

        logList.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${getSeverityColor(log.severity)}">
                    ${getSeverityIcon(log.severity)}
                </div>
                <div class="activity-content">
                    <div class="activity-message">
                        <strong>[${log.event_type}]</strong> ${escapeHtml(log.message)}
                        ${log.serial_number ? `<span style="color: var(--text-muted);"> - ${log.serial_number}</span>` : ''}
                    </div>
                    <div class="activity-time">${formatTime(log.timestamp)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load logs:', error);
        logList.innerHTML = '<div class="loading">Failed to load logs</div>';
    }
}

// Close modal when clicking outside
document.getElementById('device-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'device-modal') {
        closeDeviceModal();
    }
});
