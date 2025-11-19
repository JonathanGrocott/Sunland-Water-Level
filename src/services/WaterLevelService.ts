import { format, parseISO } from 'date-fns';
import axios from 'axios';

export interface WaterLevelData {
    timestamp: string;
    elevation: number;
}

export interface CurrentCondition {
    currentLevel: number;
    trend: 'rising' | 'falling' | 'stable';
    rateOfChange: number; // feet per hour
    lastUpdated: string;
}

export interface IWaterLevelService {
    getHistory(hours?: number): Promise<WaterLevelData[]>;
    getCurrentCondition(): Promise<CurrentCondition>;
}

// USACE API Response Types
interface UsaceResponse {
    [locationId: string]: {
        timeseries: {
            [timeseriesId: string]: {
                values: [string, number, number][]; // [timestamp, value, quality]
            };
        };
    };
}

class USACEWaterLevelService implements IWaterLevelService {
    private readonly API_URL = '/api/usace';
    private readonly TIMESERIES_ID = 'WAN.Elev-Forebay.Inst.1Hour.0.CBT-REV';

    private async fetchData(days: number = 7): Promise<WaterLevelData[]> {
        try {
            const params = new URLSearchParams({
                timezone: 'PST',
                backward: `${days}d`,
                query: JSON.stringify([this.TIMESERIES_ID])
            });

            const response = await axios.get<UsaceResponse>(`${this.API_URL}?${params.toString()}`);

            // The API returns an object where the key is the location ID (e.g., "WAN")
            const locationKey = Object.keys(response.data)[0];
            const locationData = response.data[locationKey];

            if (!locationData || !locationData.timeseries) {
                throw new Error('Invalid data structure: missing timeseries');
            }

            const timeSeriesData = locationData.timeseries[this.TIMESERIES_ID];
            if (!timeSeriesData || !timeSeriesData.values) {
                throw new Error('Invalid data structure: missing values');
            }

            return timeSeriesData.values
                .map(([timestamp, value]) => ({
                    timestamp: timestamp, // ISO format from API
                    elevation: value
                }))
                .filter(item => item.elevation !== null && !isNaN(item.elevation))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        } catch (error) {
            console.error('Error fetching water level data:', error);
            throw error;
        }
    }

    async getHistory(hours: number = 24): Promise<WaterLevelData[]> {
        const allData = await this.fetchData(2); // Fetch 2 days to be safe
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        return allData.filter(d => new Date(d.timestamp) > cutoff);
    }

    async getCurrentCondition(): Promise<CurrentCondition> {
        const history = await this.fetchData(1); // Fetch last 24h is enough for current condition

        if (history.length === 0) {
            throw new Error('No data available');
        }

        const current = history[history.length - 1];
        // Find the data point from ~1 hour ago to calculate rate
        const oneHourAgo = new Date(new Date(current.timestamp).getTime() - 60 * 60 * 1000);

        // Find closest point to 1 hour ago
        const previous = history.reduce((prev, curr) => {
            const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - oneHourAgo.getTime());
            const currDiff = Math.abs(new Date(curr.timestamp).getTime() - oneHourAgo.getTime());
            return currDiff < prevDiff ? curr : prev;
        });

        const diff = current.elevation - previous.elevation;
        // Calculate rate per hour (diff / time_diff_in_hours)
        const timeDiffHours = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / (1000 * 60 * 60);
        const rateOfChange = timeDiffHours > 0 ? diff / timeDiffHours : 0;

        let trend: 'rising' | 'falling' | 'stable' = 'stable';
        if (rateOfChange > 0.05) trend = 'rising';
        if (rateOfChange < -0.05) trend = 'falling';

        return {
            currentLevel: current.elevation,
            trend,
            rateOfChange: Number(Math.abs(rateOfChange).toFixed(2)),
            lastUpdated: format(parseISO(current.timestamp), 'MMM d, h:mm a'),
        };
    }
}

export const waterLevelService = new USACEWaterLevelService();
