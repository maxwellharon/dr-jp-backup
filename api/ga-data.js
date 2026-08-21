// api/ga-data.js
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
        const decoded = Buffer.from(GA_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to decode GA_SERVICE_ACCOUNT_B64: ' + err.message });
    }

    try {
        const client = new BetaAnalyticsDataClient({
            credentials: {
                client_email: serviceAccount.client_email,
                private_key: serviceAccount.private_key,
            },
        });

        const property = `properties/${GA_PROPERTY_ID}`;
        const dateRanges = [{ startDate: '90daysAgo', endDate: 'today' }];

        // ------------------------------------------------------------
        // 1. Summary metrics
        // ------------------------------------------------------------
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

        // ------------------------------------------------------------
        // 2. Time series (daily)
        // ------------------------------------------------------------
        const [timeSeriesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
            ],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });

        const timeSeries = (timeSeriesResponse.rows || []).map(row => ({
            date: row.dimensionValues[0].value,
            activeUsers: Number(row.metricValues[0].value),
            newUsers: Number(row.metricValues[1].value),
            sessions: Number(row.metricValues[2].value),
            screenPageViews: Number(row.metricValues[3].value),
            averageSessionDuration: Number(row.metricValues[4].value),
            bounceRate: Number(row.metricValues[5].value),
        }));

        // ------------------------------------------------------------
        // 3. Top pages (with engagement metrics)
        // ------------------------------------------------------------
        const [pagesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [
                { name: 'screenPageViews' },
                { name: 'sessions' },
                { name: 'userEngagementDuration' },   // total engagement time (seconds)
                { name: 'bounceRate' },
                { name: 'exits' },
            ],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10,
        });

        const topPages = (pagesResponse.rows || []).map(row => {
            const pageviews = Number(row.metricValues[0].value);
            const userEngagementDuration = Number(row.metricValues[2].value);
            const avgEngagementTime = pageviews > 0 ? Math.round(userEngagementDuration / pageviews) : 0;
            return {
                pagePath: row.dimensionValues[0].value,
                pageTitle: row.dimensionValues[1].value,
                screenPageViews: pageviews,
                sessions: Number(row.metricValues[1].value),
                averageEngagementTime: avgEngagementTime, // in seconds
                bounceRate: Number(row.metricValues[3].value),
                exits: Number(row.metricValues[4].value),
            };
        });

        // ------------------------------------------------------------
        // 4. Top countries
        // ------------------------------------------------------------
        const [countriesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'country' }],
            metrics: [
                { name: 'sessions' },
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'bounceRate' },
            ],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 20,
        });

        const topCountries = (countriesResponse.rows || []).map(row => ({
            country: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
            newUsers: Number(row.metricValues[2].value),
            bounceRate: Number(row.metricValues[3].value),
        }));

        // ------------------------------------------------------------
        // 5. Traffic sources
        // ------------------------------------------------------------
        const [trafficResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
        });

        const trafficSources = (trafficResponse.rows || []).map(row => ({
            source: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // ------------------------------------------------------------
        // 6. Device categories
        // ------------------------------------------------------------
        const [deviceResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        });

        const deviceCategories = (deviceResponse.rows || []).map(row => ({
            device: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // ------------------------------------------------------------
        // 7. User types (new vs returning)
        // ------------------------------------------------------------
        const [userTypesResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'newVsReturning' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        });

        const userTypes = (userTypesResponse.rows || []).map(row => ({
            newVsReturning: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // ------------------------------------------------------------
        // 8. Hourly engagement
        // ------------------------------------------------------------
        const [hourlyResponse] = await client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'hour' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            orderBys: [{ dimension: { dimensionName: 'hour' } }],
        });

        const hourly = (hourlyResponse.rows || []).map(row => ({
            hour: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        console.log('✅ GA data fetched successfully');

        res.status(200).json({
            summary,
            timeSeries,
            topPages,
            topCountries,
            trafficSources,
            deviceCategories,
            userTypes,
            hourly,
        });
    } catch (error) {
        console.error('❌ GA API error:', error);
        console.error('Error details:', JSON.stringify(error.details, null, 2));
        res.status(500).json({
            error: error.message,
            code: error.code || null,
            details: error.details || null,
        });
    }
}