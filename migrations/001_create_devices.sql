-- Migration: Create Devices Table
-- Description: Stores CPE device information and connection details

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    hardware_version VARCHAR(50),
    software_version VARCHAR(50),
    
    -- Connection details
    connection_url VARCHAR(500),
    connection_username VARCHAR(100),
    connection_password VARCHAR(255),
    
    -- Status information
    last_inform TIMESTAMP,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    ip_address INET,
    mac_address MACADDR,
    
    -- Additional info
    uptime INTEGER DEFAULT 0,
    periodic_inform_interval INTEGER DEFAULT 300,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_devices_serial ON devices(serial_number);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_last_inform ON devices(last_inform);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
