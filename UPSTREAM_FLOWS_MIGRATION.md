# Upstream Flows Migration Guide

This guide explains how to set up the upstream flow monitoring feature for the Sunland Water Level Tracker.

## Overview

The upstream flow monitoring feature adds predictive capabilities by tracking water releases from dams upstream of Wanapum (Chief Joseph and Grand Coulee). This helps Sunland residents predict whether the water level will rise or fall in the next 6-12 hours.

## Prerequisites

- Access to your Supabase project's SQL editor
- Vercel project with cron job support (included in all plans)
- Existing environment variables (no new ones needed)

## Step 1: Database Schema Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-upstream-schema.sql`
5. Run the query

This will create:
- `upstream_flows` table to store hourly flow data
- Indexes for efficient querying
- Unique constraints to prevent duplicates

### Verify the Migration

Run this query to confirm the table was created:

```sql
SELECT * FROM upstream_flows LIMIT 1;
```

You should see the table structure (it will be empty initially).

## Step 2: Configure Vercel Cron Job

The upstream flow data needs to be collected every hour.

### Option A: Vercel Dashboard (Recommended)

1. Open your Vercel project dashboard
2. Go to **Settings** → **Cron Jobs**
3. Click **Add Cron Job**
4. Configure:
   - **Name**: Store Upstream Flows
   - **Schedule**: `0 * * * *` (every hour at minute 0)
   - **Path**: `/api/store-upstream-flows`
   - **Timezone**: `America/Los_Angeles` (PST/PDT)
5. Save the cron job

### Option B: vercel.json Configuration

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/store-reading",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/store-upstream-flows",
      "schedule": "0 * * * *"
    }
  ]
}
```

After deploying, Vercel will automatically set up the cron job.

## Step 3: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Add upstream flow monitoring"

# Push to your repository
git push origin feature/upstream-flow-monitoring

# Merge to main (or create a PR)
git checkout main
git merge feature/upstream-flow-monitoring
git push origin main
```

Vercel will automatically deploy the changes.

## Step 4: Verify the Setup

### Test the API Endpoints

1. **Test real-time upstream data**:
   ```bash
   curl https://your-app.vercel.app/api/upstream-dams
   ```
   
   You should see data for Chief Joseph, Grand Coulee, Rock Island, and Wanapum dams.

2. **Manually trigger the storage endpoint** (one time):
   ```bash
   curl -X POST https://your-app.vercel.app/api/store-upstream-flows
   ```
   
   This will store the first data points in your database.

### Verify Data Storage

In Supabase SQL Editor, run:

```sql
SELECT 
    dam_name, 
    timestamp, 
    outflow_cfs, 
    inflow_cfs 
FROM upstream_flows 
ORDER BY timestamp DESC 
LIMIT 10;
```

You should see recent data from the dams.

### Check the UI

1. Visit your deployed app
2. You should see the new **Upstream Flow Conditions** card
3. It should display:
   - 6-hour outlook (Rising/Falling/Stable)
   - Wanapum flow balance
   - Chief Joseph Dam status
   - Grand Coulee Dam status

## Step 5: Monitor Data Collection

After 24 hours, check that data is being collected regularly:

```sql
SELECT 
    dam_name,
    COUNT(*) as reading_count,
    MIN(timestamp) as first_reading,
    MAX(timestamp) as last_reading
FROM upstream_flows
GROUP BY dam_name;
```

Each dam should have approximately 24 readings per day.

## Troubleshooting

### No upstream data showing

1. **Check the API endpoint**:
   - Visit `/api/upstream-dams` directly
   - Look for errors in the browser console

2. **Verify USACE API is accessible**:
   - The USACE API sometimes has maintenance windows
   - Try again in a few minutes

3. **Check Vercel function logs**:
   - Open Vercel dashboard → Functions
   - Look for errors in `upstream-dams` function

### Cron job not running

1. **Verify cron job is configured**:
   - Check Vercel dashboard → Settings → Cron Jobs
   - Ensure the schedule is correct

2. **Check function logs**:
   - Look for execution logs in Vercel dashboard
   - Cron jobs appear in the Functions logs

3. **Manually trigger**:
   - Run `curl -X POST https://your-app.vercel.app/api/store-upstream-flows`
   - Check response for errors

### Database not storing data

1. **Verify Supabase credentials**:
   - Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in Vercel
   - Check the values are correct

2. **Check Supabase logs**:
   - Open Supabase dashboard → Logs
   - Look for failed INSERT operations

3. **Verify table exists**:
   - Run the schema migration again if needed

## Configuration Options

### Adjust Data Collection Frequency

To change how often data is collected, modify the cron schedule in `vercel.json`:

```json
{
  "schedule": "0 * * * *"  // Every hour
  // OR
  "schedule": "*/30 * * * *"  // Every 30 minutes
}
```

**Note**: More frequent collection = more database storage used (still minimal)

### Adjust Prediction Sensitivity

In `src/services/UpstreamFlowService.ts`, you can adjust the thresholds:

```typescript
// Current: 0.05 ft/hour change to show rising/falling
if (ratePerHour > 0.05) prediction = 'rising';
else if (ratePerHour < -0.05) prediction = 'falling';

// More sensitive:
if (ratePerHour > 0.02) prediction = 'rising';
```

## Database Maintenance

The `upstream_flows` table will grow over time. Recommended retention:

- **Keep**: Last 30 days for pattern analysis (Phase 2)
- **Archive**: Older data to CSV if needed
- **Auto-cleanup** (optional):

```sql
-- Delete data older than 90 days (run monthly)
DELETE FROM upstream_flows 
WHERE timestamp < NOW() - INTERVAL '90 days';
```

## Cost Estimates

- **Supabase Storage**: ~50KB per day = ~18MB per year (well within free tier)
- **Vercel Functions**: 24 executions/day = ~720/month (well within free tier)
- **API Calls to USACE**: 24/day (respectful, no rate limit issues)

## Next Steps

After successful deployment:

1. Monitor predictions vs actual changes for a few days
2. Adjust sensitivity thresholds if needed
3. Consider implementing Phase 2: Historical pattern analysis
4. Add browser notifications for significant changes (Phase 4)

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check Supabase logs
3. Verify USACE API is responding
4. Create an issue on GitHub with error details

---

**Deployment Date**: Add after first deployment  
**Last Updated**: November 20, 2025
