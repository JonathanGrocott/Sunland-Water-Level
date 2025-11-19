import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { WaterLevelData } from '../services/WaterLevelService';

interface LevelChartProps {
    data: WaterLevelData[];
}

export const LevelChart: React.FC<LevelChartProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const minLevel = Math.min(...data.map(d => d.elevation));
    const maxLevel = Math.max(...data.map(d => d.elevation));
    // Add some padding to the domain
    const domainMin = Math.floor(minLevel - 0.5);
    const domainMax = Math.ceil(maxLevel + 0.5);

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
