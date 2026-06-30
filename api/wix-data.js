export default async function handler(req, res) {
    // Common headers for all Wix requests
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_API_KEY,
        'wix-site-id': process.env.WIX_SITE_ID
    };

    // Safely append account ID if it is provided in environment variables
    if (process.env.WIX_ACCOUNT_ID) {
        headers['wix-account-id'] = process.env.WIX_ACCOUNT_ID;
    }

    const { method } = req;
    const { collection, id, limit } = req.query;

    if (!collection) {
        return res.status(400).json({ error: 'Missing collection parameter' });
    }

    try {
        if (method === 'GET') {
            // Read limit parameter from URL, default to 100 if missing, parse to base-10 integer
            const parsedLimit = limit ? parseInt(limit, 10) : 100;

            // Query collection passing down proper pagination constraints
            const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection,
                    query: {
                        paging: {
                            limit: parsedLimit
                        }
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({ error: 'Wix API error response', details: data });
            }
            return res.status(200).json(data);
        }

        else if (method === 'POST') {
            // Single insert – body: { item: { ...fields } }
            const body = req.body;
            if (!body.item) {
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
            const data = await response.json();
            return res.status(response.ok ? 200 : response.status).json(data);
        }

        else if (method === 'DELETE') {
            // Delete by item id
            if (!id) {
                return res.status(400).json({ error: 'Missing id parameter' });
            }
            const response = await fetch(`https://www.wixapis.com/wix-data/v1/items/${id}`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({})
            });
            if (response.ok) {
                return res.status(200).json({ success: true });
            }
            const err = await response.json();
            return res.status(response.status).json(err);
        }

        else if (method === 'PATCH') {
            // Bulk insert – body: { items: [ ... ] }
            const body = req.body;
            if (!body.items || !Array.isArray(body.items)) {
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
            const data = await response.json();
            return res.status(response.ok ? 200 : response.status).json(data);
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Wix proxy execution crash:', error);
        return res.status(500).json({ error: error.message });
    }
}