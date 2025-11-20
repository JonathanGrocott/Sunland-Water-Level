# Sunland River Tracker

A beautiful, real-time water level tracker for the Columbia River at Sunland (Wanapum Dam forebay elevation).

![Sunland River Tracker](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🌊 **Real-Time Water Levels** - Live data from USACE Dataquery API
- 📈 **24-Hour Trend Chart** - Visual representation of water level changes
- 📊 **All-Time Records** - Historical high/low water levels
- 🌅 **Beautiful Sun Theme** - Stunning gradient background with animations
- 📱 **Mobile Responsive** - Perfect on any device
- ♻️ **Auto-Refresh** - Updates every 15 minutes

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
   - Data updates every 15 minutes automatically

2. **Historical Records**:
   - Cron job runs daily at midnight UTC
   - Fetches last 24h of data and calculates min/max/avg
   - Stores in Supabase `daily_stats` table
   - Frontend displays all-time high/low records

### File Structure

```
Sunland-Water-Level/
├── api/                    # Vercel serverless functions
│   ├── usace.ts           # Proxy for USACE API
│   └── store-reading.ts   # Daily data collection cron
├── src/
│   ├── components/        # React components
│   │   ├── SunBackground.tsx
│   │   ├── CurrentLevel.tsx
│   │   ├── LevelChart.tsx
│   │   └── MinMaxRecords.tsx
│   ├── services/          # Service layer
│   │   ├── WaterLevelService.ts
│   │   └── DatabaseService.ts
│   └── App.tsx           # Main application
├── supabase-schema.sql   # Database schema
├── vercel.json           # Vercel configuration
└── DEPLOYMENT.md         # Deployment guide
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
