// api/wix-data.js
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET is supported' });

    const { collection } = req.query;
    if (!collection) return res.status(400).json({ error: 'Missing collection' });

    // --- Log what we have (mask the key) ---
    const apiKey = process.env.WIX_API_KEY || '';
    console.log(`🔑 API key: ${apiKey ? 'present' : 'MISSING'}`);
    console.log(`🔑 Account ID: ${process.env.WIX_ACCOUNT_ID || 'MISSING'}`);
    console.log(`🔑 Site ID: ${process.env.WIX_SITE_ID || 'MISSING'}`);

    // If any required env var is missing, stop
    if (!apiKey || !process.env.WIX_SITE_ID || !process.env.WIX_ACCOUNT_ID) {
        console.error('❌ Missing Wix credentials');
        return res.status(500).json({ error: 'Server config error – credentials missing' });
    }

    // Build headers safely
    const wixHeaders = {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'wix-site-id': process.env.WIX_SITE_ID,
        'wix-account-id': process.env.WIX_ACCOUNT_ID
    };

    try {
        console.log(`📡 Querying Wix collection: ${collection}`);
        const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
            method: 'POST',
            headers: wixHeaders,
            body: JSON.stringify({ dataCollectionId: collection })
        });

        const text = await response.text();
        console.log(`✅ Wix response status: ${response.status}`);
        res.status(response.status).send(text);
    } catch (error) {
        console.error('🔥 Wix proxy crash:', error.message);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
    }
}