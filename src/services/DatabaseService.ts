import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DailyStats {
    id: number;
    date: string;
    min_elevation: number;
    max_elevation: number;
    avg_elevation: number;
    min_timestamp: string;
    max_timestamp: string;
    created_at: string;
}

export interface AllTimeRecords {
    allTimeHigh: {
        elevation: number;
        date: string;
        timestamp: string;
    } | null;
    allTimeLow: {
        elevation: number;
        date: string;
        timestamp: string;
    } | null;
}

class DatabaseService {
    private supabase: SupabaseClient | null = null;

    private getClient(): SupabaseClient {
        if (this.supabase) return this.supabase;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
        return this.supabase;
    }

    async getAllTimeRecords(): Promise<AllTimeRecords> {
        try {
            const client = this.getClient();

            // Get all-time high
            const { data: highData, error: highError } = await client
                .from('daily_stats')
                .select('max_elevation, date, max_timestamp')
                .order('max_elevation', { ascending: false })
                .limit(1)
                .single();

            if (highError && highError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching all-time high:', highError);
            }

            // Get all-time low
            const { data: lowData, error: lowError } = await client
                .from('daily_stats')
                .select('min_elevation, date, min_timestamp')
                .order('min_elevation', { ascending: true })
                .limit(1)
                .single();

            if (lowError && lowError.code !== 'PGRST116') {
                console.error('Error fetching all-time low:', lowError);
            }

            return {
                allTimeHigh: highData ? {
                    elevation: highData.max_elevation,
                    date: highData.date,
                    timestamp: highData.max_timestamp
                } : null,
                allTimeLow: lowData ? {
                    elevation: lowData.min_elevation,
                    date: lowData.date,
                    timestamp: lowData.min_timestamp
                } : null
            };
        } catch (error) {
            console.error('Error fetching all-time records:', error);
            return { allTimeHigh: null, allTimeLow: null };
        }
    }

    async getRecentDailyStats(days: number = 7): Promise<DailyStats[]> {
        try {
            const client = this.getClient();

            const { data, error } = await client
                .from('daily_stats')
                .select('*')
                .order('date', { ascending: false })
                .limit(days);

            if (error) {
                console.error('Error fetching daily stats:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching daily stats:', error);
            return [];
        }
    }
}

export const databaseService = new DatabaseService();
