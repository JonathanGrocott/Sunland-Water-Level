import { createClient } from '@supabase/supabase-js';

// Cron job to store upstream flow data daily
export default async function handler(req, res) {
    // Only allow POST requests (for security, can be called by cron)
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }

        // Define the timeseries we want to fetch
        const timeseries = [
            'CJO.Flow-Out.Ave.1Hour.1Hour.CBT-REV',
            'CJO.Flow-In.Ave.1Hour.1Hour.CBT-REV',
            'GCL.Flow-Out.Ave.1Hour.1Hour.CBT-REV',
            'RIS.Flow-Out.Ave.1Hour.1Hour.CBT-REV',
            'WAN.Flow-Out.Ave.1Hour.1Hour.CBT-REV',
            'WAN.Flow-In.Ave.1Hour.1Hour.CBT-REV',
        ];

        // Fetch last 2 hours of data
        const usaceUrl = new URL('https://www.nwd-wc.usace.army.mil/dd/common/web_service/webexec/getjson');
        usaceUrl.searchParams.set('timezone', 'PST');
        usaceUrl.searchParams.set('backward', '2h');
        usaceUrl.searchParams.set('query', JSON.stringify(timeseries));

        const response = await fetch(usaceUrl.toString());
        if (!response.ok) {
            throw new Error(`USACE API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        const recordsToInsert = [];

        // Process each dam's data
        const dams = [
            { code: 'CJO', name: 'CHIEF_JOSEPH' },
            { code: 'GCL', name: 'GRAND_COULEE' },
            { code: 'RIS', name: 'ROCK_ISLAND' },
            { code: 'WAN', name: 'WANAPUM' }
        ];

        for (const dam of dams) {
            const locationData = data[dam.code];

            if (!locationData || !locationData.timeseries) {
                console.warn(`No data available for ${dam.name}`);
                continue;
            }

            // Get outflow data
            const outflowKey = `${dam.code}.Flow-Out.Ave.1Hour.1Hour.CBT-REV`;
            const outflowData = locationData.timeseries[outflowKey];

            // Get inflow data (may not exist for all dams)
            const inflowKey = `${dam.code}.Flow-In.Ave.1Hour.1Hour.CBT-REV`;
            const inflowData = locationData.timeseries[inflowKey];

            if (outflowData && outflowData.values && outflowData.values.length > 0) {
                // Get the most recent reading
                const latest = outflowData.values[outflowData.values.length - 1];
                const [timestamp, outflowValue] = latest;

                // Get corresponding inflow if available
                let inflowValue = null;
                if (inflowData && inflowData.values && inflowData.values.length > 0) {
                    const latestInflow = inflowData.values.find(
                        ([ts]) => ts === timestamp
                    );
                    if (latestInflow) {
                        inflowValue = latestInflow[1];
                    }
                }

                recordsToInsert.push({
                    dam_name: dam.name,
                    timestamp: timestamp,
                    outflow_cfs: outflowValue,
                    inflow_cfs: inflowValue
                });
            }
        }

        if (recordsToInsert.length === 0) {
            return res.status(200).json({
                message: 'No new data to store',
                count: 0
            });
        }

        // Insert records (upsert to avoid duplicates)
        const { data: insertedData, error } = await supabase
            .from('upstream_flows')
            .upsert(recordsToInsert, {
                onConflict: 'dam_name,timestamp',
                ignoreDuplicates: true
            })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to store data: ${error.message}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Upstream flow data stored successfully',
            recordsInserted: insertedData?.length || 0,
            records: recordsToInsert
        });

    } catch (error) {
        console.error('Error in store-upstream-flows:', error);
        return res.status(500).json({
            error: 'Failed to store upstream flow data',
            message: error.message || 'Unknown error'
        });
    }
}
