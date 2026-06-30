// api/wix-data.js
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { method, query, body } = req;
    const { collection, id } = query;

    // ---- SAFETY LOG: mask API key ----
    const key = process.env.WIX_API_KEY || '';
    const maskedKey = key ? `${key.substring(0, 12)}...` : 'MISSING';
    console.log(`🔑 API Key present: ${key ? 'YES' : 'NO'} (${maskedKey})`);
    console.log(`🔑 Account ID: ${process.env.WIX_ACCOUNT_ID || 'MISSING'}`);
    console.log(`🔑 Site ID: ${process.env.WIX_SITE_ID || 'MISSING'}`);

    if (!collection) {
        console.log('❌ Missing collection');
        return res.status(400).json({ error: 'Missing collection parameter' });
    }

    console.log(`📡 ${method} /${collection}${id ? '/' + id : ''}`);

    // Build headers only if env vars exist
    const wixHeaders = {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_API_KEY || '',
        'wix-site-id': process.env.WIX_SITE_ID || ''
    };
    if (process.env.WIX_ACCOUNT_ID) {
        wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID;
    }

    // Detect if any required header is missing
    if (!process.env.WIX_API_KEY || !process.env.WIX_SITE_ID) {
        console.error('❌ Missing Wix credentials in environment');
        return res.status(500).json({ error: 'Server configuration error: Wix API credentials missing' });
    }

    try {
        if (method === 'GET') {
            const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                method: 'POST',
                headers: wixHeaders,
                body: JSON.stringify({ dataCollectionId: collection })
            });
            const text = await response.text();
            console.log(`✅ Wix query ${collection} → ${response.status}`);
            res.status(response.status).send(text);
        }
        else if (method === 'POST') {
            if (!body || !body.item) {
                return res.status(400).json({ error: 'Missing item in body' });
            }
            const response = await fetch('https://www.wixapis.com/wix-data/v1/items', {
                method: 'POST',
                headers: wixHeaders,
                body: JSON.stringify({ dataCollectionId: collection, dataItem: body.item })
            });
            const text = await response.text();
            console.log(`✅ Wix insert ${collection} → ${response.status}`);
            res.status(response.status).send(text);
        }
        else if (method === 'DELETE') {
            if (!id) return res.status(400).json({ error: 'Missing id' });
            const response = await fetch(`https://www.wixapis.com/wix-data/v1/items/${id}`, {
                method: 'DELETE',
                headers: wixHeaders
            });
            console.log(`✅ Wix delete ${id} → ${response.status}`);
            if (response.ok) return res.status(200).json({ success: true });
            const text = await response.text();
            res.status(response.status).send(text);
        }
        else if (method === 'PATCH') {
            if (!body || !Array.isArray(body.items)) {
                return res.status(400).json({ error: 'Missing items array' });
            }
            const response = await fetch('https://www.wixapis.com/wix-data/v1/bulk/items/insert', {
                method: 'POST',
                headers: wixHeaders,
                body: JSON.stringify({ dataCollectionId: collection, dataItems: body.items })
            });
            const text = await response.text();
            console.log(`✅ Wix bulk insert ${collection} → ${response.status}`);
            res.status(response.status).send(text);
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('🔥 Wix proxy crash:', error.message);
        console.error(error.stack);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}