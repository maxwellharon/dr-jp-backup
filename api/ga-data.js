import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
    if (!GA_PROPERTY_ID) {
        return res.status(500).json({ error: 'Missing GA_PROPERTY_ID environment variable' });
    }

    let serviceAccount;
    try {
        const filePath = path.join(process.cwd(), 'ga-service-account.json');
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('✅ Service account loaded from file');
    } catch (err) {
        const envJson = process.env.GA_SERVICE_ACCOUNT_JSON;
        if (envJson) {
            try {
                serviceAccount = JSON.parse(envJson);
                console.log('✅ Service account loaded from env var');
            } catch (parseErr) {
                console.error('❌ Failed to parse GA_SERVICE_ACCOUNT_JSON:', parseErr.message);
                return res.status(500).json({ error: 'Invalid service account JSON' });
            }
        } else {
            console.error('❌ No service account credentials found');
            return res.status(500).json({ error: 'Service account credentials missing' });
        }
    }

    try {
        const client = new BetaAnalyticsDataClient({
            credentials: {
                client_email: serviceAccount.client_email,
                private_key: serviceAccount.private_key,
            },
        });

        const property = `properties/${GA_PROPERTY_ID}`;
        const dateRanges = [{ startDate: '30daysAgo', endDate: 'today' }];

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
                summary[summaryResponse.metricHeaders[i].name] = mv.value;
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
        res.status(500).json({
            error: error.message,
            code: error.code || null,
            details: error.details || null,
        });
    }
}