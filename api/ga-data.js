// api/ga-data.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

    // ---- DUMMY DATA ----
    const days = 4;
    const today = new Date();
    const timeSeries = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        timeSeries.push({
            date: dateStr,
            activeUsers: Math.floor(20 + Math.random() * 80),
            newUsers: Math.floor(5 + Math.random() * 30),
            sessions: Math.floor(30 + Math.random() * 100),
            pageviews: Math.floor(50 + Math.random() * 200),
        });
    }

    // Aggregate totals
    const totalUsers = timeSeries.reduce((s, d) => s + d.activeUsers, 0);
    const newUsers = timeSeries.reduce((s, d) => s + d.newUsers, 0);
    const sessions = timeSeries.reduce((s, d) => s + d.sessions, 0);
    const pageviews = timeSeries.reduce((s, d) => s + d.pageviews, 0);

    const summary = {
        totalUsers: totalUsers,
        newUsers: newUsers,
        sessions: sessions,
        screenPageViews: pageviews,
        averageSessionDuration: '95',
        bounceRate: '42.5',
        engagementRate: '57.5',
    };

    const topPages = [
        { pagePath: '/', pageviews: 320 },
        { pagePath: '/procedures', pageviews: 180 },
        { pagePath: '/contact', pageviews: 95 },
        { pagePath: '/about', pageviews: 70 },
        { pagePath: '/blog', pageviews: 55 },
    ];

    const topCountries = [
        { country: 'Kenya', sessions: 180 },
        { country: 'United States', sessions: 90 },
        { country: 'United Kingdom', sessions: 45 },
        { country: 'Nigeria', sessions: 30 },
        { country: 'South Africa', sessions: 25 },
    ];

    const trafficSources = [
        { source: 'google', sessions: 200 },
        { source: 'direct', sessions: 120 },
        { source: 'facebook', sessions: 60 },
        { source: 'instagram', sessions: 40 },
        { source: 'referral', sessions: 20 },
    ];

    const deviceCategories = [
        { device: 'mobile', sessions: 250 },
        { device: 'desktop', sessions: 150 },
        { device: 'tablet', sessions: 60 },
    ];

    // Respond
    res.status(200).json({
        summary,
        timeSeries,
        topPages,
        topCountries,
        trafficSources,
        deviceCategories,
    });
}