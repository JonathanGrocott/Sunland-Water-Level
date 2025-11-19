import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests (for security, can be called by cron)
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch the last 24 hours of data from USACE API
        const usaceUrl = new URL('https://www.nwd-wc.usace.army.mil/dd/common/web_service/webexec/getjson');
        usaceUrl.searchParams.set('timezone', 'PST');
        usaceUrl.searchParams.set('backward', '1d');
        usaceUrl.searchParams.set('query', JSON.stringify(['WAN.Elev-Forebay.Inst.1Hour.0.CBT-REV']));

        const response = await fetch(usaceUrl.toString());
        if (!response.ok) {
            throw new Error(`USACE API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Parse the data
        const locationKey = Object.keys(data)[0];
        const locationData = data[locationKey];

        if (!locationData || !locationData.timeseries) {
            throw new Error('Invalid data structure from USACE API');
        }

        const timeSeriesId = 'WAN.Elev-Forebay.Inst.1Hour.0.CBT-REV';
        const timeSeriesData = locationData.timeseries[timeSeriesId];

        if (!timeSeriesData || !timeSeriesData.values) {
            throw new Error('No values found in USACE API response');
        }

        // Calculate daily statistics
        const values = timeSeriesData.values;

        if (values.length === 0) {
            return res.status(200).json({ message: 'No data available to store' });
        }

        // Find min, max, and calculate average
        let minElevation = Infinity;
        let maxElevation = -Infinity;
        let sum = 0;
        let minTimestamp = '';
        let maxTimestamp = '';

        values.forEach(([timestamp, elevation]: [string, number]) => {
            if (elevation < minElevation) {
                minElevation = elevation;
                minTimestamp = timestamp;
            }
            if (elevation > maxElevation) {
                maxElevation = elevation;
                maxTimestamp = timestamp;
            }
            sum += elevation;
        });

        const avgElevation = sum / values.length;

        // Get the date (PST timezone)
        const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
        const date = new Date(today).toISOString().split('T')[0]; // YYYY-MM-DD format

        // Store in Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: insertedData, error } = await supabase
            .from('daily_stats')
            .upsert({
                date,
                min_elevation: minElevation,
                max_elevation: maxElevation,
                avg_elevation: avgElevation,
                min_timestamp: minTimestamp,
                max_timestamp: maxTimestamp
            }, {
                onConflict: 'date'
            })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to store data: ${error.message}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Daily stats stored successfully',
            data: insertedData,
            stats: {
                date,
                min: minElevation,
                max: maxElevation,
                avg: avgElevation.toFixed(2),
                dataPoints: values.length
            }
        });
    } catch (error) {
        console.error('Error in store-reading:', error);
        return res.status(500).json({
            error: 'Failed to store water level data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
