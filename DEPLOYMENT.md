# Sunland River Tracker - Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier)
- Supabase account (free tier)

---

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project
1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in the details:
   - Name: `sunland-water-level`
   - Database Password: (choose a strong password and save it)
   - Region: Select the closest to your location
4. Click **"Create new project"** and wait for it to initialize

### 1.2 Run the Database Schema
1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the `supabase-schema.sql` file from this project
4. Copy all the SQL code and paste it into the query editor
5. Click **"Run"** to create the `daily_stats` table

### 1.3 Get Your API Keys
1. In Supabase dashboard, go to **Settings** > **API**
2. You'll need these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)
3. Save these values - you'll need them for Vercel

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit - Sunland River Tracker"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com and create a new repository
2. Name it `Sunland-Water-Level` (or your preferred name)
3. **Do NOT** initialize with README (we already have code)
4. Copy the repository URL

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### 3.1 Import Project
1. Go to https://vercel.com and sign in
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repository
4. Click **"Import"**

### 3.2 Configure Environment Variables
Before deploying, add your environment variables:

1. In the project configuration screen, expand **"Environment Variables"**
2. Add the following variables:

| Name | Value | Where to get it |
|------|-------|----------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Settings > API > Project URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` | Supabase Settings > API > service_role key |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Settings > API > anon public key |

3. Make sure all variables are added to **Production**, **Preview**, and **Development** environments

### 3.3 Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Once complete, click **"Visit"** to see your live site!

---

## Step 4: Set Up Data Collection

The app needs to collect daily min/max stats. Vercel Cron Jobs are the easiest way on the free tier.

### 4.1 Add Cron Configuration

Update `vercel.json` to include:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "crons": [{
    "path": "/api/store-reading",
    "schedule": "0 0 * * *"
  }]
}
```

This will run the data collection every day at midnight UTC.

### 4.2 Manual First Run

To populate initial data:
1. Go to your Vercel dashboard
2. Click on your project > **"Deployments"** > Latest deployment
3. Go to **"Functions"** tab
4. Find `/api/store-reading` and click **"Invoke"**
5. This will store today's stats

---

## Step 5: Verify Deployment

### 5.1 Check the Live Site
1. Visit your Vercel URL (e.g., `https://sunland-water-level.vercel.app`)
2. Verify that:
   - Current water level displays
   - 24-hour chart loads
   - **All-Time Records** section shows (might be empty initially)

### 5.2 Test Data Collection
1. Go to `https://your-app.vercel.app/api/store-reading`
2. You should see a JSON response with `"success": true`
3. Refresh your main page - the All-Time Records should now appear!

---

## Step 6: Custom Domain (Optional)

Want a custom domain like `water.sunland.com`?

1. In Vercel dashboard, go to your project > **Settings** > **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

---

## Troubleshooting

### "No historical data available yet"
- Run `/api/store-reading` manually to collect first day's data
- Wait 24 hours for automated collection to run

### "Failed to fetch records"
- Check Vercel logs for errors
- Verify environment variables are set correctly
- Ensure Supabase table was created successfully

### API Errors
- Check Vercel Functions logs
- Verify USACE API is accessible
- Check Supabase service key has correct permissions

---

## Maintenance

### Monitoring
- Check Vercel Analytics for traffic
- Monitor Supabase dashboard for database usage
- Review Function logs for any errors

### Updating
Just push to GitHub - Vercel will automatically redeploy!
```bash
git add .
git commit -m "Update feature X"
git push
```

---

## Free Tier Limits

### Vercel
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function executions

### Supabase
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth/month
- ✅ 50,000 monthly active users

Both are more than enough for this project!
