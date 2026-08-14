// api/ga-data.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
    const GA_CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL;
    const GA_PRIVATE_KEY = process.env.GA_PRIVATE_KEY;

    if (!GA_PROPERTY_ID) {
        console.error('❌ Missing GA_PROPERTY_ID');
        return res.status(500).json({ error: 'Missing GA_PROPERTY_ID environment variable' });
    }
    if (!GA_CLIENT_EMAIL) {
        console.error('❌ Missing GA_CLIENT_EMAIL');
        return res.status(500).json({ error: 'Missing GA_CLIENT_EMAIL environment variable' });
    }
    if (!GA_PRIVATE_KEY) {
        console.error('❌ Missing GA_PRIVATE_KEY');
        return res.status(500).json({ error: 'Missing GA_PRIVATE_KEY environment variable' });
    }

    // Ensure private key has proper newlines (Vercel may store with \n escapes)
    const privateKey = GA_PRIVATE_KEY.replace(/\\n/g, '\n');

    const credentials = {
        client_email: GA_CLIENT_EMAIL,
        private_key: privateKey,
    };

    console.log('✅ Credentials prepared for:', GA_CLIENT_EMAIL);

    try {
        const client = new BetaAnalyticsDataClient({ credentials });
        const property = `properties/${GA_PROPERTY_ID}`;
        const dateRanges = [{ startDate: '30daysAgo', endDate: 'today' }];

        console.log('📊 Fetching GA data for property:', GA_PROPERTY_ID);

        // Summary metrics
        const [summaryResponse] = await client.runReport({
            property,
            dateRanges,
            metrics: [
                { name: 'totalUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
                { name: 'engagementRate' },
            ],
        });

        const summary = {};
        if (summaryResponse.rows && summaryResponse.rows.length > 0) {
            summaryResponse.rows[0].metricValues.forEach((mv, i) => {
                const metricName = summaryResponse.metricHeaders[i].name;
                summary[metricName] = mv.value;
            });
        }

        // Time series
        const [timeSeriesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
            ],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });

        const timeSeries = (timeSeriesResponse.rows || []).map(row => ({
            date: row.dimensionValues[0].value,
            activeUsers: row.metricValues[0].value,
            newUsers: row.metricValues[1].value,
            sessions: row.metricValues[2].value,
            pageviews: row.metricValues[3].value,
        }));

        // Top pages
        const [pagesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews', desc: true } }],
            limit: 10,
        });
        const topPages = (pagesResponse.rows || []).map(row => ({
            pagePath: row.dimensionValues[0].value,
            pageviews: row.metricValues[0].value,
        }));

        // Top countries
        const [countriesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'country' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions', desc: true } }],
            limit: 10,
        });
        const topCountries = (countriesResponse.rows || []).map(row => ({
            country: row.dimensionValues[0].value,
            sessions: row.metricValues[0].value,
        }));

        // Traffic sources
        const [trafficResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions', desc: true } }],
            limit: 10,
        });
        const trafficSources = (trafficResponse.rows || []).map(row => ({
            source: row.dimensionValues[0].value,
            sessions: row.metricValues[0].value,
        }));

        // Device categories
        const [deviceResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }],
        });
        const deviceCategories = (deviceResponse.rows || []).map(row => ({
            device: row.dimensionValues[0].value,
            sessions: row.metricValues[0].value,
        }));

        console.log('✅ GA data fetched successfully');

        res.status(200).json({
            summary,
            timeSeries,
            topPages,
            topCountries,
            trafficSources,
            deviceCategories,
        });
    } catch (error) {
        console.error('❌ GA API error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({
            error: error.message,
            code: error.code || null,
            details: error.details || null,
        });
    }
}