import React from 'react';
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
import type { CurrentCondition } from '../services/WaterLevelService';
import type { YearlyStats, MonthlyStats } from '../services/DatabaseService';

// Rate of change thresholds (feet per hour)
const RATE_VERY_FAST_THRESHOLD = 0.4;
const RATE_FAST_THRESHOLD = 0.2;
const RATE_NORMAL_THRESHOLD = 0.05;

// Position thresholds for monthly range
const POSITION_HIGH_THRESHOLD = 0.75;
const POSITION_LOW_THRESHOLD = 0.25;

// Minimum rate threshold for time-to-low calculations (feet per hour)
const MIN_RATE_FOR_PREDICTION = 0.001;

interface CurrentLevelProps {
    data: CurrentCondition | null;
    loading: boolean;
    monthlyStats?: MonthlyStats | null;
    yearlyStats?: YearlyStats | null;
}

export const CurrentLevel: React.FC<CurrentLevelProps> = ({ data, loading, monthlyStats, yearlyStats }) => {
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

    // Determine if the rate of change is high, normal, or low
    const getRateContext = () => {
        if (!monthlyStats || data.trend === 'stable') return null;
        
        if (data.rateOfChange > RATE_VERY_FAST_THRESHOLD) {
            return 'Very Fast';
        } else if (data.rateOfChange > RATE_FAST_THRESHOLD) {
            return 'Fast';
        } else if (data.rateOfChange > RATE_NORMAL_THRESHOLD) {
            return 'Normal';
        }
        return null;
    };

    // Calculate time to reach yearly low if falling
    const getTimeToLow = () => {
        if (data.trend !== 'falling' || !yearlyStats || data.rateOfChange < MIN_RATE_FOR_PREDICTION) {
            return null;
        }

        const distanceToLow = data.currentLevel - yearlyStats.yearly_low;
        if (distanceToLow <= 0) return null;

        const hoursToLow = distanceToLow / data.rateOfChange;
        
        if (hoursToLow < 24) {
            return `~${Math.round(hoursToLow)} hrs to yearly low`;
        } else {
            const daysToLow = Math.round(hoursToLow / 24);
            return `~${daysToLow} days to yearly low`;
        }
    };

    // Get position relative to monthly range
    const getPositionContext = () => {
        if (!monthlyStats || monthlyStats.monthly_range === 0) return null;
        
        const position = (data.currentLevel - monthlyStats.monthly_low) / monthlyStats.monthly_range;
        
        if (position > POSITION_HIGH_THRESHOLD) return 'High in monthly range';
        if (position < POSITION_LOW_THRESHOLD) return 'Low in monthly range';
        return 'Mid-range for month';
    };

    const rateContext = getRateContext();
    const timeToLow = getTimeToLow();
    const positionContext = getPositionContext();

    return (
        <div className="flex flex-col items-center justify-center text-white p-6 backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 max-w-sm mx-auto w-full">
            <h2 className="text-lg font-medium text-yellow-100 mb-2 uppercase tracking-wider">Current Level</h2>

            <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-200 drop-shadow-lg">
                    {data.currentLevel.toFixed(1)}
                </span>
                <span className="text-xl text-yellow-100/80 font-light">ft</span>
            </div>

            {positionContext && (
                <div className="mt-2 text-xs text-yellow-100/70 font-medium">
                    {positionContext}
                </div>
            )}

            <div className="flex items-center gap-3 mt-6 bg-black/20 px-6 py-3 rounded-full">
                {getTrendIcon()}
                <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase tracking-wide">{getTrendText()}</span>
                    <span className="text-xs text-gray-300">
                        {data.rateOfChange} ft/hr
                        {rateContext && <span className="text-yellow-300 ml-1">• {rateContext}</span>}
                    </span>
                </div>
            </div>

            {timeToLow && (
                <div className="mt-4 flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-400/30">
                    <AlertTriangle className="w-4 h-4 text-red-300" />
                    <span className="text-xs text-red-200 font-medium">{timeToLow}</span>
                </div>
            )}

            <div className="mt-4 text-xs text-yellow-100/60">
                Updated: {data.lastUpdated}
            </div>
        </div>
    );
};
