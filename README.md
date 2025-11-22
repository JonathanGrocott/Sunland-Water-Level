# Sunland River Tracker

A beautiful, real-time water level tracker for the Columbia River at Sunland (Wanapum Dam forebay elevation).

![Sunland River Tracker](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🌊 **Real-Time Water Levels** - Live data from USACE Dataquery API
- 🔮 **6-Hour Predictions** - Forecast rising/falling trends based on upstream conditions
- ⬆️ **Upstream Flow Monitoring** - Track releases from Chief Joseph & Grand Coulee Dams
- ⚖️ **Flow Balance Analysis** - Compare Wanapum inflow vs outflow for accurate predictions
- 📈 **24-Hour Trend Chart** - Visual representation of water level changes with historical reference bands
- 📊 **Yearly Statistics** - Rolling 365-day high, low, and average water levels
- 🎯 **Visual Reference Bands** - Chart overlays showing yearly high, low, and average for context
- 🔄 **Flow Trend Indicator** - Real-time rising/falling/stable status with rate of change
- 📉 **All-Time Records** - Historical high/low water levels since tracking began
- 🌅 **Beautiful Sun Theme** - Stunning gradient background with animations
- 📱 **Mobile Responsive** - Perfect on any device
- ♻️ **Auto-Refresh** - Updates every 5 minutes


## Live Demo

Visit the live site: [https://sunland-water-level.vercel.app/](https://sunland-water-level.vercel.app/)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (free tier)

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Sunland-Water-Level.git
cd Sunland-Water-Level
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (see `.env.example` for all required variables):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5174 in your browser

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel with Supabase.

## How It Works

### Data Flow

1. **Real-Time Data**: 
   - Frontend fetches water level data from `/api/usace`
   - Serverless function proxies requests to USACE API
   - Data updates every 5 minutes automatically

2. **Upstream Flow Monitoring**:
   - Frontend fetches upstream dam data from `/api/upstream-dams`
   - Prioritizes closer dams for better short-term predictions:
     - Rocky Reach Dam (~20 mi upstream, 2-4 hour impact)
     - Wells Dam (~35 mi upstream, 4-8 hour impact)
     - Chief Joseph Dam (~50 mi upstream, 6-12 hour impact)
     - Grand Coulee Dam (~100 mi upstream, 24-36 hour impact)
   - Automatically selects the best available upstream dam for predictions
   - Compares Wanapum inflow vs outflow to predict level changes
   - Provides 6-hour outlook: Rising/Falling/Stable
   - Updates every 5 minutes with current water level data

3. **Prediction Algorithm**:
   - Calculates net flow: `inflow - outflow` at Wanapum Dam
   - Converts to rate of change: `(net flow × 3600) / reservoir surface area`
   - Predicts direction based on flow balance and upstream trends
   - Shows estimated level change over next 6-12 hours
   - Displays confidence level based on data quality

4. **Historical Records**:
   - Cron job runs daily at midnight UTC
   - Fetches last 24h of data and calculates min/max/avg
   - Stores in Supabase `daily_stats` table
   - Frontend displays all-time high/low records
   
5. **Upstream Flow Storage**:
   - Cron job runs daily at midnight UTC
   - Collects flow data from upstream dams
   - Stores in Supabase `upstream_flows` table
   - Builds dataset for pattern analysis

6. **Yearly Statistics**:
   - `yearly_stats` view calculates rolling 365-day statistics
   - Automatically updates as new daily data is added
   - Provides context through visual reference bands on charts
   - Shows yearly high, low, average, and range


### File Structure

```
Sunland-Water-Level/
├── api/                    # Vercel serverless functions
│   ├── usace.js           # Proxy for USACE API
│   ├── store-reading.js   # Daily data collection cron
│   ├── upstream-dams.js   # Upstream flow data API (NEW)
│   └── store-upstream-flows.js  # Hourly upstream flow collection (NEW)
├── src/
│   ├── components/        # React components
│   │   ├── SunBackground.tsx
│   │   ├── CurrentLevel.tsx
│   │   ├── LevelChart.tsx
│   │   ├── MinMaxRecords.tsx
│   │   └── UpstreamConditions.tsx  # Upstream flow display (NEW)
│   ├── services/          # Service layer
│   │   ├── WaterLevelService.ts
│   │   ├── DatabaseService.ts
│   │   └── UpstreamFlowService.ts  # Upstream flow logic (NEW)
│   └── App.tsx           # Main application
├── supabase-schema.sql   # Database schema
├── supabase-upstream-schema.sql  # Upstream flows schema (NEW)
├── vercel.json           # Vercel configuration
├── DEPLOYMENT.md         # Deployment guide
├── UPSTREAM_FLOWS_MIGRATION.md  # Upstream flows setup guide (NEW)
└── YEARLY_STATS_MIGRATION.md  # Yearly stats setup guide
```

## Environment Variables

Required environment variables (see `.env.example`):

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_URL` - Same as above (for serverless functions)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (admin access)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Water level data provided by [U.S. Army Corps of Engineers](https://www.nwd-wc.usace.army.mil/)
- Built for the Sunland community on the Columbia River

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for the Sunland community
