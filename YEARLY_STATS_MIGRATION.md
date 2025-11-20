# Yearly Statistics Migration Guide

This document explains how to apply the database migration to add yearly statistics support.

## What's New

The application now supports displaying:
- **Yearly High/Low**: Rolling 365-day high and low water levels
- **Yearly Average**: Average water level over the last 365 days
- **Visual Bands**: Reference lines on the 24-hour chart showing yearly high, low, and average
- **Enhanced Records Display**: Yearly statistics alongside all-time records

## Database Migration

### SQL Migration

Run the following SQL in your Supabase SQL editor to create the yearly statistics view:

```sql
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
```

### Alternative: Run Full Schema

Alternatively, you can run the complete `supabase-schema.sql` file which includes both the `daily_stats` table and the new `yearly_stats` view:

```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase-schema.sql
```

Or use the Supabase dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste and run

## How It Works

### Data Flow

1. **Daily Collection**: The `/api/store-reading` cron job continues to run daily, storing min/max/avg water levels in the `daily_stats` table
2. **Yearly View**: The `yearly_stats` view automatically calculates statistics from the last 365 days of `daily_stats` records
3. **Frontend Display**: The UI fetches both all-time records and yearly statistics, displaying them separately

### Frontend Changes

- **LevelChart Component**: Now displays three reference lines on the 24-hour chart:
  - Red dashed line: Yearly high
  - Blue dashed line: Yearly low
  - Green dashed line: Yearly average

- **MinMaxRecords Component**: Reorganized to show:
  - **Last 365 Days section**: Yearly high, low, average, and range
  - **All-Time Records section**: Historical all-time high and low

## Features

### Visual Bands on Chart
The chart now shows reference lines that provide context for current water levels:
- Helps users understand if current levels are normal or unusual
- Shows historical context for the 24-hour trend

### Trend Analysis
The existing trend indicator already shows:
- Rising/Falling/Stable status
- Rate of change in feet per hour
- Visual arrow indicators

### Historical Context
Users can now see:
- How current levels compare to yearly norms
- The range of water levels over the past year
- When yearly extremes occurred

## Testing

To test locally:
1. Ensure you have at least a few days of data in `daily_stats`
2. The yearly view will show statistics based on available data
3. If you have less than 365 days of data, it will calculate from available records

## Notes

- The view updates automatically as new daily stats are added
- No additional cron jobs or maintenance required
- Query performance is optimized with existing indexes on `daily_stats`
- The view is read-only and doesn't consume additional storage
