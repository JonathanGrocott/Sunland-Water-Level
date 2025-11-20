-- Upstream Flow Data Schema
-- This table stores hourly flow data from upstream dams to enable water level prediction

-- Create the upstream_flows table
CREATE TABLE IF NOT EXISTS upstream_flows (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    dam_name VARCHAR(50) NOT NULL, -- 'CHIEF_JOSEPH', 'GRAND_COULEE', 'ROCK_ISLAND', 'WANAPUM'
    outflow_cfs NUMERIC(10, 2), -- Outflow in cubic feet per second
    inflow_cfs NUMERIC(10, 2), -- Inflow in cubic feet per second (if available)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries (by dam and recent timestamps)
CREATE INDEX IF NOT EXISTS idx_upstream_flows_lookup 
    ON upstream_flows(dam_name, timestamp DESC);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_upstream_flows_timestamp 
    ON upstream_flows(timestamp DESC);

-- Add a unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_upstream_flows_unique 
    ON upstream_flows(dam_name, timestamp);

-- Comments for documentation
COMMENT ON TABLE upstream_flows IS 'Stores hourly flow data from upstream dams for water level prediction';
COMMENT ON COLUMN upstream_flows.dam_name IS 'Name of the dam: CHIEF_JOSEPH, GRAND_COULEE, ROCK_ISLAND, or WANAPUM';
COMMENT ON COLUMN upstream_flows.outflow_cfs IS 'Water outflow in cubic feet per second';
COMMENT ON COLUMN upstream_flows.inflow_cfs IS 'Water inflow in cubic feet per second';
COMMENT ON COLUMN upstream_flows.timestamp IS 'Timestamp of the reading in PST/PDT';
