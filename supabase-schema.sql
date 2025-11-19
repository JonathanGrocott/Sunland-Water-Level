-- Create daily_stats table for storing min/max water level summaries
CREATE TABLE IF NOT EXISTS daily_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  min_elevation DECIMAL(6,3) NOT NULL,
  max_elevation DECIMAL(6,3) NOT NULL,
  avg_elevation DECIMAL(6,3) NOT NULL,
  min_timestamp TIMESTAMPTZ NOT NULL,
  max_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_max_elevation ON daily_stats(max_elevation DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_min_elevation ON daily_stats(min_elevation ASC);

-- Add comments for documentation
COMMENT ON TABLE daily_stats IS 'Daily summary statistics for water levels';
COMMENT ON COLUMN daily_stats.date IS 'Date for the summary (PST timezone)';
COMMENT ON COLUMN daily_stats.min_elevation IS 'Minimum water elevation for the day (feet)';
COMMENT ON COLUMN daily_stats.max_elevation IS 'Maximum water elevation for the day (feet)';
COMMENT ON COLUMN daily_stats.avg_elevation IS 'Average water elevation for the day (feet)';
COMMENT ON COLUMN daily_stats.min_timestamp IS 'Timestamp when minimum occurred';
COMMENT ON COLUMN daily_stats.max_timestamp IS 'Timestamp when maximum occurred';
