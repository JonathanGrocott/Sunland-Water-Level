import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { AllTimeRecords, YearlyStats } from '../services/DatabaseService';

interface MinMaxRecordsProps {
    records: AllTimeRecords | null;
    yearlyStats?: YearlyStats | null;
    loading: boolean;
}

export function MinMaxRecords({ records, yearlyStats, loading }: MinMaxRecordsProps) {
    if (loading) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-yellow-100/80 mb-4 text-center">
                    All-Time Records
                </h2>
                <div className="space-y-3">
                    <div className="animate-pulse bg-white/10 h-16 rounded-xl"></div>
                    <div className="animate-pulse bg-white/10 h-16 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!records || (!records.allTimeHigh && !records.allTimeLow)) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-yellow-100/80 mb-4 text-center">
                    All-Time Records
                </h2>
                <p className="text-sm text-white/50 text-center">
                    No historical data available yet
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-yellow-100/80 mb-4 text-center">
                Historical Records
            </h2>

            <div className="space-y-4">
                {/* Yearly High/Low Section */}
                {yearlyStats && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-yellow-100/60 mb-2 uppercase tracking-wider">
                            Last 365 Days
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Yearly High */}
                            <div className="bg-gradient-to-br from-red-500/15 to-orange-500/15 rounded-lg p-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-red-500/30 p-1 rounded-full">
                                            <TrendingUp className="w-3 h-3 text-red-200" />
                                        </div>
                                        <p className="text-xs text-white/60">Yearly High</p>
                                    </div>
                                    <p className="text-xl font-bold text-white ml-6">
                                        {yearlyStats.yearly_high.toFixed(1)} ft
                                    </p>
                                    <p className="text-xs text-white/50 ml-6">
                                        {format(new Date(yearlyStats.yearly_high_date), 'MMM d')}
                                    </p>
                                </div>
                            </div>

                            {/* Yearly Low */}
                            <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-lg p-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-blue-500/30 p-1 rounded-full">
                                            <TrendingDown className="w-3 h-3 text-blue-200" />
                                        </div>
                                        <p className="text-xs text-white/60">Yearly Low</p>
                                    </div>
                                    <p className="text-xl font-bold text-white ml-6">
                                        {yearlyStats.yearly_low.toFixed(1)} ft
                                    </p>
                                    <p className="text-xs text-white/50 ml-6">
                                        {format(new Date(yearlyStats.yearly_low_date), 'MMM d')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Yearly Average */}
                        <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-lg p-3 mt-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-white/60">Yearly Average</p>
                                    <p className="text-2xl font-bold text-white">
                                        {yearlyStats.yearly_avg.toFixed(1)} ft
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/60">Range</p>
                                    <p className="text-sm font-medium text-white">
                                        {(yearlyStats.yearly_high - yearlyStats.yearly_low).toFixed(1)} ft
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All-Time Records Section */}
                {(records?.allTimeHigh || records?.allTimeLow) && (
                    <div className="space-y-2 pt-3 border-t border-white/10">
                        <h3 className="text-xs font-medium text-yellow-100/60 mb-2 uppercase tracking-wider">
                            All-Time Records
                        </h3>
                        {/* All-Time High */}
                        {records.allTimeHigh && (
                            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-red-500/30 p-2 rounded-full">
                                            <TrendingUp className="w-5 h-5 text-red-200" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Highest Level</p>
                                            <p className="text-2xl font-bold text-white">
                                                {records.allTimeHigh.elevation.toFixed(1)} ft
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/60">Date</p>
                                        <p className="text-sm font-medium text-white">
                                            {format(parseISO(records.allTimeHigh.timestamp), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All-Time Low */}
                        {records.allTimeLow && (
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-500/30 p-2 rounded-full">
                                            <TrendingDown className="w-5 h-5 text-blue-200" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Lowest Level</p>
                                            <p className="text-2xl font-bold text-white">
                                                {records.allTimeLow.elevation.toFixed(1)} ft
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/60">Date</p>
                                        <p className="text-sm font-medium text-white">
                                            {format(parseISO(records.allTimeLow.timestamp), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
