export default async function handler(req, res) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.WIX_API_KEY,
        'wix-site-id': process.env.WIX_SITE_ID
    };

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
            const parsedLimit = limit ? parseInt(limit, 10) : 100;

            const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection,
                    query: { paging: { limit: parsedLimit } }
                })
            });

            const bodyText = await response.text();

            // Send back the exact status code and raw response from Wix without parsing JSON safely
            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else if (method === 'POST') {
            const body = req.body;
            if (!body.item) return res.status(400).json({ error: 'Missing item in body' });

            const response = await fetch('https://www.wixapis.com/wix-data/v1/items', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    dataCollectionId: collection,
                    dataItem: body.item
                })
            });
            const bodyText = await response.text();
            res.status(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.send(bodyText);
        }

        else if (method === 'DELETE') {
            if (!id) return res.status(400).json({ error: 'Missing id parameter' });
            const response = await fetch(`https://www.wixapis.com/wix-data/v1/items/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok) return res.status(200).json({ success: true });
            const bodyText = await response.text();
            res.status(response.status);
            return res.send(bodyText);
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Wix proxy execution crash:', error);
        return res.status(500).json({ error: 'Server internal error', message: error.message });
    }
}