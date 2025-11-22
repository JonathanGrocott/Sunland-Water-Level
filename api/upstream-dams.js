// API endpoint to fetch current upstream dam data from USACE
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Define the timeseries we want to fetch
        // Using USACE Dataquery API structure
        const timeseries = [
            // Rocky Reach Dam (closest upstream)
            'RRH.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow
            'RRH.Flow-In.Ave.1Hour.1Hour.CBT-REV',  // Inflow

            // Wells Dam (next upstream)
            'WEL.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow
            'WEL.Flow-In.Ave.1Hour.1Hour.CBT-REV',  // Inflow

            // Chief Joseph Dam (further upstream)
            'CJO.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow
            'CJO.Flow-In.Ave.1Hour.1Hour.CBT-REV',  // Inflow

            // Grand Coulee Dam (furthest upstream)
            'GCL.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow

            // Rock Island Dam (directly upstream of Wanapum)
            'RIS.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow
            'RIS.Flow-In.Ave.1Hour.1Hour.CBT-REV',  // Inflow

            // Wanapum Dam (for comparison)
            'WAN.Flow-Out.Ave.1Hour.1Hour.CBT-REV', // Outflow
            'WAN.Flow-In.Ave.1Hour.1Hour.CBT-REV',  // Inflow
        ];

        // Fetch last 7 days of data (to calculate trends)
        const usaceUrl = new URL('https://www.nwd-wc.usace.army.mil/dd/common/web_service/webexec/getjson');
        usaceUrl.searchParams.set('timezone', 'PST');
        usaceUrl.searchParams.set('backward', '7d');
        usaceUrl.searchParams.set('query', JSON.stringify(timeseries));

        const response = await fetch(usaceUrl.toString());

        if (!response.ok) {
            throw new Error(`USACE API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Parse and structure the data
        const result = {
            rockyReach: extractDamData(data, 'RRH', 'Rocky Reach'),
            wells: extractDamData(data, 'WEL', 'Wells'),
            chiefJoseph: extractDamData(data, 'CJO', 'Chief Joseph'),
            grandCoulee: extractDamData(data, 'GCL', 'Grand Coulee'),
            rockIsland: extractDamData(data, 'RIS', 'Rock Island'),
            wanapum: extractDamData(data, 'WAN', 'Wanapum'),
            fetchedAt: new Date().toISOString()
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching upstream dam data:', error);
        return res.status(500).json({
            error: 'Failed to fetch upstream dam data',
            message: error.message || 'Unknown error'
        });
    }
}

/**
 * Extract dam data from USACE API response
 * @param {Object} data - Full API response
 * @param {string} locationCode - Dam location code (e.g., 'CJO', 'GCL')
 * @param {string} damName - Human-readable dam name
 * @returns {Object} Structured dam data
 */
function extractDamData(data, locationCode, damName) {
    const locationData = data[locationCode];

    if (!locationData || !locationData.timeseries) {
        return {
            name: damName,
            code: locationCode,
            available: false,
            error: 'No data available'
        };
    }

    try {
        // Get outflow data
        const outflowKey = `${locationCode}.Flow-Out.Ave.1Hour.1Hour.CBT-REV`;
        const outflowData = locationData.timeseries[outflowKey];

        // Get inflow data (may not exist for all dams)
        const inflowKey = `${locationCode}.Flow-In.Ave.1Hour.1Hour.CBT-REV`;
        const inflowData = locationData.timeseries[inflowKey];

        // Extract latest values
        const outflowValues = outflowData?.values || [];
        const inflowValues = inflowData?.values || [];

        // Get current (most recent) reading
        const currentOutflow = outflowValues.length > 0
            ? outflowValues[outflowValues.length - 1]
            : null;

        const currentInflow = inflowValues.length > 0
            ? inflowValues[inflowValues.length - 1]
            : null;

        // Calculate 6-hour trend
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const oldOutflow = outflowValues.find(([timestamp]) =>
            new Date(timestamp) <= sixHoursAgo
        );

        let trend = 0;
        let trendDirection = 'stable';
        if (currentOutflow && oldOutflow) {
            const oldValue = oldOutflow[1];
            const newValue = currentOutflow[1];
            trend = ((newValue - oldValue) / oldValue) * 100; // Percentage change

            if (trend > 5) trendDirection = 'increasing';
            else if (trend < -5) trendDirection = 'decreasing';
        }

        return {
            name: damName,
            code: locationCode,
            available: true,
            current: {
                outflow: currentOutflow ? {
                    value: currentOutflow[1],
                    timestamp: currentOutflow[0],
                    unit: 'cfs'
                } : null,
                inflow: currentInflow ? {
                    value: currentInflow[1],
                    timestamp: currentInflow[0],
                    unit: 'cfs'
                } : null
            },
            trend: {
                percentChange: trend,
                direction: trendDirection
            },
            history: {
                outflow: outflowValues.slice(-48), // Last 48 hours
                inflow: inflowValues.slice(-48)
            }
        };
    } catch (error) {
        return {
            name: damName,
            code: locationCode,
            available: false,
            error: error.message
        };
    }
}
