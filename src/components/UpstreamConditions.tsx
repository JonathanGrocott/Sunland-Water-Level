import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock } from 'lucide-react';
import type { UpstreamData } from '../services/UpstreamFlowService';
import { upstreamFlowService } from '../services/UpstreamFlowService';

interface UpstreamConditionsProps {
    data: UpstreamData | null;
    loading: boolean;
}

export const UpstreamConditions: React.FC<UpstreamConditionsProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="w-full p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
                <div className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-12 bg-white/10 rounded"></div>
                        <div className="h-12 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-orange-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Upstream data unavailable</span>
                </div>
            </div>
        );
    }

    const prediction = upstreamFlowService.generatePrediction(data);
    const flowBalance = upstreamFlowService.calculateFlowBalance(data.wanapum);

    return (
        <div className="w-full p-5 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-yellow-100/80 text-sm font-medium mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upstream Flow Conditions
            </h3>

            {/* Prediction Summary */}
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-xs uppercase tracking-wide">6-Hour Outlook</span>
                    <PredictionBadge prediction={prediction.direction} />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                        {prediction.direction === 'rising' ? '↗' : prediction.direction === 'falling' ? '↘' : '→'}
                    </span>
                    <span className="text-lg text-white">
                        {prediction.direction === 'rising' ? 'Rising' :
                            prediction.direction === 'falling' ? 'Falling' : 'Stable'}
                    </span>
                    {Math.abs(prediction.estimatedChange6h) > 0.1 && (
                        <span className="text-sm text-white/60">
                            ({prediction.estimatedChange6h > 0 ? '+' : ''}
                            {prediction.estimatedChange6h.toFixed(1)} ft)
                        </span>
                    )}
                </div>
                {prediction.reasons.length > 0 && (
                    <div className="mt-2 text-xs text-white/50">
                        {prediction.reasons[0]}
                    </div>
                )}
            </div>

            {/* Flow Balance */}
            <div className="mb-4 p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <span>Wanapum Flow Balance</span>
                    <ConfidenceBadge confidence={prediction.confidence} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <div className="text-white/50 text-xs">Inflow</div>
                        <div className="text-white font-medium">
                            {data.wanapum.current?.inflow?.value
                                ? upstreamFlowService.formatFlow(data.wanapum.current.inflow.value)
                                : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/50 text-xs">Outflow</div>
                        <div className="text-white font-medium">
                            {data.wanapum.current?.outflow?.value
                                ? upstreamFlowService.formatFlow(data.wanapum.current.outflow.value)
                                : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/50 text-xs">Net</div>
                        <div className={`font-medium ${flowBalance.netFlow > 500 ? 'text-green-400' :
                            flowBalance.netFlow < -500 ? 'text-orange-400' :
                                'text-white/70'
                            }`}>
                            {flowBalance.netFlow > 0 ? '+' : ''}{upstreamFlowService.formatFlow(flowBalance.netFlow)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upstream Dams */}
            <div className="space-y-2">
                <DamCard
                    dam={data.chiefJoseph}
                    timeToImpact={upstreamFlowService.getTimeToImpact('CJO')}
                    isPrimary={true}
                />
                <DamCard
                    dam={data.grandCoulee}
                    timeToImpact={upstreamFlowService.getTimeToImpact('GCL')}
                />
            </div>
        </div>
    );
};

// Helper component for individual dam display
const DamCard: React.FC<{
    dam: any;
    timeToImpact: string;
    isPrimary?: boolean;
}> = ({ dam, timeToImpact, isPrimary = false }) => {
    if (!dam.available) {
        return (
            <div className="p-3 rounded-lg bg-white/5 opacity-50">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{dam.name}</span>
                    <span className="text-xs text-white/40">No data</span>
                </div>
            </div>
        );
    }

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case 'increasing':
                return <TrendingUp className="w-3 h-3 text-orange-400" />;
            case 'decreasing':
                return <TrendingDown className="w-3 h-3 text-blue-400" />;
            default:
                return <Minus className="w-3 h-3 text-white/40" />;
        }
    };

    const getTrendColor = (direction: string) => {
        switch (direction) {
            case 'increasing':
                return 'text-orange-400';
            case 'decreasing':
                return 'text-blue-400';
            default:
                return 'text-white/60';
        }
    };

    return (
        <div className={`p-3 rounded-lg ${isPrimary ? 'bg-white/10 border border-white/20' : 'bg-white/5'}`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{dam.name}</span>
                    {isPrimary && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300">
                            Key
                        </span>
                    )}
                </div>
                <span className="text-xs text-white/40">{timeToImpact}</span>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-white/50">Outflow</div>
                    <div className="text-white font-medium">
                        {dam.current?.outflow?.value
                            ? upstreamFlowService.formatFlow(dam.current.outflow.value)
                            : 'N/A'}
                    </div>
                </div>

                {dam.trend && (
                    <div className="flex items-center gap-1">
                        {getTrendIcon(dam.trend.direction)}
                        <span className={`text-xs ${getTrendColor(dam.trend.direction)}`}>
                            {dam.trend.direction !== 'stable' && (
                                <>
                                    {dam.trend.percentChange > 0 ? '+' : ''}
                                    {dam.trend.percentChange.toFixed(1)}%
                                </>
                            )}
                            {dam.trend.direction === 'stable' && 'Stable'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const PredictionBadge: React.FC<{ prediction: 'rising' | 'falling' | 'stable' }> = ({ prediction }) => {
    const colors = {
        rising: 'bg-green-400/20 text-green-300',
        falling: 'bg-orange-400/20 text-orange-300',
        stable: 'bg-white/10 text-white/70'
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${colors[prediction]}`}>
            {prediction.charAt(0).toUpperCase() + prediction.slice(1)}
        </span>
    );
};

const ConfidenceBadge: React.FC<{ confidence: 'high' | 'medium' | 'low' }> = ({ confidence }) => {
    const colors = {
        high: 'text-green-400',
        medium: 'text-yellow-400',
        low: 'text-orange-400'
    };

    return (
        <span className={`text-xs ${colors[confidence]}`}>
            {confidence} confidence
        </span>
    );
};
