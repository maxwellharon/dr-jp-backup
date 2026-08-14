// api/ga-data.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Only GET supported' });
    }

    const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
    if (!GA_PROPERTY_ID) {
        console.error('❌ Missing GA_PROPERTY_ID');
        return res.status(500).json({ error: 'Missing GA_PROPERTY_ID environment variable' });
    }

    const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        console.error('❌ Missing GA_SERVICE_ACCOUNT_JSON');
        return res.status(500).json({ error: 'Missing GA_SERVICE_ACCOUNT_JSON environment variable' });
    }

    let credentials;
    try {
        credentials = JSON.parse(serviceAccountJson);
        console.log('✅ Service account parsed successfully');
    } catch (parseError) {
        console.error('❌ Failed to parse GA_SERVICE_ACCOUNT_JSON:', parseError.message);
        console.error('First 100 chars:', serviceAccountJson.substring(0, 100));
        return res.status(500).json({
            error: 'Invalid GA_SERVICE_ACCOUNT_JSON format',
            detail: parseError.message
        });
    }

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
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.details) {
            console.error('Error details:', error.details);
        }
        res.status(500).json({
            error: error.message,
            code: error.code || null,
            details: error.details || null
        });
    }
}