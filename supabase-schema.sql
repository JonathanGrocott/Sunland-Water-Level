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

-- Create view for yearly statistics (last 365 days rolling window)
CREATE OR REPLACE VIEW yearly_stats AS
SELECT
  MIN(min_elevation) as yearly_low,
  MAX(max_elevation) as yearly_high,
  AVG(avg_elevation) as yearly_avg,
  (SELECT min_timestamp FROM daily_stats WHERE min_elevation = MIN(daily_stats.min_elevation) LIMIT 1) as yearly_low_timestamp,
  (SELECT max_timestamp FROM daily_stats WHERE max_elevation = MAX(daily_stats.max_elevation) LIMIT 1) as yearly_high_timestamp,
  (SELECT date FROM daily_stats WHERE min_elevation = MIN(daily_stats.min_elevation) LIMIT 1) as yearly_low_date,
  (SELECT date FROM daily_stats WHERE max_elevation = MAX(daily_stats.max_elevation) LIMIT 1) as yearly_high_date
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '365 days';

COMMENT ON VIEW yearly_stats IS 'Rolling 365-day statistics for water levels';
