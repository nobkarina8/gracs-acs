-- Migration: Create Device Parameters Table
-- Description: Stores all TR-069 parameters for each device

CREATE TABLE IF NOT EXISTS device_parameters (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    parameter_value TEXT,
    parameter_type VARCHAR(50) DEFAULT 'string',
    
    -- Writable flag
    writable BOOLEAN DEFAULT false,
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one parameter per device
    UNIQUE(device_id, parameter_name)
);

-- Create indexes
CREATE INDEX idx_params_device ON device_parameters(device_id);
CREATE INDEX idx_params_name ON device_parameters(parameter_name);
CREATE INDEX idx_params_device_name ON device_parameters(device_id, parameter_name);

-- Common TR-069 parameters to track:
-- InternetGatewayDevice.DeviceInfo.SoftwareVersion
-- InternetGatewayDevice.DeviceInfo.HardwareVersion
-- InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID
-- InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase
-- InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username
-- InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password
