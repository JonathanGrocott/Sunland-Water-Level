export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(410).json({
        enabled: false,
        message: 'Upstream historical storage is disabled in DB-free mode.'
    });
}
