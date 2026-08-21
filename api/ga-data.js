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

        // Helper to run a report and catch errors with context
        const runReportWithContext = async (name, request) => {
            try {
                const [response] = await client.runReport(request);
                return response;
            } catch (err) {
                console.error(`❌ Report [${name}] failed:`, err);
                throw new Error(`[${name}] ${err.message}`);
            }
        };

        // Define all report requests
        const reportRequests = {
            summary: {
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
            },
            timeSeries: {
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
            },
            topPages: {
                property,
                dateRanges,
                dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
                metrics: [
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                    { name: 'userEngagementDuration' },
                    { name: 'bounceRate' },
                ],
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
                limit: 10,
            },
            topCountries: {
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
            },
            trafficSources: {
                property,
                dateRanges,
                dimensions: [{ name: 'sessionSource' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 10,
            },
            deviceCategories: {
                property,
                dateRanges,
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            },
            userTypes: {
                property,
                dateRanges,
                dimensions: [{ name: 'newVsReturning' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            },
            hourly: {
                property,
                dateRanges,
                dimensions: [{ name: 'hour' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                orderBys: [{ dimension: { dimensionName: 'hour' } }],
            },
        };

        // Run all reports in parallel
        const [summaryResponse, timeSeriesResponse, pagesResponse, countriesResponse,
            trafficResponse, deviceResponse, userTypesResponse, hourlyResponse] = await Promise.all([
                runReportWithContext('summary', reportRequests.summary),
                runReportWithContext('timeSeries', reportRequests.timeSeries),
                runReportWithContext('topPages', reportRequests.topPages),
                runReportWithContext('topCountries', reportRequests.topCountries),
                runReportWithContext('trafficSources', reportRequests.trafficSources),
                runReportWithContext('deviceCategories', reportRequests.deviceCategories),
                runReportWithContext('userTypes', reportRequests.userTypes),
                runReportWithContext('hourly', reportRequests.hourly),
            ]);

        // Parse summary
        const summary = {};
        if (summaryResponse.rows && summaryResponse.rows.length > 0) {
            summaryResponse.rows[0].metricValues.forEach((mv, i) => {
                const metricName = summaryResponse.metricHeaders[i].name;
                summary[metricName] = mv.value;
            });
        }

        // Parse time series
        const timeSeries = (timeSeriesResponse.rows || []).map(row => ({
            date: row.dimensionValues[0].value,
            activeUsers: Number(row.metricValues[0].value),
            newUsers: Number(row.metricValues[1].value),
            sessions: Number(row.metricValues[2].value),
            screenPageViews: Number(row.metricValues[3].value),
            averageSessionDuration: Number(row.metricValues[4].value),
            bounceRate: Number(row.metricValues[5].value),
        }));

        // Parse top pages
        const topPages = (pagesResponse.rows || []).map(row => {
            const pageviews = Number(row.metricValues[0].value);
            const userEngagementDuration = Number(row.metricValues[2].value);
            const avgEngagementTime = pageviews > 0 ? Math.round(userEngagementDuration / pageviews) : 0;
            return {
                pagePath: row.dimensionValues[0].value,
                pageTitle: row.dimensionValues[1].value,
                screenPageViews: pageviews,
                sessions: Number(row.metricValues[1].value),
                averageEngagementTime: avgEngagementTime,
                bounceRate: Number(row.metricValues[3].value),
            };
        });

        // Parse top countries
        const topCountries = (countriesResponse.rows || []).map(row => ({
            country: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
            newUsers: Number(row.metricValues[2].value),
            bounceRate: Number(row.metricValues[3].value),
        }));

        // Parse traffic sources
        const trafficSources = (trafficResponse.rows || []).map(row => ({
            sessionSource: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // Parse device categories
        const deviceCategories = (deviceResponse.rows || []).map(row => ({
            deviceCategory: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // Parse user types
        const userTypes = (userTypesResponse.rows || []).map(row => ({
            newVsReturning: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
            activeUsers: Number(row.metricValues[1].value),
        }));

        // Parse hourly
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
        console.error('❌ GA API error:', error.message);
        console.error('Error details:', JSON.stringify(error.details, null, 2));
        res.status(500).json({
            error: error.message,
            code: error.code || null,
            details: error.details || null,
        });
    }
}