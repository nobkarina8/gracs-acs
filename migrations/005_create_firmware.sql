-- Migration: Create Firmware Table
-- Description: Manage firmware files for device updates

CREATE TABLE IF NOT EXISTS firmware (
    id SERIAL PRIMARY KEY,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    version VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    
    -- File details
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    checksum_md5 VARCHAR(32),
    checksum_sha256 VARCHAR(64),
    
    -- Metadata
    description TEXT,
    release_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(manufacturer, model, version)
);

-- Create indexes
CREATE INDEX idx_firmware_manufacturer_model ON firmware(manufacturer, model);
CREATE INDEX idx_firmware_version ON firmware(version);
CREATE INDEX idx_firmware_active ON firmware(is_active);
