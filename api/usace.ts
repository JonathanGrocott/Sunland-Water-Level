import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Build the USACE API URL with query parameters
        const { timezone, backward, query } = req.query;

        if (!timezone || !backward || !query) {
            return res.status(400).json({ error: 'Missing required query parameters' });
        }

        const usaceUrl = new URL('https://www.nwd-wc.usace.army.mil/dd/common/web_service/webexec/getjson');
        usaceUrl.searchParams.set('timezone', timezone as string);
        usaceUrl.searchParams.set('backward', backward as string);
        usaceUrl.searchParams.set('query', query as string);

        // Fetch from USACE API
        const response = await fetch(usaceUrl.toString());

        if (!response.ok) {
            throw new Error(`USACE API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 minutes

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error proxying USACE API:', error);
        return res.status(500).json({
            error: 'Failed to fetch water level data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
