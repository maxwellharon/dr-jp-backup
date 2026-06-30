// api/wix-data.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    const { collection } = req.query;
    if (!collection) return res.status(400).json({ error: 'Missing collection' });

    if (!process.env.WIX_API_KEY || !process.env.WIX_SITE_ID) {
        return res.status(500).json({ error: 'Server config error – WIX_API_KEY or WIX_SITE_ID missing' });
    }

    try {
        const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.WIX_API_KEY,
                'wix-site-id': process.env.WIX_SITE_ID
            },
            body: JSON.stringify({ dataCollectionId: collection })
        });

        const text = await response.text();
        res.status(response.status).send(text);
    } catch (error) {
        console.error('🔥 Wix proxy crash:', error.message);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
    }
}