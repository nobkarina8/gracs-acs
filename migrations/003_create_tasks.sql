-- Migration: Create Tasks Table
-- Description: Queue for provisioning, firmware updates, reboots, and diagnostics

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Task details
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('provision', 'firmware', 'reboot', 'diagnostic', 'setparameters', 'getparameters')),
    task_name VARCHAR(255),
    
    -- Parameters (JSON format for flexibility)
    parameters JSONB,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    
    -- Results
    result JSONB,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Retry mechanism
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- Create indexes
CREATE INDEX idx_tasks_device ON tasks(device_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_created ON tasks(created_at);
CREATE INDEX idx_tasks_pending ON tasks(device_id, status) WHERE status = 'pending';
