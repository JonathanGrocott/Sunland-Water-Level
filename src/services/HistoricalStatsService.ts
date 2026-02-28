import type { WaterLevelData } from './WaterLevelService';
import type { MonthlyStats, YearlyStats } from '../types/HistoricalStats';

export function calculateMonthlyStats(data: WaterLevelData[]): MonthlyStats | null {
    if (!data.length) return null;

    const values = data.map(point => point.elevation);
    const monthly_low = Math.min(...values);
    const monthly_high = Math.max(...values);
    const monthly_avg = values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
        monthly_low,
        monthly_high,
        monthly_avg,
        monthly_range: monthly_high - monthly_low
    };
}

export function calculateYearlyStats(data: WaterLevelData[]): YearlyStats | null {
    if (!data.length) return null;

    let lowPoint = data[0];
    let highPoint = data[0];
    let sum = 0;

    for (const point of data) {
        if (point.elevation < lowPoint.elevation) lowPoint = point;
        if (point.elevation > highPoint.elevation) highPoint = point;
        sum += point.elevation;
    }

    return {
        yearly_low: lowPoint.elevation,
        yearly_high: highPoint.elevation,
        yearly_avg: sum / data.length,
        yearly_low_timestamp: lowPoint.timestamp,
        yearly_high_timestamp: highPoint.timestamp,
        yearly_low_date: lowPoint.timestamp.split('T')[0],
        yearly_high_date: highPoint.timestamp.split('T')[0]
    };
}
