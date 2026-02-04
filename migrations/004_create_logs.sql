-- Migration: Create Activity Logs Table
-- Description: Track all device events and ACS activities

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_code VARCHAR(50),
    message TEXT,
    
    -- Additional data (JSON)
    data JSONB,
    
    -- Severity level
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    
    -- Source
    source VARCHAR(50) DEFAULT 'acs',
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_logs_device ON activity_logs(device_id);
CREATE INDEX idx_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_logs_event_type ON activity_logs(event_type);
CREATE INDEX idx_logs_severity ON activity_logs(severity);

-- Common event types:
-- - device_boot
-- - device_connect
-- - device_disconnect
-- - parameter_update
-- - firmware_update
-- - provision_complete
-- - diagnostic_complete
-- - error_occurred
