import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { CurrentCondition } from '../services/WaterLevelService';

interface CurrentLevelProps {
    data: CurrentCondition | null;
    loading: boolean;
}

export const CurrentLevel: React.FC<CurrentLevelProps> = ({ data, loading }) => {
    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 animate-pulse">
                <div className="h-16 w-48 bg-white/20 rounded-lg mb-4"></div>
                <div className="h-6 w-32 bg-white/20 rounded-lg"></div>
            </div>
        );
    }

    const getTrendIcon = () => {
        switch (data.trend) {
            case 'rising': return <ArrowUp className="w-8 h-8 text-green-400" />;
            case 'falling': return <ArrowDown className="w-8 h-8 text-red-400" />;
            default: return <Minus className="w-8 h-8 text-gray-300" />;
        }
    };

    const getTrendText = () => {
        switch (data.trend) {
            case 'rising': return 'Rising';
            case 'falling': return 'Falling';
            default: return 'Stable';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-white p-6 backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 max-w-sm mx-auto w-full">
            <h2 className="text-lg font-medium text-yellow-100 mb-2 uppercase tracking-wider">Current Level</h2>

            <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-200 drop-shadow-lg">
                    {data.currentLevel.toFixed(1)}
                </span>
                <span className="text-xl text-yellow-100/80 font-light">ft</span>
            </div>

            <div className="flex items-center gap-3 mt-6 bg-black/20 px-6 py-3 rounded-full">
                {getTrendIcon()}
                <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase tracking-wide">{getTrendText()}</span>
                    <span className="text-xs text-gray-300">{data.rateOfChange} ft/hr</span>
                </div>
            </div>

            <div className="mt-4 text-xs text-yellow-100/60">
                Updated: {data.lastUpdated}
            </div>
        </div>
    );
};
