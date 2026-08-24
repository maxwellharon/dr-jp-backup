import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
    const GA_SERVICE_ACCOUNT_B64 = process.env.GA_SERVICE_ACCOUNT_B64;

    if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_B64) {
        return res.status(500).json({ error: 'Missing GA_PROPERTY_ID or GA_SERVICE_ACCOUNT_B64 environment variable' });
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(Buffer.from(GA_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
    } catch (err) {
        return res.status(500).json({ error: `Failed to decode GA_SERVICE_ACCOUNT_B64: ${err.message}` });
    }

    try {
        const client = new BetaAnalyticsDataClient({
            credentials: {
                client_email: serviceAccount.client_email,
                private_key: serviceAccount.private_key,
            },
        });

        const [response] = await client.runRealtimeReport({
            property: `properties/${GA_PROPERTY_ID}`,
            metrics: [{ name: 'activeUsers' }],
        });

        const activeUsers = Math.round(Number(response.rows?.[0]?.metricValues?.[0]?.value || 0));

        return res.status(200).json({
            activeUsers,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('GA realtime error:', error);
        return res.status(500).json({ error: error.message, code: error.code || null });
    }
}