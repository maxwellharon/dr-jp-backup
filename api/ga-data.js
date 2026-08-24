import { BetaAnalyticsDataClient } from '@google-analytics/data';

const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;
const roundPercent = (value) => round1(value);

function parseDateRange(query = {}) {
    const dateFrom = typeof query.dateFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.dateFrom)
        ? query.dateFrom
        : '90daysAgo';
    const dateTo = typeof query.dateTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.dateTo)
        ? query.dateTo
        : 'today';
    return [{ startDate: dateFrom, endDate: dateTo }];
}

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

        const property = `properties/${GA_PROPERTY_ID}`;
        const dateRanges = parseDateRange(req.query || {});

        const run = async (name, request) => {
            try {
                const [response] = await client.runReport(request);
                return response;
            } catch (err) {
                console.error(`GA report ${name} failed:`, err);
                throw new Error(`[${name}] ${err.message}`);
            }
        };

        const requests = {
            summary: {
                property,
                dateRanges,
                metrics: [
                    { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'sessions' },
                    { name: 'screenPageViews' }, { name: 'averageSessionDuration' },
                    { name: 'bounceRate' }, { name: 'engagementRate' },
                ],
            },
            timeSeries: {
                property, dateRanges,
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' },
                    { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' },
                ],
                orderBys: [{ dimension: { dimensionName: 'date' } }],
            },
            topPages: {
                property, dateRanges,
                dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
                metrics: [
                    { name: 'screenPageViews' }, { name: 'sessions' },
                    { name: 'userEngagementDuration' }, { name: 'bounceRate' },
                ],
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
                limit: 20,
            },
            topCountries: {
                property, dateRanges,
                dimensions: [{ name: 'country' }],
                metrics: [
                    { name: 'sessions' }, { name: 'activeUsers' }, { name: 'newUsers' }, { name: 'bounceRate' },
                ],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 20,
            },
            trafficSources: {
                property, dateRanges,
                dimensions: [{ name: 'sessionSource' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 15,
            },
            deviceCategories: {
                property, dateRanges,
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            },
            userTypes: {
                property, dateRanges,
                dimensions: [{ name: 'newVsReturning' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            },
            hourly: {
                property, dateRanges,
                dimensions: [{ name: 'hour' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
                orderBys: [{ dimension: { dimensionName: 'hour' } }],
            },
        };

        const [summaryResponse, timeSeriesResponse, pagesResponse, countriesResponse,
            trafficResponse, deviceResponse, userTypesResponse, hourlyResponse] = await Promise.all([
                run('summary', requests.summary),
                run('timeSeries', requests.timeSeries),
                run('topPages', requests.topPages),
                run('topCountries', requests.topCountries),
                run('trafficSources', requests.trafficSources),
                run('deviceCategories', requests.deviceCategories),
                run('userTypes', requests.userTypes),
                run('hourly', requests.hourly),
            ]);

        const metricNumber = (row, index) => Number(row?.metricValues?.[index]?.value || 0);

        const summary = {};
        const summaryHeaders = summaryResponse.metricHeaders || [];
        const summaryValues = summaryResponse.rows?.[0]?.metricValues || [];
        summaryValues.forEach((value, index) => {
            const metric = summaryHeaders[index]?.name;
            if (!metric) return;
            const numeric = Number(value.value || 0);
            summary[metric] = ['bounceRate', 'engagementRate', 'averageSessionDuration'].includes(metric)
                ? roundPercent(numeric)
                : Math.round(numeric);
        });

        const timeSeries = (timeSeriesResponse.rows || []).map((row) => ({
            date: row.dimensionValues?.[0]?.value || '',
            activeUsers: Math.round(metricNumber(row, 0)),
            newUsers: Math.round(metricNumber(row, 1)),
            sessions: Math.round(metricNumber(row, 2)),
            screenPageViews: Math.round(metricNumber(row, 3)),
            averageSessionDuration: round1(metricNumber(row, 4)),
            bounceRate: roundPercent(metricNumber(row, 5)),
        }));

        const topPages = (pagesResponse.rows || []).map((row) => {
            const pageviews = Math.round(metricNumber(row, 0));
            const engagementDuration = metricNumber(row, 2);
            return {
                pagePath: row.dimensionValues?.[0]?.value || '/',
                pageTitle: row.dimensionValues?.[1]?.value || '',
                screenPageViews: pageviews,
                sessions: Math.round(metricNumber(row, 1)),
                averageEngagementTime: pageviews > 0 ? round1(engagementDuration / pageviews) : 0,
                bounceRate: roundPercent(metricNumber(row, 3)),
            };
        });

        const topCountries = (countriesResponse.rows || []).map((row) => ({
            country: row.dimensionValues?.[0]?.value || 'Unknown',
            sessions: Math.round(metricNumber(row, 0)),
            activeUsers: Math.round(metricNumber(row, 1)),
            newUsers: Math.round(metricNumber(row, 2)),
            bounceRate: roundPercent(metricNumber(row, 3)),
        }));

        const trafficSources = (trafficResponse.rows || []).map((row) => ({
            sessionSource: row.dimensionValues?.[0]?.value || '(direct)',
            sessions: Math.round(metricNumber(row, 0)),
            activeUsers: Math.round(metricNumber(row, 1)),
        }));

        const deviceCategories = (deviceResponse.rows || []).map((row) => ({
            deviceCategory: row.dimensionValues?.[0]?.value || 'unknown',
            sessions: Math.round(metricNumber(row, 0)),
            activeUsers: Math.round(metricNumber(row, 1)),
        }));

        const userTypes = (userTypesResponse.rows || []).map((row) => ({
            newVsReturning: row.dimensionValues?.[0]?.value || 'unknown',
            sessions: Math.round(metricNumber(row, 0)),
            activeUsers: Math.round(metricNumber(row, 1)),
        }));

        const hourly = (hourlyResponse.rows || []).map((row) => ({
            hour: row.dimensionValues?.[0]?.value || '0',
            sessions: Math.round(metricNumber(row, 0)),
            activeUsers: Math.round(metricNumber(row, 1)),
        }));

        return res.status(200).json({
            generatedAt: new Date().toISOString(),
            dateRange: dateRanges[0],
            summary, timeSeries, topPages, topCountries,
            trafficSources, deviceCategories, userTypes, hourly,
        });
    } catch (error) {
        console.error('GA API error:', error);
        return res.status(500).json({ error: error.message, code: error.code || null });
    }
}