import { useEffect, useState } from 'react';
import { SunBackground } from './components/SunBackground';
import { CurrentLevel } from './components/CurrentLevel';
import { LevelChart } from './components/LevelChart';
import { MinMaxRecords } from './components/MinMaxRecords';
import { waterLevelService } from './services/WaterLevelService';
import { databaseService } from './services/DatabaseService';
import type { CurrentCondition, WaterLevelData } from './services/WaterLevelService';
import type { AllTimeRecords } from './services/DatabaseService';
import { RefreshCw } from 'lucide-react';

function App() {
  const [currentCondition, setCurrentCondition] = useState<CurrentCondition | null>(null);
  const [history, setHistory] = useState<WaterLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AllTimeRecords | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cond, hist] = await Promise.all([
        waterLevelService.getCurrentCondition(),
        waterLevelService.getHistory()
      ]);
      setCurrentCondition(cond);
      setHistory(hist);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const allTimeRecords = await databaseService.getAllTimeRecords();
      setRecords(allTimeRecords);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecords();
    const interval = setInterval(fetchData, 60000 * 15); // Refresh every 15 mins
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
          <CurrentLevel data={currentCondition} loading={loading} />

          <MinMaxRecords records={records} loading={recordsLoading} />

          {!loading && (
            <LevelChart data={history} />
          )}
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
    </main>
  );
}

export default App;
