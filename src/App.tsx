import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SunBackground } from './components/SunBackground';
import { CurrentLevel } from './components/CurrentLevel';
import { LevelChart } from './components/LevelChart';
import { MinMaxRecords } from './components/MinMaxRecords';
import { UpstreamConditions } from './components/UpstreamConditions';
import { waterLevelService } from './services/WaterLevelService';
import { databaseService } from './services/DatabaseService';
import { upstreamFlowService } from './services/UpstreamFlowService';
import type { CurrentCondition, WaterLevelData } from './services/WaterLevelService';
import type { AllTimeRecords, YearlyStats, MonthlyStats } from './services/DatabaseService';
import type { UpstreamData } from './services/UpstreamFlowService';
import { RefreshCw } from 'lucide-react';

function App() {
  const [currentCondition, setCurrentCondition] = useState<CurrentCondition | null>(null);
  const [history, setHistory] = useState<WaterLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AllTimeRecords | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [upstreamData, setUpstreamData] = useState<UpstreamData | null>(null);
  const [upstreamLoading, setUpstreamLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setUpstreamLoading(true);
    try {
      const [cond, hist, upstream] = await Promise.all([
        waterLevelService.getCurrentCondition(),
        waterLevelService.getHistory(),
        upstreamFlowService.getUpstreamData().catch(err => {
          console.error('Failed to fetch upstream data:', err);
          return null;
        })
      ]);
      setCurrentCondition(cond);
      setHistory(hist);
      setUpstreamData(upstream);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
      setUpstreamLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const [allTimeRecords, yearlyData, monthlyData] = await Promise.all([
        databaseService.getAllTimeRecords(),
        databaseService.getYearlyStats(),
        databaseService.getMonthlyStats()
      ]);
      setRecords(allTimeRecords);
      setYearlyStats(yearlyData);
      setMonthlyStats(monthlyData);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecords();
    const interval = setInterval(fetchData, 60000 * 5); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen w-full relative text-white font-sans selection:bg-yellow-500/30">
      <SunBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-md min-h-screen flex flex-col">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-md tracking-tight">
            Sunland
            <span className="block text-sm font-normal text-yellow-100/80 mt-1 uppercase tracking-widest">River Tracker</span>
          </h1>
        </header>

        <div className="flex-grow flex flex-col gap-6">
          <CurrentLevel data={currentCondition} loading={loading} monthlyStats={monthlyStats} yearlyStats={yearlyStats} />

          <UpstreamConditions data={upstreamData} loading={upstreamLoading} />

          {!loading && (
            <LevelChart data={history} yearlyStats={yearlyStats} monthlyStats={monthlyStats} />
          )}

          <MinMaxRecords records={records} yearlyStats={yearlyStats} loading={recordsLoading} />
        </div>

        <footer className="mt-auto pt-8 pb-4 text-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm text-yellow-100/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <p className="text-xs text-white/30 mt-4">
            Data source: USACE Dataquery (Real-time)
          </p>
        </footer>
      </div>

      <Analytics />
    </main>
  );
}

export default App;
