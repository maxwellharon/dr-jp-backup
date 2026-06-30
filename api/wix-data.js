// api/wix-data.js
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_API_KEY,
        'wix-site-id': process.env.WIX_SITE_ID
    };

    if (process.env.WIX_ACCOUNT_ID) {
        headers['wix-account-id'] = process.env.WIX_ACCOUNT_ID;
    }

    const { method } = req;
    const { collection, id } = req.query;

    // Debug log
    console.log(`📡 Wix API Request: ${method} /${collection}${id ? '/' + id : ''}`);

    if (!collection) {
        return res.status(400).json({ error: 'Missing collection parameter' });
    }

    try {
        if (method === 'GET') {
            const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection
                })
            });

            const bodyText = await response.text();
            console.log(`✅ Wix Response: ${response.status} for ${collection}`);

            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else if (method === 'POST') {
            const body = req.body;
            if (!body || !body.item) {
                return res.status(400).json({ error: 'Missing item in body' });
            }

            const response = await fetch('https://www.wixapis.com/wix-data/v1/items', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection,
                    dataItem: body.item
                })
            });

            const bodyText = await response.text();
            console.log(`✅ Wix Insert: ${response.status}`);

            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else if (method === 'DELETE') {
            if (!id) {
                return res.status(400).json({ error: 'Missing id parameter' });
            }

            const response = await fetch(`https://www.wixapis.com/wix-data/v1/items/${id}`, {
                method: 'DELETE',
                headers
            });

            console.log(`✅ Wix Delete: ${response.status} for ${id}`);

            if (response.ok) {
                return res.status(200).json({ success: true });
            }

            const bodyText = await response.text();
            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else if (method === 'PATCH') {
            const body = req.body;
            if (!body || !body.items || !Array.isArray(body.items)) {
                return res.status(400).json({ error: 'Missing items array' });
            }

            const response = await fetch('https://www.wixapis.com/wix-data/v1/bulk/items/insert', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection,
                    dataItems: body.items
                })
            });

            const bodyText = await response.text();
            console.log(`✅ Wix Bulk Insert: ${response.status}`);

            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('❌ Wix proxy crash:', error.message);
        return res.status(500).json({
            error: 'Server internal error',
            message: error.message
        });
    }
}