import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import type { WaterLevelData } from '../services/WaterLevelService';
import type { YearlyStats, MonthlyStats } from '../services/DatabaseService';

interface LevelChartProps {
    data: WaterLevelData[];
    yearlyStats?: YearlyStats | null;
    monthlyStats?: MonthlyStats | null;
}

export const LevelChart: React.FC<LevelChartProps> = ({ data, yearlyStats, monthlyStats }) => {
    if (!data || data.length === 0) return null;

    const minLevel = Math.min(...data.map(d => d.elevation));
    const maxLevel = Math.max(...data.map(d => d.elevation));
    
    // Use monthly stats for better bounds if available, otherwise use yearly stats
    let domainMin = Math.floor(minLevel - 0.5);
    let domainMax = Math.ceil(maxLevel + 0.5);
    
    if (monthlyStats) {
        // Use monthly range with some padding
        domainMin = Math.min(domainMin, Math.floor(monthlyStats.monthly_low - 0.5));
        domainMax = Math.max(domainMax, Math.ceil(monthlyStats.monthly_high + 0.5));
    } else if (yearlyStats) {
        // Fallback to yearly stats
        domainMin = Math.min(domainMin, Math.floor(yearlyStats.yearly_low - 0.5));
        domainMax = Math.max(domainMax, Math.ceil(yearlyStats.yearly_high + 0.5));
    }

    return (
        <div className="w-full h-64 mt-8 p-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-yellow-100/80 text-sm font-medium mb-4 ml-2">24 Hour Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(str) => format(new Date(str), 'h a')}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fontSize: 10 }}
                        interval={4}
                    />
                    <YAxis
                        domain={[domainMin, domainMax]}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fontSize: 10 }}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                        labelFormatter={(label) => format(new Date(label), 'MMM d, h:mm a')}
                        formatter={(value: number) => [`${value.toFixed(2)} ft`, 'Elevation']}
                    />
                    
                    {/* Yearly high reference line */}
                    {yearlyStats && (
                        <ReferenceLine 
                            y={yearlyStats.yearly_high} 
                            stroke="#ef4444" 
                            strokeDasharray="3 3"
                            strokeOpacity={0.6}
                            label={{ 
                                value: 'Year High', 
                                position: 'insideTopRight',
                                fill: '#ef4444',
                                fontSize: 10,
                                opacity: 0.8
                            }}
                        />
                    )}
                    
                    {/* Yearly low reference line */}
                    {yearlyStats && (
                        <ReferenceLine 
                            y={yearlyStats.yearly_low} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3"
                            strokeOpacity={0.6}
                            label={{ 
                                value: 'Year Low', 
                                position: 'insideBottomRight',
                                fill: '#3b82f6',
                                fontSize: 10,
                                opacity: 0.8
                            }}
                        />
                    )}
                    
                    {/* Yearly average reference line */}
                    {yearlyStats && (
                        <ReferenceLine 
                            y={yearlyStats.yearly_avg} 
                            stroke="#10b981" 
                            strokeDasharray="5 5"
                            strokeOpacity={0.5}
                            label={{ 
                                value: 'Year Avg', 
                                position: 'insideRight',
                                fill: '#10b981',
                                fontSize: 10,
                                opacity: 0.8
                            }}
                        />
                    )}
                    
                    <Area
                        type="monotone"
                        dataKey="elevation"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLevel)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
