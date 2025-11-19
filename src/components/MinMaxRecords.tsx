import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { AllTimeRecords } from '../services/DatabaseService';

interface MinMaxRecordsProps {
    records: AllTimeRecords | null;
    loading: boolean;
}

export function MinMaxRecords({ records, loading }: MinMaxRecordsProps) {
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
                All-Time Records
            </h2>

            <div className="space-y-3">
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
        </div>
    );
}
