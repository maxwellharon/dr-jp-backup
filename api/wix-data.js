// api/wix-data.js
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    const { collection, all } = req.query;
    if (!collection) return res.status(400).json({ error: 'Missing collection' });

    if (!process.env.WIX_API_KEY || !process.env.WIX_SITE_ID) {
        return res.status(500).json({ error: 'Server config error – credentials missing' });
    }

    try {
        let allItems = [];
        let nextCursor = null;
        let hasNext = true;

        while (hasNext) {
            const body = { dataCollectionId: collection };
            if (nextCursor) {
                body.query = { cursor: nextCursor };
            }

            const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.WIX_API_KEY,
                    'wix-site-id': process.env.WIX_SITE_ID
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                return res.status(response.status).send(errorText);
            }

            const data = await response.json();
            const items = data.items || data.dataItems || [];
            allItems.push(...items);

            if (all !== 'true') {
                hasNext = false;
            } else {
                hasNext = data.pagingMetadata?.hasNext || false;
                nextCursor = data.pagingMetadata?.cursors?.next || null;
            }
        }

        res.status(200).json({
            items: allItems,
            totalCount: allItems.length,
            totalResults: allItems.length
        });
    } catch (error) {
        console.error('🔥 Wix proxy crash:', error.message);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
    }
}