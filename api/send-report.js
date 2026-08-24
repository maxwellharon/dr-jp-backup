import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/*
|--------------------------------------------------------------------------
| DR. JP OGALO CLINIC
| Comprehensive GA4 Management Report Generator
|--------------------------------------------------------------------------
|
| Expected POST body:
|
| {
|   recipients: ["email@example.com"],
|   reportData: {
|     summary: {},
|     timeSeries: [],
|     topPages: [],
|     topCountries: [],
|     trafficSources: [],
|     deviceCategories: [],
|     userTypes: [],
|     hourly: [],
|     aiInsights: [],
|     images: [],
|     tables: []
|   },
|   reportType: "Site Analytics Report",
|   filters: {
|     dateFrom: "2026-08-01",
|     dateTo: "2026-08-24"
|   }
| }
|
|--------------------------------------------------------------------------
| Optional:
|
| OPENAI_API_KEY
|
| If present, an additional executive AI narrative will be generated.
| Without it, the report still generates extensive deterministic
| management analytics.
|--------------------------------------------------------------------------
*/

const PRIMARY = [15, 23, 42];
const SECONDARY = [51, 65, 85];
const ACCENT = [79, 70, 229];
const SUCCESS = [16, 185, 129];
const WARNING = [245, 158, 11];
const DANGER = [239, 68, 68];
const INFO = [14, 165, 233];
const PURPLE = [139, 92, 246];
const MUTED = [100, 116, 139];
const BORDER = [226, 232, 240];
const LIGHT = [248, 250, 252];
const WHITE = [255, 255, 255];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 278;

function escapeText(value) {
    return String(value ?? '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(number(value));
}

function formatPercent(value, decimals = 1) {
    return `${number(value).toFixed(decimals)}%`;
}

function formatDuration(seconds) {
    const value = number(seconds);

    if (value <= 0) {
        return '0s';
    }

    const mins = Math.floor(value / 60);
    const secs = Math.round(value % 60);

    if (mins === 0) {
        return `${secs}s`;
    }

    return `${mins}m ${secs}s`;
}

function formatDate(value) {
    if (!value) return '';

    const text = String(value);

    let normalized = text;

    if (/^\d{8}$/.test(text)) {
        normalized =
            `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
    }

    const date = new Date(`${normalized}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return escapeText(value);
    }

    return date.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Nairobi',
    });
}

function safeDate(value) {
    if (!value) return '';

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return escapeText(value);
    }

    return parsed.toLocaleDateString('en-KE', {
        timeZone: 'Africa/Nairobi',
    });
}

function pct(part, total) {
    const denominator = number(total);

    if (denominator <= 0) return 0;

    return (number(part) / denominator) * 100;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sumBy(array, key) {
    return (array || []).reduce(
        (sum, item) => sum + number(item?.[key]),
        0
    );
}

function averageBy(array, key) {
    if (!array?.length) return 0;

    return sumBy(array, key) / array.length;
}

function median(values) {
    if (!values?.length) return 0;

    const sorted = values
        .map(number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    if (!sorted.length) return 0;

    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(values) {
    if (!values?.length) return 0;

    const clean = values.map(number).filter(Number.isFinite);

    if (!clean.length) return 0;

    const mean =
        clean.reduce((sum, value) => sum + value, 0) / clean.length;

    const variance =
        clean.reduce(
            (sum, value) => sum + Math.pow(value - mean, 2),
            0
        ) / clean.length;

    return Math.sqrt(variance);
}

function sortDescending(array, key) {
    return [...(array || [])].sort(
        (a, b) => number(b?.[key]) - number(a?.[key])
    );
}

function safeLabel(value, maxLength = 38) {
    const text = escapeText(value || 'Unknown');

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 3)}...`;
}

function normalizeForDedup(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// Deterministic insights (calculated from the dataset) and client-supplied
// insights (e.g. from the dashboard's own AI Analytics view) frequently
// cover the same point in near-identical wording. Printing both reads as
// duplicated/repeated text in the finished report, so keep only the first
// occurrence of each distinct title + message.
function dedupeInsights(insights) {
    const seen = new Set();
    const result = [];

    for (const insight of insights) {
        const key =
            `${normalizeForDedup(insight?.title)}|` +
            normalizeForDedup(insight?.message).slice(0, 120);

        if (seen.has(key)) continue;

        seen.add(key);
        result.push(insight);
    }

    return result;
}

/*
|--------------------------------------------------------------------------
| PDF PAGE MANAGEMENT
|--------------------------------------------------------------------------
*/

function addHeader(doc, reportType, periodText, generatedAt) {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, PAGE_WIDTH, 34, 'F');

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DR. JP OGALO CLINIC', MARGIN, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Website Intelligence & Management Analytics', MARGIN, 18);
    doc.text(`Generated: ${generatedAt}`, MARGIN, 24);
    doc.text(`Period: ${periodText}`, MARGIN, 30);

    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(
        escapeText(reportType || 'Website Analytics Report'),
        MARGIN,
        46
    );
}

function addFooter(doc) {
    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);

        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(
            MARGIN,
            286,
            PAGE_WIDTH - MARGIN,
            286
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);

        doc.text(
            'Dr. JP Ogalo Clinic · Internal Website Intelligence Report',
            MARGIN,
            292
        );

        doc.text(
            `Page ${page} of ${pages}`,
            PAGE_WIDTH - MARGIN,
            292,
            { align: 'right' }
        );
    }
}

function ensureSpace(doc, y, requiredHeight = 20) {
    if (y + requiredHeight <= CONTENT_BOTTOM) {
        return y;
    }

    doc.addPage();

    return 18;
}

function addSectionTitle(doc, title, y) {
    y = ensureSpace(doc, y, 14);

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY);

    doc.text(
        escapeText(title),
        MARGIN,
        y
    );

    return y + 8;
}

/*
|--------------------------------------------------------------------------
| KPI CARDS
|--------------------------------------------------------------------------
*/

function drawMetricCard(
    doc,
    x,
    y,
    width,
    height,
    label,
    value,
    color = ACCENT,
    secondaryText = ''
) {
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(
        x,
        y,
        width,
        height,
        2.5,
        2.5,
        'FD'
    );

    doc.setFillColor(...color);
    doc.roundedRect(
        x,
        y,
        3,
        height,
        1.2,
        1.2,
        'F'
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
        escapeText(label).toUpperCase(),
        x + 7,
        y + 7
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...PRIMARY);

    doc.text(
        escapeText(value),
        x + 7,
        y + 16
    );

    if (secondaryText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...MUTED);

        const lines = doc.splitTextToSize(
            escapeText(secondaryText),
            width - 14
        );

        doc.text(
            lines.slice(0, 2),
            x + 7,
            y + 22
        );
    }
}

function addKpiDashboard(doc, analytics, y) {
    y = addSectionTitle(
        doc,
        'Executive KPI Dashboard',
        y
    );

    const gap = 4;
    const cardWidth = (CONTENT_WIDTH - gap * 3) / 4;
    const cardHeight = 28;

    const cards = [
        {
            label: 'Users',
            value: formatNumber(analytics.totalUsers),
            color: ACCENT,
            note: `${formatPercent(analytics.newUserRate)} new-user rate`,
        },
        {
            label: 'Sessions',
            value: formatNumber(analytics.sessions),
            color: WARNING,
            note: `${formatNumber(analytics.sessionsPerUser, 2)} sessions / user`,
        },
        {
            label: 'Page Views',
            value: formatNumber(analytics.pageviews),
            color: SUCCESS,
            note: `${formatNumber(analytics.viewsPerSession, 2)} views / session`,
        },
        {
            label: 'Engagement',
            value: formatPercent(analytics.engagementRate),
            color: INFO,
            note: `${formatDuration(analytics.averageSessionDuration)} avg.`,
        },
        {
            label: 'Bounce',
            value: formatPercent(analytics.bounceRate),
            color: DANGER,
            note: analytics.bounceRate > 50
                ? 'Needs attention'
                : 'Within healthier range',
        },
        {
            label: 'Returning',
            value: formatPercent(analytics.returningRate),
            color: PURPLE,
            note: analytics.returningRate < 30
                ? 'Retention opportunity'
                : 'Healthy repeat audience',
        },
        {
            label: 'Mobile',
            value: formatPercent(analytics.mobileShare),
            color: ACCENT,
            note: 'Mobile dependency',
        },
        {
            label: 'Top Source',
            value: safeLabel(analytics.topSource?.sessionSource || 'N/A', 20),
            color: SUCCESS,
            note: `${formatNumber(analytics.topSource?.sessions)} sessions`,
        },
    ];

    cards.forEach((card, index) => {
        const row = Math.floor(index / 4);
        const column = index % 4;

        drawMetricCard(
            doc,
            MARGIN + column * (cardWidth + gap),
            y + row * (cardHeight + gap),
            cardWidth,
            cardHeight,
            card.label,
            card.value,
            card.color,
            card.note
        );
    });

    return y + cardHeight * 2 + gap + 8;
}

/*
|--------------------------------------------------------------------------
| DATA NORMALISATION
|--------------------------------------------------------------------------
*/

function normalizeReportData(reportData = {}) {
    const summary = reportData.summary || {};

    return {
        summary,

        timeSeries: Array.isArray(reportData.timeSeries)
            ? reportData.timeSeries
            : [],

        topPages: Array.isArray(reportData.topPages)
            ? reportData.topPages
            : [],

        topCountries: Array.isArray(reportData.topCountries)
            ? reportData.topCountries
            : [],

        trafficSources: Array.isArray(reportData.trafficSources)
            ? reportData.trafficSources
            : [],

        deviceCategories: Array.isArray(reportData.deviceCategories)
            ? reportData.deviceCategories
            : [],

        userTypes: Array.isArray(reportData.userTypes)
            ? reportData.userTypes
            : [],

        hourly: Array.isArray(reportData.hourly)
            ? reportData.hourly
            : [],

        aiInsights: Array.isArray(reportData.aiInsights)
            ? reportData.aiInsights
            : [],

        images: Array.isArray(reportData.images)
            ? reportData.images
            : [],

        tables: Array.isArray(reportData.tables)
            ? reportData.tables
            : [],
    };
}

/*
|--------------------------------------------------------------------------
| ANALYTICS ENGINE
|--------------------------------------------------------------------------
*/

function calculateAnalytics(data) {
    const summary = data.summary || {};

    const timeSeries = data.timeSeries || [];
    const pages = data.topPages || [];
    const countries = data.topCountries || [];
    const sources = data.trafficSources || [];
    const devices = data.deviceCategories || [];
    const users = data.userTypes || [];
    const hourly = data.hourly || [];

    const totalUsers =
        number(summary.totalUsers) ||
        sumBy(timeSeries, 'activeUsers');

    const newUsers =
        number(summary.newUsers) ||
        sumBy(timeSeries, 'newUsers');

    const sessions =
        number(summary.sessions) ||
        sumBy(timeSeries, 'sessions');

    const pageviews =
        number(summary.screenPageViews) ||
        sumBy(timeSeries, 'screenPageViews');

    const averageSessionDuration =
        number(summary.averageSessionDuration);

    const bounceRate =
        number(summary.bounceRate);

    const engagementRate =
        number(summary.engagementRate);

    const mobile =
        devices.find(
            item =>
                String(item.deviceCategory || '').toLowerCase() ===
                'mobile'
        );

    const returning =
        users.find(
            item =>
                String(item.newVsReturning || '').toLowerCase() ===
                'returning'
        );

    const newUserCategory =
        users.find(
            item =>
                String(item.newVsReturning || '').toLowerCase() ===
                'new'
        );

    const sortedPages = sortDescending(
        pages,
        'screenPageViews'
    );

    const sortedSources = sortDescending(
        sources,
        'sessions'
    );

    const sortedCountries = sortDescending(
        countries,
        'sessions'
    );

    const sortedHours = sortDescending(
        hourly,
        'sessions'
    );

    const pageViewsPerSession =
        sessions > 0
            ? pageviews / sessions
            : 0;

    const sessionsPerUser =
        totalUsers > 0
            ? sessions / totalUsers
            : 0;

    const mobileShare =
        sessions > 0
            ? pct(mobile?.sessions, sessions)
            : 0;

    const returningRate =
        sessions > 0
            ? pct(returning?.sessions, sessions)
            : 0;

    const newUserRate =
        sessions > 0
            ? pct(newUserCategory?.sessions, sessions)
            : pct(newUsers, totalUsers);

    const topSource = sortedSources[0];
    const topCountry = sortedCountries[0];
    const topPage = sortedPages[0];

    const topSourceShare =
        sessions > 0
            ? pct(topSource?.sessions, sessions)
            : 0;

    const topCountryShare =
        sessions > 0
            ? pct(topCountry?.sessions, sessions)
            : 0;

    const topPageShare =
        pageviews > 0
            ? pct(topPage?.screenPageViews, pageviews)
            : 0;

    const dailySessions = timeSeries.map(
        item => number(item.sessions)
    );

    const dailyUsers = timeSeries.map(
        item => number(item.activeUsers)
    );

    const dailyPageviews = timeSeries.map(
        item => number(item.screenPageViews)
    );

    const sessionMean = dailySessions.length
        ? averageBy(
            dailySessions.map(value => ({
                value
            })),
            'value'
        )
        : 0;

    const sessionStdDev =
        standardDeviation(dailySessions);

    const medianDailySessions =
        median(dailySessions);

    const trend = calculateTrend(timeSeries);

    const weekdayAnalysis =
        calculateWeekdayAnalysis(timeSeries);

    const peakHour = sortedHours[0];

    const worstHour =
        [...hourly].sort(
            (a, b) =>
                number(a.sessions) -
                number(b.sessions)
        )[0];

    const highBouncePages = [...pages]
        .filter(page => number(page.screenPageViews) > 0)
        .sort(
            (a, b) =>
                number(b.bounceRate) -
                number(a.bounceRate)
        )
        .slice(0, 10);

    const highEngagementPages = [...pages]
        .filter(page => number(page.screenPageViews) > 0)
        .sort(
            (a, b) =>
                number(b.averageEngagementTime) -
                number(a.averageEngagementTime)
        )
        .slice(0, 10);

    const hiddenGemPages = [...pages]
        .filter(page => {
            const views = number(page.screenPageViews);
            const engagement = number(page.averageEngagementTime);
            const bounce = number(page.bounceRate);

            return (
                views < Math.max(100, pageviews * 0.03) &&
                engagement >= Math.max(45, averageSessionDuration) &&
                bounce < Math.max(50, bounceRate)
            );
        })
        .sort(
            (a, b) =>
                number(b.averageEngagementTime) -
                number(a.averageEngagementTime)
        );

    const pageQuality = calculatePageQuality(
        pages,
        bounceRate,
        averageSessionDuration
    );

    const trafficConcentration =
        sortedSources.slice(0, 3).reduce(
            (sum, source) =>
                sum + number(source.sessions),
            0
        );

    const top3SourceShare =
        sessions > 0
            ? pct(trafficConcentration, sessions)
            : 0;

    const countryConcentration =
        sortedCountries
            .slice(0, 3)
            .reduce(
                (sum, country) =>
                    sum + number(country.sessions),
                0
            );

    const top3CountryShare =
        sessions > 0
            ? pct(countryConcentration, sessions)
            : 0;

    const sourceCount = sources.length;

    const countryCount = countries.length;

    const deviceCount = devices.length;

    const dailyBest = [...timeSeries].sort(
        (a, b) =>
            number(b.sessions) -
            number(a.sessions)
    )[0];

    const dailyWorst = [...timeSeries].sort(
        (a, b) =>
            number(a.sessions) -
            number(b.sessions)
    )[0];

    const volatility =
        sessionMean > 0
            ? (sessionStdDev / sessionMean) * 100
            : 0;

    const anomalyDays = detectAnomalies(timeSeries);

    const strongestPageOpportunity =
        [...pages].sort(
            (a, b) =>
                pageOpportunityScore(b, summary) -
                pageOpportunityScore(a, summary)
        )[0];

    return {
        totalUsers,
        newUsers,
        sessions,
        pageviews,
        averageSessionDuration,
        bounceRate,
        engagementRate,

        viewsPerSession: pageViewsPerSession,
        sessionsPerUser,
        mobileShare,
        returningRate,
        newUserRate,

        topSource,
        topCountry,
        topPage,

        topSourceShare,
        topCountryShare,
        topPageShare,

        sources,
        countries,
        devices,
        users,
        hourly,
        pages,
        timeSeries,

        sortedPages,
        sortedSources,
        sortedCountries,
        sortedHours,

        peakHour,
        worstHour,

        trend,
        weekdayAnalysis,

        highBouncePages,
        highEngagementPages,
        hiddenGemPages,

        pageQuality,

        top3SourceShare,
        top3CountryShare,

        sourceCount,
        countryCount,
        deviceCount,

        dailyBest,
        dailyWorst,

        sessionMean,
        sessionStdDev,
        medianDailySessions,
        volatility,

        anomalyDays,

        strongestPageOpportunity,

        dataCoverage: {
            dailyRecords: timeSeries.length,
            pageRecords: pages.length,
            countryRecords: countries.length,
            sourceRecords: sources.length,
            deviceRecords: devices.length,
            userTypeRecords: users.length,
            hourlyRecords: hourly.length,
        },
    };
}

function calculateTrend(timeSeries) {
    if (!timeSeries || timeSeries.length < 4) {
        return {
            change: 0,
            direction: 'stable',
            firstAverage: 0,
            secondAverage: 0,
        };
    }

    const split = Math.floor(
        timeSeries.length / 2
    );

    const first = timeSeries.slice(0, split);
    const second = timeSeries.slice(split);

    const firstAverage =
        first.reduce(
            (sum, item) =>
                sum + number(item.activeUsers),
            0
        ) /
        Math.max(first.length, 1);

    const secondAverage =
        second.reduce(
            (sum, item) =>
                sum + number(item.activeUsers),
            0
        ) /
        Math.max(second.length, 1);

    const change =
        firstAverage > 0
            ? ((secondAverage - firstAverage) /
                firstAverage) *
            100
            : 0;

    let direction = 'stable';

    if (change > 10) {
        direction = 'growth';
    } else if (change < -10) {
        direction = 'decline';
    }

    return {
        change,
        direction,
        firstAverage,
        secondAverage,
    };
}

function calculateWeekdayAnalysis(timeSeries) {
    const names = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    const buckets = {};

    timeSeries.forEach(item => {
        if (!item?.date) return;

        let raw = String(item.date);

        if (/^\d{8}$/.test(raw)) {
            raw =
                `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        }

        const date = new Date(`${raw}T00:00:00`);

        if (Number.isNaN(date.getTime())) return;

        const day = names[date.getDay()];

        if (!buckets[day]) {
            buckets[day] = {
                sessions: 0,
                users: 0,
                days: 0,
            };
        }

        buckets[day].sessions += number(item.sessions);
        buckets[day].users += number(item.activeUsers);
        buckets[day].days += 1;
    });

    const entries = Object.entries(buckets).map(
        ([day, values]) => ({
            day,
            averageSessions:
                values.days > 0
                    ? values.sessions / values.days
                    : 0,
            averageUsers:
                values.days > 0
                    ? values.users / values.days
                    : 0,
        })
    );

    entries.sort(
        (a, b) =>
            b.averageSessions -
            a.averageSessions
    );

    return {
        rows: entries,
        best: entries[0],
        worst: entries[entries.length - 1],
    };
}

function pageOpportunityScore(page, summary) {
    const views = number(page?.screenPageViews);
    const engagement = number(page?.averageEngagementTime);
    const bounce = number(page?.bounceRate);

    if (!views) return 0;

    const engagementScore =
        clamp(
            engagement /
            Math.max(
                1,
                number(summary?.averageSessionDuration)
            ),
            0,
            2
        ) * 40;

    const bounceScore =
        clamp(
            (100 - bounce) / 100,
            0,
            1
        ) * 30;

    const trafficScore =
        clamp(
            views /
            Math.max(
                1,
                number(summary?.screenPageViews)
            ),
            0,
            1
        ) * 30;

    return (
        engagementScore +
        bounceScore +
        trafficScore
    );
}

function calculatePageQuality(
    pages,
    siteBounceRate,
    averageSessionDuration
) {
    return pages.map(page => {
        const bounce =
            number(page.bounceRate);

        const engagement =
            number(page.averageEngagementTime);

        const views =
            number(page.screenPageViews);

        let score = 50;

        if (bounce < siteBounceRate) {
            score += 20;
        } else {
            score -= 15;
        }

        if (engagement > averageSessionDuration) {
            score += 20;
        } else {
            score -= 10;
        }

        if (views > 0) {
            score += 10;
        }

        score = clamp(score, 0, 100);

        let rating = 'Moderate';

        if (score >= 80) {
            rating = 'Strong';
        } else if (score < 50) {
            rating = 'Needs attention';
        }

        return {
            page,
            score,
            rating,
        };
    });
}

function detectAnomalies(timeSeries) {
    if (!timeSeries || timeSeries.length < 7) {
        return [];
    }

    const values = timeSeries.map(
        item => number(item.sessions)
    );

    const mean =
        values.reduce(
            (sum, value) => sum + value,
            0
        ) /
        values.length;

    const std =
        standardDeviation(values);

    if (std <= 0) {
        return [];
    }

    return timeSeries.filter(item => {
        const sessions =
            number(item.sessions);

        return (
            Math.abs(sessions - mean) /
            std >= 2.5
        );
    });
}

/*
|--------------------------------------------------------------------------
| DETERMINISTIC AI INSIGHTS
|--------------------------------------------------------------------------
*/

function buildAIInsights(analytics) {
    const insights = [];

    const {
        totalUsers,
        sessions,
        pageviews,
        bounceRate,
        engagementRate,
        averageSessionDuration,
        mobileShare,
        returningRate,
        newUserRate,
        topSource,
        topCountry,
        topPage,
        topSourceShare,
        topCountryShare,
        topPageShare,
        trend,
        peakHour,
        worstHour,
        weekdayAnalysis,
        highBouncePages,
        highEngagementPages,
        hiddenGemPages,
        top3SourceShare,
        top3CountryShare,
        volatility,
        anomalyDays,
        dailyBest,
        dailyWorst,
        viewsPerSession,
        sessionsPerUser,
        strongestPageOpportunity,
        pageQuality,
    } = analytics;

    /*
    |--------------------------------------------------------------------------
    | EXECUTIVE HEALTH
    |--------------------------------------------------------------------------
    */

    if (engagementRate >= 60) {
        insights.push({
            priority: 'positive',
            title: 'Healthy Engagement Environment',
            message:
                `The site recorded an engagement rate of ${formatPercent(
                    engagementRate
                )}. This indicates that users are actively interacting with the site rather than simply arriving and leaving immediately.`,
            action:
                'Protect the content and UX patterns contributing to engagement and replicate them across weaker pages.',
        });
    } else {
        insights.push({
            priority: 'high',
            title: 'Engagement Improvement Required',
            message:
                `The site engagement rate is ${formatPercent(
                    engagementRate
                )}. There is a material opportunity to improve content relevance, page hierarchy, calls-to-action and navigation.`,
            action:
                'Review the highest-traffic pages first and strengthen the first-screen value proposition and conversion paths.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | BOUNCE
    |--------------------------------------------------------------------------
    */

    if (bounceRate > 60) {
        insights.push({
            priority: 'critical',
            title: 'High Bounce Risk',
            message:
                `The site-wide bounce rate is ${formatPercent(
                    bounceRate
                )}, which means a substantial proportion of traffic is leaving without deeper interaction.`,
            action:
                'Audit high-bounce landing pages, page speed, mobile layout, headline relevance and CTA visibility.',
        });
    } else if (bounceRate > 45) {
        insights.push({
            priority: 'medium',
            title: 'Bounce Rate Requires Monitoring',
            message:
                `The current bounce rate is ${formatPercent(
                    bounceRate
                )}. The metric is not automatically negative, but it should be investigated at page and acquisition-source level.`,
            action:
                'Identify pages materially above the site average and address their specific UX or content issues.',
        });
    } else {
        insights.push({
            priority: 'positive',
            title: 'Healthy Bounce Profile',
            message:
                `The current bounce rate of ${formatPercent(
                    bounceRate
                )} suggests comparatively strong initial relevance and interaction.`,
            action:
                'Maintain the current page-entry experience while optimizing conversion opportunities.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TRAFFIC TREND
    |--------------------------------------------------------------------------
    */

    if (trend.direction === 'growth') {
        insights.push({
            priority: 'positive',
            title: 'Traffic Momentum',
            message:
                `Average active users were ${formatPercent(
                    Math.abs(trend.change),
                    1
                )} higher in the second half of the reporting period than in the first half.`,
            action:
                'Identify the campaigns, content or referral sources responsible and scale the successful pattern.',
        });
    } else if (trend.direction === 'decline') {
        insights.push({
            priority: 'critical',
            title: 'Traffic Decline Detected',
            message:
                `Average active users declined by ${formatPercent(
                    Math.abs(trend.change),
                    1
                )} between the first and second halves of the reporting period.`,
            action:
                'Investigate acquisition changes, content publishing activity, technical issues, tracking changes and campaign performance.',
        });
    } else {
        insights.push({
            priority: 'medium',
            title: 'Traffic Is Relatively Stable',
            message:
                'The reporting period does not show a strong upward or downward movement in active users.',
            action:
                'Use targeted acquisition and content experiments rather than relying on passive traffic growth.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TOP PAGE
    |--------------------------------------------------------------------------
    */

    if (topPage) {
        insights.push({
            priority: 'high',
            title: 'Primary Content Asset',
            message:
                `"${escapeText(topPage.pagePath)}" generated ${formatNumber(
                    topPage.screenPageViews
                )} pageviews and accounts for approximately ${formatPercent(
                    topPageShare
                )} of tracked pageviews.`,
            action:
                'Use this page as a strategic distribution and conversion asset. Add strong next-step CTAs and internal links.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SOURCE CONCENTRATION
    |--------------------------------------------------------------------------
    */

    if (topSource) {
        if (topSourceShare >= 60) {
            insights.push({
                priority: 'critical',
                title: 'Acquisition Concentration Risk',
                message:
                    `${safeLabel(
                        topSource.sessionSource
                    )} supplies approximately ${formatPercent(
                        topSourceShare
                    )} of sessions.`,
                action:
                    'Reduce dependency by strengthening organic search, referrals, social acquisition and other channels.',
            });
        } else {
            insights.push({
                priority: 'positive',
                title: 'Primary Acquisition Channel',
                message:
                    `${safeLabel(
                        topSource.sessionSource
                    )} is the strongest identifiable acquisition source with ${formatNumber(
                        topSource.sessions
                    )} sessions.`,
                action:
                    'Maintain this channel while continuing to diversify traffic sources.',
            });
        }
    }

    if (top3SourceShare > 80) {
        insights.push({
            priority: 'high',
            title: 'Top-Three Channel Dominance',
            message:
                `The three largest acquisition sources collectively account for approximately ${formatPercent(
                    top3SourceShare
                )} of sessions.`,
            action:
                'Build a deliberate channel-diversification strategy to reduce single-channel exposure.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GEOGRAPHY
    |--------------------------------------------------------------------------
    */

    if (topCountry) {
        insights.push({
            priority:
                topCountryShare > 75
                    ? 'high'
                    : 'medium',
            title: 'Geographic Market Concentration',
            message:
                `${escapeText(
                    topCountry.country
                )} represents approximately ${formatPercent(
                    topCountryShare
                )} of tracked sessions.`,
            action:
                topCountryShare > 75
                    ? 'Protect the core market while testing targeted growth campaigns in secondary markets.'
                    : 'Continue building the strongest market while monitoring emerging geographies.',
        });
    }

    if (top3CountryShare > 85) {
        insights.push({
            priority: 'medium',
            title: 'Geographic Concentration',
            message:
                `The three largest countries account for approximately ${formatPercent(
                    top3CountryShare
                )} of sessions.`,
            action:
                'Consider market-specific landing pages and content if geographic expansion is a business priority.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MOBILE
    |--------------------------------------------------------------------------
    */

    if (mobileShare >= 70) {
        insights.push({
            priority: 'critical',
            title: 'Mobile-First Business Exposure',
            message:
                `Approximately ${formatPercent(
                    mobileShare
                )} of sessions occur on mobile devices.`,
            action:
                'Treat mobile performance as a primary commercial KPI. Prioritize speed, CTA visibility, forms and mobile navigation.',
        });
    } else if (mobileShare >= 50) {
        insights.push({
            priority: 'high',
            title: 'Mobile Is the Primary Experience',
            message:
                `Mobile contributes approximately ${formatPercent(
                    mobileShare
                )} of sessions.`,
            action:
                'Keep mobile UX ahead of desktop when prioritizing conversion and performance improvements.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RETURNING USERS
    |--------------------------------------------------------------------------
    */

    if (returningRate < 20) {
        insights.push({
            priority: 'high',
            title: 'Low Returning Audience',
            message:
                `Only approximately ${formatPercent(
                    returningRate
                )} of sessions are from returning users.`,
            action:
                'Improve retention through educational content, remarketing, email capture, follow-up journeys and recurring content.',
        });
    } else if (returningRate >= 35) {
        insights.push({
            priority: 'positive',
            title: 'Strong Repeat Audience',
            message:
                `Returning users account for approximately ${formatPercent(
                    returningRate
                )} of sessions.`,
            action:
                'Build on the existing retention base with recurring content and stronger conversion journeys.',
        });
    } else {
        insights.push({
            priority: 'medium',
            title: 'Retention Opportunity',
            message:
                `Returning users account for approximately ${formatPercent(
                    returningRate
                )} of sessions.`,
            action:
                'Increase the percentage of users returning to the site through follow-up content and remarketing.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | NEW USER ACQUISITION
    |--------------------------------------------------------------------------
    */

    if (newUserRate >= 70) {
        insights.push({
            priority: 'positive',
            title: 'Strong New-Audience Acquisition',
            message:
                `Approximately ${formatPercent(
                    newUserRate
                )} of tracked user activity is attributable to new visitors/users.`,
            action:
                'Convert more first-time visitors into known or returning audiences through compelling CTAs and lead capture.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SITE DEPTH
    |--------------------------------------------------------------------------
    */

    if (viewsPerSession < 1.5) {
        insights.push({
            priority: 'high',
            title: 'Low Browsing Depth',
            message:
                `The site generates approximately ${formatNumber(
                    viewsPerSession,
                    2
                )} pageviews per session.`,
            action:
                'Strengthen internal linking, related-service modules, navigation and next-step CTAs.',
        });
    } else if (viewsPerSession >= 2.5) {
        insights.push({
            priority: 'positive',
            title: 'Strong Content Depth',
            message:
                `Users view approximately ${formatNumber(
                    viewsPerSession,
                    2
                )} pages per session.`,
            action:
                'Identify common page sequences and formalize them into deliberate conversion journeys.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SESSION FREQUENCY
    |--------------------------------------------------------------------------
    */

    if (sessionsPerUser < 1.2) {
        insights.push({
            priority: 'medium',
            title: 'Limited Visit Frequency',
            message:
                `The current dataset produces approximately ${formatNumber(
                    sessionsPerUser,
                    2
                )} sessions per tracked user.`,
            action:
                'Test stronger retention mechanisms and follow-up content.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DURATION
    |--------------------------------------------------------------------------
    */

    if (averageSessionDuration < 30) {
        insights.push({
            priority: 'high',
            title: 'Short Engagement Window',
            message:
                `Average engagement/session duration is only ${formatDuration(
                    averageSessionDuration
                )}.`,
            action:
                'Improve above-the-fold messaging, page hierarchy, content relevance and speed.',
        });
    } else if (averageSessionDuration >= 90) {
        insights.push({
            priority: 'positive',
            title: 'High Content Consumption',
            message:
                `Average engagement/session duration reaches ${formatDuration(
                    averageSessionDuration
                )}.`,
            action:
                'Use deeper CTAs and content recommendations to capitalize on the attention being generated.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PEAK HOUR
    |--------------------------------------------------------------------------
    */

    if (peakHour) {
        insights.push({
            priority: 'medium',
            title: 'Peak Traffic Window',
            message:
                `The highest traffic hour recorded is approximately ${String(
                    peakHour.hour
                ).padStart(2, '0')}:00 with ${formatNumber(
                    peakHour.sessions
                )} sessions.`,
            action:
                'Schedule high-value content, campaigns and response workflows around peak audience periods.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WEEKLY PATTERN
    |--------------------------------------------------------------------------
    */

    if (weekdayAnalysis.best && weekdayAnalysis.worst) {
        insights.push({
            priority: 'medium',
            title: 'Weekly Traffic Pattern',
            message:
                `${weekdayAnalysis.best.day} has the strongest average daily sessions, while ${weekdayAnalysis.worst.day} is weakest.`,
            action:
                'Use the stronger day for major content launches and the weaker periods for testing or retention campaigns.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | HIGH-BOUNCE PAGES
    |--------------------------------------------------------------------------
    */

    highBouncePages
        .slice(0, 3)
        .forEach(page => {
            if (number(page.bounceRate) >= 60) {
                insights.push({
                    priority: 'high',
                    title: 'High-Risk Content Page',
                    message:
                        `"${escapeText(
                            page.pagePath
                        )}" records a ${formatPercent(
                            page.bounceRate
                        )} bounce rate across ${formatNumber(
                            page.screenPageViews
                        )} pageviews.`,
                    action:
                        'Review the entry experience, message match, loading performance and CTA hierarchy on this page.',
                });
            }
        });

    /*
    |--------------------------------------------------------------------------
    | HIGH ENGAGEMENT PAGES
    |--------------------------------------------------------------------------
    */

    highEngagementPages
        .slice(0, 3)
        .forEach(page => {
            insights.push({
                priority: 'positive',
                title: 'High-Engagement Content',
                message:
                    `"${escapeText(
                        page.pagePath
                    )}" generates an average engagement duration of ${formatDuration(
                        page.averageEngagementTime
                    )}.`,
                action:
                    'Use this page as a model for content structure, internal linking and conversion placement.',
            });
        });

    /*
    |--------------------------------------------------------------------------
    | HIDDEN GEMS
    |--------------------------------------------------------------------------
    */

    hiddenGemPages
        .slice(0, 2)
        .forEach(page => {
            insights.push({
                priority: 'high',
                title: 'Hidden Content Opportunity',
                message:
                    `"${escapeText(
                        page.pagePath
                    )}" shows promising engagement relative to its traffic volume.`,
                action:
                    'Promote this page through internal links, social media, search optimization and related content.',
            });
        });

    /*
    |--------------------------------------------------------------------------
    | PAGE OPPORTUNITY
    |--------------------------------------------------------------------------
    */

    if (strongestPageOpportunity) {
        const score =
            pageQuality.find(
                item =>
                    item.page?.pagePath ===
                    strongestPageOpportunity.pagePath
            )?.score || 0;

        insights.push({
            priority: 'high',
            title: 'Highest-Priority Content Opportunity',
            message:
                `"${escapeText(
                    strongestPageOpportunity.pagePath
                )}" has the strongest combined opportunity profile in the current page dataset.`,
            action:
                `Current derived page-opportunity score: ${formatNumber(
                    score,
                    0
                )}/100. Consider using the page as a conversion or content-growth target.`,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | VOLATILITY
    |--------------------------------------------------------------------------
    */

    if (volatility >= 50) {
        insights.push({
            priority: 'high',
            title: 'High Traffic Volatility',
            message:
                `Daily session variation is approximately ${formatPercent(
                    volatility
                )} relative to the mean.`,
            action:
                'Investigate campaign spikes, social activity, content publishing cycles, tracking changes and unusual referral activity.',
        });
    } else if (volatility < 20) {
        insights.push({
            priority: 'positive',
            title: 'Stable Traffic Base',
            message:
                `Traffic volatility is approximately ${formatPercent(
                    volatility
                )}, indicating relatively predictable daily activity.`,
            action:
                'Use the stable baseline to run controlled growth experiments.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ANOMALIES
    |--------------------------------------------------------------------------
    */

    if (anomalyDays.length) {
        const dates = anomalyDays
            .slice(0, 5)
            .map(item => formatDate(item.date))
            .join(', ');

        insights.push({
            priority: 'high',
            title: 'Traffic Anomalies Detected',
            message:
                `${anomalyDays.length} statistically unusual traffic day(s) were identified. Examples: ${dates}.`,
            action:
                'Cross-reference these dates against campaigns, social posts, referrals, media coverage, technical events and tracking deployments.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | BEST/WORST DAYS
    |--------------------------------------------------------------------------
    */

    if (dailyBest) {
        insights.push({
            priority: 'positive',
            title: 'Strongest Traffic Day',
            message:
                `${formatDate(
                    dailyBest.date
                )} recorded ${formatNumber(
                    dailyBest.sessions
                )} sessions.`,
            action:
                'Determine what content, promotion or external event drove this peak and attempt to reproduce it.',
        });
    }

    if (dailyWorst) {
        insights.push({
            priority: 'medium',
            title: 'Weakest Traffic Day',
            message:
                `${formatDate(
                    dailyWorst.date
                )} recorded ${formatNumber(
                    dailyWorst.sessions
                )} sessions.`,
            action:
                'Compare the day against campaign schedules, publication activity and site availability.',
        });
    }

    /*
    |--------------------------------------------------------------------------
    | REPORT TOTAL
    |--------------------------------------------------------------------------
    */

    insights.push({
        priority: 'medium',
        title: 'Management Interpretation',
        message:
            `The website generated ${formatNumber(
                sessions
            )} sessions and ${formatNumber(
                pageviews
            )} pageviews from approximately ${formatNumber(
                totalUsers
            )} tracked users during the reporting period.`,
        action:
            'Use traffic volume as the top-line KPI, but make engagement, acquisition quality, content performance and conversion behavior the primary optimization layers.',
    });

    return insights;
}

/*
|--------------------------------------------------------------------------
| OPTIONAL REAL AI NARRATIVE
|--------------------------------------------------------------------------
*/

async function generateOpenAIExecutiveNarrative({
    analytics,
    insights,
    reportType,
    periodText,
}) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return null;
    }

    try {
        const payload = {
            reportType,
            period: periodText,

            executiveMetrics: {
                users: analytics.totalUsers,
                newUsers: analytics.newUsers,
                sessions: analytics.sessions,
                pageviews: analytics.pageviews,
                engagementRate: analytics.engagementRate,
                bounceRate: analytics.bounceRate,
                averageEngagementTime:
                    analytics.averageSessionDuration,
                mobileShare: analytics.mobileShare,
                returningRate: analytics.returningRate,
                newUserRate: analytics.newUserRate,
                viewsPerSession: analytics.viewsPerSession,
                sessionsPerUser: analytics.sessionsPerUser,
                trafficTrend: analytics.trend,
            },

            topSource: analytics.topSource,
            topCountry: analytics.topCountry,
            topPage: analytics.topPage,

            highBouncePages:
                analytics.highBouncePages.slice(0, 10),

            highEngagementPages:
                analytics.highEngagementPages.slice(0, 10),

            hiddenGemPages:
                analytics.hiddenGemPages.slice(0, 10),

            topSources:
                analytics.sortedSources.slice(0, 10),

            topCountries:
                analytics.sortedCountries.slice(0, 10),

            topDevices:
                analytics.devices,

            hourly:
                analytics.hourly,

            existingInsights:
                insights.slice(0, 40),
        };

        const response = await fetch(
            'https://api.openai.com/v1/responses',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model:
                        process.env.OPENAI_REPORT_MODEL ||
                        'gpt-5-mini',
                    input: [
                        {
                            role: 'system',
                            content:
                                `You are the senior digital analytics strategist for Dr. JP Ogalo Clinic.

Your job is to interpret website analytics for a clinic executive.

Be rigorous and evidence-based.

Never invent metrics that are not supplied.

Distinguish clearly between:
1. observed facts,
2. calculated metrics,
3. reasonable business interpretation,
4. recommended actions.

Focus on:
- acquisition
- website engagement
- content performance
- audience quality
- mobile experience
- geographic opportunity
- retention
- traffic risks
- anomalies
- conversion readiness
- content strategy
- SEO implications
- digital marketing priorities.

The report should feel like an executive intelligence brief, not generic AI advice.

Return concise but information-dense paragraphs with headings.`,
                        },
                        {
                            role: 'user',
                            content:
                                `Analyze this website analytics dataset:

${JSON.stringify(payload)}`,
                        },
                    ],
                    max_output_tokens: 3000,
                }),
            }
        );

        if (!response.ok) {
            console.warn(
                'OpenAI report generation failed:',
                response.status,
                await response.text()
            );

            return null;
        }

        const json = await response.json();

        return (
            json?.output_text ||
            json?.output
                ?.flatMap(item => item.content || [])
                ?.map(item => item.text || '')
                ?.join('\n') ||
            null
        );
    } catch (error) {
        console.warn(
            'OpenAI narrative unavailable:',
            error.message
        );

        return null;
    }
}

/*
|--------------------------------------------------------------------------
| PDF TEXT HELPERS
|--------------------------------------------------------------------------
*/

function drawWrappedText(
    doc,
    text,
    x,
    y,
    width,
    fontSize = 8.5,
    color = SECONDARY,
    maxLines = 20
) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(
        escapeText(text),
        width
    );

    const visibleLines = lines.slice(0, maxLines);

    doc.text(
        visibleLines,
        x,
        y,
        {
            lineHeightFactor: 1.35,
        }
    );

    return y +
        visibleLines.length *
        fontSize *
        0.3528 *
        1.35;
}

function addInsightCard(doc, insight, y) {
    const messageLines = doc.splitTextToSize(
        escapeText(insight.message || ''),
        CONTENT_WIDTH - 30
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const actionLabel = 'Recommended action:  ';
    const actionLabelWidth = doc.getTextWidth(actionLabel);

    const actionLines = doc.splitTextToSize(
        escapeText(insight.action || ''),
        CONTENT_WIDTH - 14 - actionLabelWidth
    );

    const height = Math.max(
        28,
        12 +
        messageLines.length * 3.8 +
        actionLines.length * 3.8
    );

    y = ensureSpace(
        doc,
        y,
        height + 5
    );

    let accent = ACCENT;

    if (insight.priority === 'critical') {
        accent = DANGER;
    } else if (insight.priority === 'high') {
        accent = WARNING;
    } else if (insight.priority === 'positive') {
        accent = SUCCESS;
    }

    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);

    doc.roundedRect(
        MARGIN,
        y,
        CONTENT_WIDTH,
        height,
        2.5,
        2.5,
        'FD'
    );

    doc.setFillColor(...accent);
    doc.roundedRect(
        MARGIN,
        y,
        3,
        height,
        1,
        1,
        'F'
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...accent);

    doc.text(
        escapeText(insight.title || 'Insight'),
        MARGIN + 7,
        y + 7
    );

    let textY = y + 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...SECONDARY);

    doc.text(
        messageLines,
        MARGIN + 7,
        textY,
        { lineHeightFactor: 1.3 }
    );

    textY +=
        messageLines.length *
        7.8 *
        0.3528 *
        1.3 +
        2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PRIMARY);

    doc.text(
        actionLabel,
        MARGIN + 7,
        textY
    );

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SECONDARY);

    doc.text(
        actionLines,
        MARGIN + 7 + actionLabelWidth,
        textY,
        { lineHeightFactor: 1.3 }
    );

    return y + height + 4;
}

/*
|--------------------------------------------------------------------------
| VECTOR CHARTS
|--------------------------------------------------------------------------
*/

function drawPieChart(
    doc,
    data,
    x,
    y,
    width,
    height,
    title,
    doughnut = false
) {
    const rows = (data || [])
        .filter(item => number(item.value) > 0)
        .slice(0, 8);

    if (!rows.length) {
        return y;
    }

    const cx = x + width * 0.28;
    const cy = y + height * 0.52;

    const radius =
        Math.min(width * 0.23, height * 0.34);

    const total =
        rows.reduce(
            (sum, item) =>
                sum + number(item.value),
            0
        );

    const palette = [
        [99, 102, 241],
        [16, 185, 129],
        [245, 158, 11],
        [236, 72, 153],
        [14, 165, 233],
        [139, 92, 246],
        [239, 68, 68],
        [132, 204, 22],
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);
    doc.text(
        escapeText(title),
        x,
        y + 7
    );

    let start = -Math.PI / 2;

    rows.forEach((row, index) => {
        const value = number(row.value);
        const portion = value / total;
        const end =
            start +
            portion * Math.PI * 2;

        const color =
            palette[index % palette.length];

        const points = [
            {
                x: cx,
                y: cy,
            },
        ];

        const segments = Math.max(
            6,
            Math.ceil(
                Math.abs(end - start) /
                (Math.PI / 18)
            )
        );

        for (let i = 0; i <= segments; i += 1) {
            const angle =
                start +
                (end - start) *
                (i / segments);

            points.push({
                x:
                    cx +
                    Math.cos(angle) *
                    radius,
                y:
                    cy +
                    Math.sin(angle) *
                    radius,
            });
        }

        doc.setFillColor(...color);
        doc.setDrawColor(...WHITE);
        doc.setLineWidth(0.3);

        for (let i = 1; i < points.length - 1; i += 1) {
            const p1 = points[0];
            const p2 = points[i];
            const p3 = points[i + 1];

            // Deltas must be consecutive (p1->p2, then p2->p3), not both
            // measured from p1 - doc.lines() moves the pen cumulatively.
            doc.lines(
                [
                    [p2.x - p1.x, p2.y - p1.y],
                    [p3.x - p2.x, p3.y - p2.y],
                ],
                p1.x,
                p1.y,
                [1, 1],
                'F',
                true
            );
        }

        if (doughnut) {
            doc.setFillColor(...WHITE);

            doc.circle(
                cx,
                cy,
                radius * 0.46,
                'F'
            );
        }

        start = end;
    });

    const legendX = x + width * 0.54;
    let legendY = y + 18;

    rows.forEach((row, index) => {
        const color =
            palette[index % palette.length];

        const share =
            total > 0
                ? (number(row.value) / total) *
                100
                : 0;

        doc.setFillColor(...color);
        doc.rect(
            legendX,
            legendY - 3,
            4,
            4,
            'F'
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...SECONDARY);

        const label =
            `${safeLabel(row.label, 23)} (${formatPercent(
                share
            )})`;

        doc.text(
            label,
            legendX + 7,
            legendY
        );

        legendY += 7;
    });

    return y + height;
}

function drawBarChart(
    doc,
    data,
    x,
    y,
    width,
    height,
    title,
    options = {}
) {
    const rows = (data || [])
        .filter(item => number(item.value) >= 0)
        .slice(0, options.limit || 8);

    if (!rows.length) {
        return y;
    }

    const chartTop = y + 13;
    const chartBottom =
        y + height - 7;
    const chartHeight =
        chartBottom - chartTop;

    const leftPadding = 45;
    const chartLeft =
        x + leftPadding;

    const chartWidth =
        width - leftPadding - 8;

    const maxValue =
        Math.max(
            1,
            ...rows.map(
                item => number(item.value)
            )
        );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);
    doc.text(
        escapeText(title),
        x,
        y + 7
    );

    rows.forEach((row, index) => {
        const rowHeight =
            chartHeight /
            rows.length;

        const barY =
            chartTop +
            index * rowHeight +
            rowHeight * 0.25;

        const barHeight =
            Math.max(
                3,
                rowHeight * 0.5
            );

        const barWidth =
            (number(row.value) / maxValue) *
            chartWidth;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...SECONDARY);

        doc.text(
            safeLabel(row.label, 26),
            x,
            barY + barHeight - 0.5
        );

        doc.setFillColor(...BORDER);

        doc.roundedRect(
            chartLeft,
            barY,
            chartWidth,
            barHeight,
            1,
            1,
            'F'
        );

        doc.setFillColor(
            ...(options.color || ACCENT)
        );

        doc.roundedRect(
            chartLeft,
            barY,
            barWidth,
            barHeight,
            1,
            1,
            'F'
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...PRIMARY);

        doc.text(
            formatNumber(row.value),
            chartLeft + chartWidth + 2,
            barY + barHeight - 0.3
        );
    });

    return y + height;
}

function drawLineChart(
    doc,
    rows,
    x,
    y,
    width,
    height,
    title,
    datasets
) {
    if (!rows?.length) {
        return y;
    }

    const chartTop = y + 13;
    const chartBottom =
        y + height - 12;

    const chartLeft = x + 25;
    const chartRight =
        x + width - 5;

    const chartWidth =
        chartRight - chartLeft;

    const chartHeight =
        chartBottom - chartTop;

    const allValues = [];

    datasets.forEach(dataset => {
        dataset.values.forEach(value => {
            allValues.push(number(value));
        });
    });

    const maxValue =
        Math.max(
            1,
            ...allValues
        );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);

    doc.text(
        escapeText(title),
        x,
        y + 7
    );

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);

    for (let i = 0; i <= 4; i += 1) {
        const gridY =
            chartBottom -
            (chartHeight * i) / 4;

        doc.line(
            chartLeft,
            gridY,
            chartRight,
            gridY
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(...MUTED);

        doc.text(
            formatNumber(
                (maxValue * i) / 4
            ),
            x,
            gridY + 2
        );
    }

    const palette = [
        ACCENT,
        SUCCESS,
        WARNING,
        INFO,
        PURPLE,
    ];

    datasets.forEach(
        (dataset, datasetIndex) => {
            const color =
                dataset.color ||
                palette[
                datasetIndex %
                palette.length
                ];

            const values =
                dataset.values.map(number);

            if (values.length < 1) {
                return;
            }

            for (let i = 1; i < values.length; i += 1) {
                const previousX =
                    chartLeft +
                    ((i - 1) /
                        Math.max(
                            1,
                            values.length - 1
                        )) *
                    chartWidth;

                const currentX =
                    chartLeft +
                    (i /
                        Math.max(
                            1,
                            values.length - 1
                        )) *
                    chartWidth;

                const previousY =
                    chartBottom -
                    (values[i - 1] / maxValue) *
                    chartHeight;

                const currentY =
                    chartBottom -
                    (values[i] / maxValue) *
                    chartHeight;

                doc.setDrawColor(...color);
                doc.setLineWidth(0.7);

                doc.line(
                    previousX,
                    previousY,
                    currentX,
                    currentY
                );
            }
        }
    );

    const legendY =
        y + height - 3;

    let legendX = x;

    datasets.forEach(
        (dataset, index) => {
            const color =
                dataset.color ||
                palette[
                index % palette.length
                ];

            doc.setFillColor(...color);
            doc.rect(
                legendX,
                legendY - 3,
                4,
                4,
                'F'
            );

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.4);
            doc.setTextColor(...SECONDARY);

            doc.text(
                escapeText(dataset.label),
                legendX + 6,
                legendY
            );

            legendX +=
                30 +
                doc.getTextWidth(
                    escapeText(dataset.label)
                );
        }
    );

    return y + height;
}

/*
|--------------------------------------------------------------------------
| SECTION: EXECUTIVE NARRATIVE
|--------------------------------------------------------------------------
*/

function addNarrativeSection(
    doc,
    narrative,
    title,
    y
) {
    if (!narrative) {
        return y;
    }

    y = addSectionTitle(
        doc,
        title,
        y
    );

    const paragraphs =
        String(narrative)
            .split(/\n{2,}/)
            .filter(Boolean);

    for (const paragraph of paragraphs) {
        const wrappedLineCount = doc
            .splitTextToSize(
                escapeText(paragraph),
                CONTENT_WIDTH
            )
            .slice(0, 15).length;

        const requiredHeight =
            wrappedLineCount * 8.2 * 0.3528 * 1.35 + 6;

        y = ensureSpace(
            doc,
            y,
            requiredHeight
        );

        y = drawWrappedText(
            doc,
            paragraph,
            MARGIN,
            y,
            CONTENT_WIDTH,
            8.2,
            SECONDARY,
            15
        );

        y += 5;
    }

    return y + 2;
}

/*
|--------------------------------------------------------------------------
| SECTION: TRENDS
|--------------------------------------------------------------------------
*/

function addTrendCharts(
    doc,
    analytics,
    y
) {
    y = ensureSpace(
        doc,
        y,
        92
    );

    y = addSectionTitle(
        doc,
        'Traffic Trends & Momentum',
        y
    );

    drawLineChart(
        doc,
        analytics.timeSeries,
        MARGIN,
        y,
        CONTENT_WIDTH,
        82,
        'Users, Sessions & Pageviews by Day',
        [
            {
                label: 'Users',
                color: ACCENT,
                values:
                    analytics.timeSeries.map(
                        item =>
                            number(
                                item.activeUsers
                            )
                    ),
            },
            {
                label: 'Sessions',
                color: WARNING,
                values:
                    analytics.timeSeries.map(
                        item =>
                            number(
                                item.sessions
                            )
                    ),
            },
            {
                label: 'Pageviews',
                color: SUCCESS,
                values:
                    analytics.timeSeries.map(
                        item =>
                            number(
                                item.screenPageViews
                            )
                    ),
            },
        ]
    );

    y += 87;

    const trendRows = [
        {
            label: 'First half average users',
            value: analytics.trend.firstAverage,
        },
        {
            label: 'Second half average users',
            value: analytics.trend.secondAverage,
        },
        {
            label: 'Median daily sessions',
            value: analytics.medianDailySessions,
        },
        {
            label: 'Traffic volatility',
            value: analytics.volatility,
        },
    ];

    y = ensureSpace(
        doc,
        y,
        58
    );

    drawBarChart(
        doc,
        trendRows,
        MARGIN,
        y,
        CONTENT_WIDTH,
        52,
        'Derived Traffic Indicators',
        {
            color: INFO,
            limit: 4,
        }
    );

    return y + 58;
}

/*
|--------------------------------------------------------------------------
| SECTION: ACQUISITION
|--------------------------------------------------------------------------
*/

function addAcquisitionCharts(
    doc,
    analytics,
    y
) {
    y = ensureSpace(
        doc,
        y,
        90
    );

    y = addSectionTitle(
        doc,
        'Acquisition & Audience Distribution',
        y
    );

    const chartGap = 6;
    const chartWidth =
        (CONTENT_WIDTH - chartGap) / 2;
    const chartHeight = 70;

    drawPieChart(
        doc,
        analytics.sortedSources
            .slice(0, 8)
            .map(item => ({
                label:
                    item.sessionSource ||
                    'Unknown',
                value:
                    number(item.sessions),
            })),
        MARGIN,
        y,
        chartWidth,
        chartHeight,
        'Traffic Source Mix',
        true
    );

    drawPieChart(
        doc,
        analytics.devices.map(item => ({
            label:
                item.deviceCategory ||
                'Unknown',
            value:
                number(item.sessions),
        })),
        MARGIN +
        chartWidth +
        chartGap,
        y,
        chartWidth,
        chartHeight,
        'Device Mix',
        false
    );

    y += chartHeight + 7;

    y = ensureSpace(
        doc,
        y,
        chartHeight + 8
    );

    drawPieChart(
        doc,
        analytics.users.map(item => ({
            label:
                item.newVsReturning ||
                'Unknown',
            value:
                number(item.sessions),
        })),
        MARGIN,
        y,
        chartWidth,
        chartHeight,
        'New vs Returning Users',
        true
    );

    drawBarChart(
        doc,
        analytics.sortedCountries
            .slice(0, 8)
            .map(item => ({
                label:
                    item.country ||
                    'Unknown',
                value:
                    number(item.sessions),
            })),
        MARGIN +
        chartWidth +
        chartGap,
        y,
        chartWidth,
        chartHeight,
        'Top Countries',
        {
            color: PURPLE,
            limit: 8,
        }
    );

    return y + chartHeight + 8;
}

/*
|--------------------------------------------------------------------------
| SECTION: CONTENT PERFORMANCE
|--------------------------------------------------------------------------
*/

function addContentCharts(
    doc,
    analytics,
    y
) {
    y = ensureSpace(
        doc,
        y,
        100
    );

    y = addSectionTitle(
        doc,
        'Content Performance & Page Intelligence',
        y
    );

    const chartGap = 6;
    const chartWidth =
        (CONTENT_WIDTH - chartGap) / 2;
    const chartHeight = 82;

    drawBarChart(
        doc,
        analytics.sortedPages
            .slice(0, 8)
            .map(item => ({
                label:
                    item.pagePath || '/',
                value:
                    number(
                        item.screenPageViews
                    ),
            })),
        MARGIN,
        y,
        chartWidth,
        chartHeight,
        'Top Pages by Pageviews',
        {
            color: SUCCESS,
            limit: 8,
        }
    );

    drawBarChart(
        doc,
        analytics.highEngagementPages
            .slice(0, 8)
            .map(item => ({
                label:
                    item.pagePath || '/',
                value:
                    number(
                        item.averageEngagementTime
                    ),
            })),
        MARGIN +
        chartWidth +
        chartGap,
        y,
        chartWidth,
        chartHeight,
        'Top Pages by Engagement Time',
        {
            color: INFO,
            limit: 8,
        }
    );

    y += chartHeight + 8;

    y = ensureSpace(
        doc,
        y,
        chartHeight + 8
    );

    drawBarChart(
        doc,
        analytics.highBouncePages
            .slice(0, 8)
            .map(item => ({
                label:
                    item.pagePath || '/',
                value:
                    number(item.bounceRate),
            })),
        MARGIN,
        y,
        chartWidth,
        chartHeight,
        'Highest Bounce Pages',
        {
            color: DANGER,
            limit: 8,
        }
    );

    drawBarChart(
        doc,
        analytics.pageQuality
            .slice()
            .sort(
                (a, b) =>
                    number(b.score) -
                    number(a.score)
            )
            .slice(0, 8)
            .map(item => ({
                label:
                    item.page?.pagePath || '/',
                value:
                    number(item.score),
            })),
        MARGIN +
        chartWidth +
        chartGap,
        y,
        chartWidth,
        chartHeight,
        'Derived Page Quality Score',
        {
            color: ACCENT,
            limit: 8,
        }
    );

    return y + chartHeight + 8;
}

/*
|--------------------------------------------------------------------------
| SECTION: HOURLY + WEEKDAY
|--------------------------------------------------------------------------
*/

function addTimingAnalysis(
    doc,
    analytics,
    y
) {
    y = ensureSpace(
        doc,
        y,
        96
    );

    y = addSectionTitle(
        doc,
        'Timing, Demand Patterns & Publishing Windows',
        y
    );

    drawLineChart(
        doc,
        analytics.hourly.map(item => ({
            ...item,
            date: item.hour,
        })),
        MARGIN,
        y,
        CONTENT_WIDTH,
        62,
        'Sessions by Hour',
        [
            {
                label: 'Sessions',
                color: WARNING,
                values:
                    analytics.hourly.map(
                        item =>
                            number(
                                item.sessions
                            )
                    ),
            },
        ]
    );

    y += 67;

    y = ensureSpace(
        doc,
        y,
        72
    );

    drawBarChart(
        doc,
        analytics.weekdayAnalysis.rows.map(
            item => ({
                label: item.day,
                value: item.averageSessions,
            })
        ),
        MARGIN,
        y,
        CONTENT_WIDTH,
        65,
        'Average Sessions by Day of Week',
        {
            color: INFO,
            limit: 7,
        }
    );

    return y + 72;
}

/*
|--------------------------------------------------------------------------
| SECTION: MANAGEMENT ACTIONS
|--------------------------------------------------------------------------
*/

function addManagementPriorityTable(
    doc,
    insights,
    y
) {
    y = addSectionTitle(
        doc,
        'Management Priorities',
        y
    );

    const priorityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        positive: 3,
    };

    const rows = [...insights]
        .sort(
            (a, b) =>
                (priorityOrder[a.priority] ?? 9) -
                (priorityOrder[b.priority] ?? 9)
        )
        .slice(0, 30)
        .map(insight => [
            escapeText(
                String(
                    insight.priority ||
                    'medium'
                ).toUpperCase()
            ),
            escapeText(
                insight.title
            ),
            escapeText(
                insight.action
            ),
        ]);

    autoTable(doc, {
        startY: y,
        head: [
            [
                'Priority',
                'Finding',
                'Recommended Management Action',
            ],
        ],
        body: rows,
        theme: 'striped',
        margin: {
            left: MARGIN,
            right: MARGIN,
            bottom: 18,
        },
        styles: {
            font: 'helvetica',
            fontSize: 7.2,
            cellPadding: 2.6,
            overflow: 'linebreak',
            valign: 'top',
        },
        headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: LIGHT,
        },
        columnStyles: {
            0: {
                cellWidth: 22,
                fontStyle: 'bold',
            },
            1: {
                cellWidth: 46,
                fontStyle: 'bold',
            },
            2: {
                cellWidth: 100,
            },
        },
    });

    return (
        doc.lastAutoTable?.finalY ||
        y
    ) + 8;
}

/*
|--------------------------------------------------------------------------
| SECTION: RAW DATA
|--------------------------------------------------------------------------
*/

function addRawDatasetTables(
    doc,
    data,
    y
) {
    const addTable = (
        title,
        headers,
        rows,
        columnStyles = {}
    ) => {
        y = addSectionTitle(
            doc,
            title,
            y
        );

        const safeRows = (rows || []).map(
            row =>
                row.map(
                    value =>
                        escapeText(value)
                )
        );

        autoTable(doc, {
            startY: y,
            head: [
                headers.map(
                    escapeText
                ),
            ],
            body: safeRows,
            theme: 'striped',
            margin: {
                left: MARGIN,
                right: MARGIN,
                top: 20,
                bottom: 18,
            },
            styles: {
                font: 'helvetica',
                fontSize: 6.8,
                cellPadding: 2.2,
                valign: 'middle',
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: PRIMARY,
                textColor: WHITE,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: LIGHT,
            },
            columnStyles,
        });

        y =
            (doc.lastAutoTable?.finalY ||
                y) +
            7;

        return y;
    };

    if (data.timeSeries.length) {
        y = addTable(
            'Daily Traffic Dataset',
            [
                'Date',
                'Active Users',
                'New Users',
                'Sessions',
                'Pageviews',
            ],
            data.timeSeries.map(item => [
                formatDate(item.date),
                formatNumber(item.activeUsers),
                formatNumber(item.newUsers),
                formatNumber(item.sessions),
                formatNumber(item.screenPageViews),
            ]),
            {
                0: { cellWidth: 32 },
            }
        );
    }

    if (data.topPages.length) {
        y = addTable(
            'Full Page Performance Dataset',
            [
                'Page',
                'Pageviews',
                'Engagement',
                'Bounce',
                'Sessions',
            ],
            data.topPages.map(item => [
                item.pagePath || '/',
                formatNumber(
                    item.screenPageViews
                ),
                formatDuration(
                    item.averageEngagementTime
                ),
                formatPercent(
                    item.bounceRate
                ),
                formatNumber(
                    item.sessions
                ),
            ]),
            {
                0: { cellWidth: 75 },
                1: { cellWidth: 23 },
                2: { cellWidth: 27 },
                3: { cellWidth: 23 },
                4: { cellWidth: 23 },
            }
        );
    }

    if (data.topCountries.length) {
        y = addTable(
            'Geographic Dataset',
            [
                'Country',
                'Sessions',
                'Users',
                'New Users',
                'Bounce',
            ],
            data.topCountries.map(item => [
                item.country || 'Unknown',
                formatNumber(item.sessions),
                formatNumber(item.activeUsers),
                formatNumber(item.newUsers),
                formatPercent(item.bounceRate),
            ])
        );
    }

    if (data.trafficSources.length) {
        y = addTable(
            'Traffic Acquisition Dataset',
            [
                'Source',
                'Sessions',
                'Active Users',
            ],
            data.trafficSources.map(item => [
                item.sessionSource ||
                'Unknown',
                formatNumber(
                    item.sessions
                ),
                formatNumber(
                    item.activeUsers
                ),
            ]),
            {
                0: { cellWidth: 100 },
            }
        );
    }

    if (data.deviceCategories.length) {
        y = addTable(
            'Device Dataset',
            [
                'Device',
                'Sessions',
                'Active Users',
            ],
            data.deviceCategories.map(item => [
                item.deviceCategory ||
                'Unknown',
                formatNumber(item.sessions),
                formatNumber(
                    item.activeUsers
                ),
            ])
        );
    }

    if (data.userTypes.length) {
        y = addTable(
            'Audience Dataset',
            [
                'User Type',
                'Sessions',
                'Active Users',
            ],
            data.userTypes.map(item => [
                item.newVsReturning ||
                'Unknown',
                formatNumber(item.sessions),
                formatNumber(
                    item.activeUsers
                ),
            ])
        );
    }

    if (data.hourly.length) {
        y = addTable(
            'Hourly Traffic Dataset',
            [
                'Hour',
                'Sessions',
                'Active Users',
            ],
            data.hourly.map(item => [
                `${String(
                    item.hour
                ).padStart(2, '0')}:00`,
                formatNumber(item.sessions),
                formatNumber(
                    item.activeUsers
                ),
            ])
        );
    }

    return y;
}

/*
|--------------------------------------------------------------------------
| SECTION: DATA COVERAGE
|--------------------------------------------------------------------------
*/

function addDataCoverageSection(
    doc,
    analytics,
    y
) {
    y = addSectionTitle(
        doc,
        'Data Coverage & Analytical Scope',
        y
    );

    const rows = [
        [
            'Daily records',
            formatNumber(
                analytics.dataCoverage.dailyRecords
            ),
        ],
        [
            'Page records',
            formatNumber(
                analytics.dataCoverage.pageRecords
            ),
        ],
        [
            'Country records',
            formatNumber(
                analytics.dataCoverage.countryRecords
            ),
        ],
        [
            'Traffic source records',
            formatNumber(
                analytics.dataCoverage.sourceRecords
            ),
        ],
        [
            'Device records',
            formatNumber(
                analytics.dataCoverage.deviceRecords
            ),
        ],
        [
            'User-type records',
            formatNumber(
                analytics.dataCoverage.userTypeRecords
            ),
        ],
        [
            'Hourly records',
            formatNumber(
                analytics.dataCoverage.hourlyRecords
            ),
        ],
        [
            'Calculated insights',
            'Extensive rule-based management analytics',
        ],
    ];

    autoTable(doc, {
        startY: y,
        body: rows,
        theme: 'grid',
        margin: {
            left: MARGIN,
            right: MARGIN,
        },
        styles: {
            font: 'helvetica',
            fontSize: 7.8,
            cellPadding: 3,
        },
        columnStyles: {
            0: {
                fontStyle: 'bold',
                fillColor: LIGHT,
                textColor: PRIMARY,
                cellWidth: 55,
            },
        },
    });

    return (
        doc.lastAutoTable?.finalY ||
        y
    ) + 8;
}

/*
|--------------------------------------------------------------------------
| EMAIL HTML
|--------------------------------------------------------------------------
*/

function htmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function emailBarRows(items, valueKey, labelKey, totalOverride = null, limit = 8) {
    const rows = Array.isArray(items) ? items.slice(0, limit) : [];
    if (!rows.length) {
        return '<div style="padding:14px;color:#64748b;font-size:12px;">No chart data available for this section.</div>';
    }

    const max = Math.max(
        ...rows.map(item => number(item?.[valueKey])),
        1
    );
    const total = totalOverride === null
        ? rows.reduce((sum, item) => sum + number(item?.[valueKey]), 0)
        : Math.max(number(totalOverride), 1);

    return rows.map(item => {
        const label = htmlEscape(item?.[labelKey] || 'Unknown');
        const value = number(item?.[valueKey]);
        const width = clamp((value / max) * 100, 0, 100);
        const share = clamp((value / total) * 100, 0, 100);

        return `
            <tr>
                <td style="padding:6px 0 3px;font-size:11px;color:#334155;width:32%;">${label}</td>
                <td style="padding:6px 8px 3px 10px;">
                    <div style="height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
                        <div style="height:10px;width:${width}%;background:#4f46e5;border-radius:999px;"></div>
                    </div>
                </td>
                <td style="padding:6px 0 3px;text-align:right;font-size:11px;color:#0f172a;font-weight:700;white-space:nowrap;">${formatNumber(value)}</td>
                <td style="padding:6px 0 3px 6px;text-align:right;font-size:10px;color:#64748b;white-space:nowrap;">${formatPercent(share)}</td>
            </tr>
        `;
    }).join('');
}

function emailTrendHTML(timeSeries) {
    const rows = Array.isArray(timeSeries) ? timeSeries.slice(-14) : [];
    if (!rows.length) {
        return '<div style="padding:14px;color:#64748b;font-size:12px;">No daily trend data available.</div>';
    }

    const max = Math.max(...rows.map(item => number(item?.activeUsers)), 1);

    return `
        <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tbody>
                ${rows.map(item => {
        const label = htmlEscape(item?.date || '');
        const users = number(item?.activeUsers);
        const width = clamp((users / max) * 100, 0, 100);
        return `
                        <tr>
                            <td style="padding:3px 6px 3px 0;font-size:10px;color:#64748b;width:72px;">${label}</td>
                            <td style="padding:3px 0;">
                                <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
                                    <div style="height:8px;width:${width}%;background:#0ea5e9;border-radius:999px;"></div>
                                </div>
                            </td>
                            <td style="padding:3px 0 3px 8px;text-align:right;font-size:10px;font-weight:700;color:#0f172a;width:50px;">${formatNumber(users)}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
        <div style="margin-top:8px;font-size:10px;color:#64748b;">Daily active users • last ${rows.length} available days</div>
    `;
}

function buildEmailHTML({
    analytics,
    insights,
    aiNarrative,
    periodText,
}) {
    const priorityColor = {
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#2563eb',
        positive: '#059669',
    };

    const topInsightHTML = insights
        .slice(0, 20)
        .map(insight => {
            const color =
                priorityColor[
                insight.priority
                ] ||
                '#4f46e5';

            return `
                <div style="
                    border:1px solid #e2e8f0;
                    border-left:4px solid ${color};
                    border-radius:10px;
                    padding:14px 16px;
                    margin-bottom:10px;
                    background:#ffffff;
                ">
                    <div style="
                        font-size:12px;
                        font-weight:800;
                        color:${color};
                        text-transform:uppercase;
                        margin-bottom:5px;
                    ">
                        ${htmlEscape(
                insight.priority ||
                'medium'
            )}
                    </div>

                    <div style="
                        font-size:15px;
                        font-weight:700;
                        color:#0f172a;
                        margin-bottom:5px;
                    ">
                        ${htmlEscape(
                insight.title
            )}
                    </div>

                    <div style="
                        font-size:13px;
                        color:#475569;
                        line-height:1.6;
                        margin-bottom:6px;
                    ">
                        ${htmlEscape(
                insight.message
            )}
                    </div>

                    <div style="
                        font-size:12px;
                        color:#334155;
                        line-height:1.5;
                    ">
                        <strong>
                            Recommended action:
                        </strong>
                        ${htmlEscape(
                insight.action
            )}
                    </div>
                </div>
            `;
        })
        .join('');

    const topPagesHTML =
        analytics.sortedPages
            .slice(0, 10)
            .map(
                page => `
                    <tr>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
                            ${htmlEscape(
                    page.pagePath || '/'
                )}
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">
                            ${formatNumber(
                    page.screenPageViews
                )}
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">
                            ${formatDuration(
                    page.averageEngagementTime
                )}
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">
                            ${formatPercent(
                    page.bounceRate
                )}
                        </td>
                    </tr>
                `
            )
            .join('');

    const sourceHTML =
        analytics.sortedSources
            .slice(0, 10)
            .map(
                source => `
                    <tr>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
                            ${htmlEscape(
                    source.sessionSource ||
                    'Unknown'
                )}
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">
                            ${formatNumber(
                    source.sessions
                )}
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">
                            ${formatPercent(
                    pct(
                        source.sessions,
                        analytics.sessions
                    )
                )}
                        </td>
                    </tr>
                `
            )
            .join('');

    const trendChartHTML = emailTrendHTML(analytics.timeSeries);

    const sourceChartHTML = emailBarRows(
        analytics.sortedSources,
        'sessions',
        'sessionSource',
        analytics.sessions,
        8
    );

    const pageChartHTML = emailBarRows(
        analytics.sortedPages,
        'screenPageViews',
        'pagePath',
        analytics.pageviews,
        8
    );

    const countryChartHTML = emailBarRows(
        analytics.sortedCountries,
        'sessions',
        'country',
        analytics.sessions,
        8
    );

    const deviceChartHTML = emailBarRows(
        analytics.devices,
        'sessions',
        'deviceCategory',
        analytics.sessions,
        6
    );

    const userTypeChartHTML = emailBarRows(
        analytics.users,
        'sessions',
        'newVsReturning',
        analytics.sessions,
        4
    );

    const aiNarrativeHTML = aiNarrative
        ? `
            <div style="
                background:#f5f3ff;
                border:1px solid #ddd6fe;
                border-radius:14px;
                padding:18px;
                margin-bottom:24px;
            ">
                <div style="
                    font-size:18px;
                    font-weight:800;
                    color:#312e81;
                    margin-bottom:10px;
                ">
                    AI Executive Interpretation
                </div>

                <div style="
                    font-size:13px;
                    line-height:1.7;
                    color:#334155;
                    white-space:pre-wrap;
                ">
                    ${htmlEscape(aiNarrative)}
                </div>
            </div>
        `
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Dr. JP Ogalo Website Analytics Report</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f8fafc;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
">

<div style="
    max-width:900px;
    margin:0 auto;
    padding:28px 18px;
">

    <div style="
        background:#0f172a;
        border-radius:16px;
        padding:24px;
        color:white;
        margin-bottom:20px;
    ">

        <div style="
            font-size:23px;
            font-weight:800;
        ">
            DR. JP OGALO CLINIC
        </div>

        <div style="
            font-size:14px;
            margin-top:5px;
            color:#cbd5e1;
        ">
            Website Intelligence & Management Analytics
        </div>

        <div style="
            margin-top:18px;
            font-size:13px;
            color:#e2e8f0;
        ">
            ${htmlEscape(periodText)}
        </div>
    </div>

    <div style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:10px;
        margin-bottom:20px;
    ">

        ${[
            ['Users', formatNumber(analytics.totalUsers)],
            ['Sessions', formatNumber(analytics.sessions)],
            ['Pageviews', formatNumber(analytics.pageviews)],
            ['Engagement', formatPercent(analytics.engagementRate)],
            ['Bounce', formatPercent(analytics.bounceRate)],
            ['Returning', formatPercent(analytics.returningRate)],
            ['Mobile', formatPercent(analytics.mobileShare)],
            ['Views / Session', formatNumber(analytics.viewsPerSession, 2)],
        ]
            .map(
                card => `
                    <div style="
                        background:#fff;
                        border:1px solid #e2e8f0;
                        border-radius:10px;
                        padding:12px;
                    ">
                        <div style="
                            font-size:10px;
                            color:#64748b;
                            text-transform:uppercase;
                            font-weight:700;
                        ">
                            ${htmlEscape(card[0])}
                        </div>

                        <div style="
                            font-size:20px;
                            font-weight:800;
                            margin-top:4px;
                        ">
                            ${htmlEscape(card[1])}
                        </div>
                    </div>
                `
            )
            .join('')}

    </div>

    ${aiNarrativeHTML}

    <div style="
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:18px;
        margin-bottom:20px;
    " >
        <div style="font-size:18px;font-weight:800;margin-bottom:12px;">Traffic Trend</div>
        ${trendChartHTML}
    </div>

    <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
            <td style="width:50%;vertical-align:top;padding-right:6px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                    <div style="font-size:17px;font-weight:800;margin-bottom:12px;">Traffic Sources</div>
                    <table role="presentation" style="width:100%;border-collapse:collapse;">${sourceChartHTML}</table>
                </div>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:6px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                    <div style="font-size:17px;font-weight:800;margin-bottom:12px;">Top Pages</div>
                    <table role="presentation" style="width:100%;border-collapse:collapse;">${pageChartHTML}</table>
                </div>
            </td>
        </tr>
    </table>

    <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
            <td style="width:50%;vertical-align:top;padding-right:6px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                    <div style="font-size:17px;font-weight:800;margin-bottom:12px;">Top Countries</div>
                    <table role="presentation" style="width:100%;border-collapse:collapse;">${countryChartHTML}</table>
                </div>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:6px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                    <div style="font-size:17px;font-weight:800;margin-bottom:12px;">Audience Mix</div>
                    <div style="font-size:12px;font-weight:700;color:#475569;margin:0 0 6px;">Devices</div>
                    <table role="presentation" style="width:100%;border-collapse:collapse;">${deviceChartHTML}</table>
                    <div style="font-size:12px;font-weight:700;color:#475569;margin:12px 0 6px;">New vs Returning</div>
                    <table role="presentation" style="width:100%;border-collapse:collapse;">${userTypeChartHTML}</table>
                </div>
            </td>
        </tr>
    </table>

    <div style="
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:18px;
        margin-bottom:20px;
    ">

        <div style="
            font-size:18px;
            font-weight:800;
            margin-bottom:12px;
        ">
            Executive Findings
        </div>

        ${topInsightHTML}

    </div>

    <div style="
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:18px;
        margin-bottom:20px;
    ">

        <div style="
            font-size:18px;
            font-weight:800;
            margin-bottom:12px;
        ">
            Top Pages
        </div>

        <table style="
            width:100%;
            border-collapse:collapse;
            font-size:12px;
        ">
            <thead>
                <tr style="background:#f8fafc;">
                    <th style="padding:8px;text-align:left;">Page</th>
                    <th style="padding:8px;text-align:right;">Views</th>
                    <th style="padding:8px;text-align:right;">Engagement</th>
                    <th style="padding:8px;text-align:right;">Bounce</th>
                </tr>
            </thead>

            <tbody>
                ${topPagesHTML}
            </tbody>
        </table>

    </div>

    <div style="
        background:#fff;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:18px;
        margin-bottom:20px;
    ">

        <div style="
            font-size:18px;
            font-weight:800;
            margin-bottom:12px;
        ">
            Acquisition Sources
        </div>

        <table style="
            width:100%;
            border-collapse:collapse;
            font-size:12px;
        ">

            <thead>
                <tr style="background:#f8fafc;">
                    <th style="padding:8px;text-align:left;">Source</th>
                    <th style="padding:8px;text-align:right;">Sessions</th>
                    <th style="padding:8px;text-align:right;">Share</th>
                </tr>
            </thead>

            <tbody>
                ${sourceHTML}
            </tbody>
        </table>

    </div>

    <div style="
        background:#f1f5f9;
        border-radius:12px;
        padding:14px;
        color:#475569;
        font-size:11px;
        line-height:1.6;
    ">
        This report is generated from the GA4 dataset supplied by the website analytics layer.
        Calculated metrics are derived from the supplied data. No conversion value,
        revenue or patient acquisition figures are assumed unless explicitly supplied
        by the analytics dataset.
    </div>

</div>

</body>
</html>
`;
}

/*
|--------------------------------------------------------------------------
| MAIN HANDLER
|--------------------------------------------------------------------------
*/

export default async function handler(req, res) {
    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    res.setHeader(
        'Access-Control-Allow-Methods',
        'POST, OPTIONS'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Only POST supported',
        });
    }

    const {
        recipients,
        reportData,
        reportType,
        filters,
    } = req.body || {};

    if (
        !Array.isArray(recipients) ||
        recipients.length === 0
    ) {
        return res.status(400).json({
            error: 'No recipients provided',
        });
    }

    if (
        !reportData ||
        typeof reportData !== 'object'
    ) {
        return res.status(400).json({
            error: 'No report data provided',
        });
    }

    try {
        /*
        |--------------------------------------------------------------------------
        | NORMALISE DATA
        |--------------------------------------------------------------------------
        */

        const data =
            normalizeReportData(
                reportData
            );

        /*
        |--------------------------------------------------------------------------
        | PERIOD
        |--------------------------------------------------------------------------
        */

        const periodText =
            filters?.dateFrom &&
                filters?.dateTo
                ? `For the period ${safeDate(
                    filters.dateFrom
                )} to ${safeDate(
                    filters.dateTo
                )}`
                : `For the period ending ${new Date().toLocaleDateString(
                    'en-KE',
                    {
                        timeZone:
                            'Africa/Nairobi',
                    }
                )}`;

        const generatedAt =
            new Date().toLocaleString(
                'en-KE',
                {
                    dateStyle:
                        'medium',
                    timeStyle:
                        'short',
                    timeZone:
                        'Africa/Nairobi',
                }
            );

        /*
        |--------------------------------------------------------------------------
        | CALCULATE EVERYTHING
        |--------------------------------------------------------------------------
        */

        const analytics =
            calculateAnalytics(data);

        const deterministicInsights =
            buildAIInsights(
                analytics
            );

        /*
        |--------------------------------------------------------------------------
        | KEEP CLIENT INSIGHTS TOO
        |--------------------------------------------------------------------------
        */

        const suppliedInsights =
            data.aiInsights.map(
                insight => ({
                    priority:
                        'medium',
                    title:
                        escapeText(
                            insight?.title ||
                            'Existing Analytics Insight'
                        ),
                    message:
                        escapeText(
                            insight?.message ||
                            ''
                        ),
                    action:
                        'Continue monitoring this indicator and compare it with related website metrics.',
                })
            );

        const allInsights = dedupeInsights([
            ...deterministicInsights,
            ...suppliedInsights,
        ]);

        /*
        |--------------------------------------------------------------------------
        | OPTIONAL ACTUAL AI NARRATIVE
        |--------------------------------------------------------------------------
        */

        const aiNarrative =
            await generateOpenAIExecutiveNarrative(
                {
                    analytics,
                    insights:
                        allInsights,
                    reportType,
                    periodText,
                }
            );

        /*
        |--------------------------------------------------------------------------
        | BUILD PDF
        |--------------------------------------------------------------------------
        */

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        /*
        |--------------------------------------------------------------------------
        | PAGE 1
        |--------------------------------------------------------------------------
        */

        addHeader(
            doc,
            reportType,
            periodText,
            generatedAt
        );

        let y = 56;

        y = addKpiDashboard(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | EXECUTIVE AI INTERPRETATION
        |--------------------------------------------------------------------------
        */

        if (aiNarrative) {
            y = addNarrativeSection(
                doc,
                aiNarrative,
                'AI Executive Interpretation',
                y
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MASSIVE AI INSIGHTS
        |--------------------------------------------------------------------------
        */

        y = addSectionTitle(
            doc,
            `AI Analytics & Management Intelligence (${allInsights.length} findings)`,
            y
        );

        const orderedInsights =
            [...allInsights].sort(
                (a, b) => {
                    const priorityOrder = {
                        critical: 0,
                        high: 1,
                        medium: 2,
                        positive: 3,
                    };

                    return (
                        (priorityOrder[
                            a.priority
                        ] ?? 9) -
                        (priorityOrder[
                            b.priority
                        ] ?? 9)
                    );
                }
            );

        for (const insight of orderedInsights) {
            y = addInsightCard(
                doc,
                insight,
                y
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TRAFFIC
        |--------------------------------------------------------------------------
        */

        y = addTrendCharts(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | ACQUISITION
        |--------------------------------------------------------------------------
        */

        y = addAcquisitionCharts(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | CONTENT
        |--------------------------------------------------------------------------
        */

        y = addContentCharts(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | TIMING
        |--------------------------------------------------------------------------
        */

        y = addTimingAnalysis(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | MANAGEMENT PRIORITIES
        |--------------------------------------------------------------------------
        */

        y = addManagementPriorityTable(
            doc,
            orderedInsights,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | DATA COVERAGE
        |--------------------------------------------------------------------------
        */

        y = addDataCoverageSection(
            doc,
            analytics,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | CLIENT-SUPPLIED TABLES
        |--------------------------------------------------------------------------
        */

        if (data.tables.length) {
            y = addSectionTitle(
                doc,
                'Additional Supplied Report Data',
                y
            );

            for (const table of data.tables) {
                const headers =
                    table.headers ||
                    [];

                const rows =
                    table.rows ||
                    [];

                if (!headers.length) {
                    continue;
                }

                autoTable(doc, {
                    startY: y,
                    head: [
                        headers.map(
                            escapeText
                        ),
                    ],
                    body: rows.map(
                        row =>
                            row.map(
                                value =>
                                    escapeText(
                                        value
                                    )
                            )
                    ),
                    theme:
                        'striped',
                    margin: {
                        left:
                            MARGIN,
                        right:
                            MARGIN,
                        top: 18,
                        bottom:
                            18,
                    },
                    styles: {
                        font:
                            'helvetica',
                        fontSize:
                            6.8,
                        cellPadding:
                            2.2,
                        overflow:
                            'linebreak',
                        valign:
                            'middle',
                    },
                    headStyles: {
                        fillColor:
                            PRIMARY,
                        textColor:
                            WHITE,
                    },
                    alternateRowStyles: {
                        fillColor:
                            LIGHT,
                    },
                });

                y =
                    (
                        doc
                            .lastAutoTable
                            ?.finalY ||
                        y
                    ) + 7;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FULL RAW DATASET
        |--------------------------------------------------------------------------
        */

        y = addRawDatasetTables(
            doc,
            data,
            y
        );

        /*
        |--------------------------------------------------------------------------
        | LIMITATIONS
        |--------------------------------------------------------------------------
        */

        y = addSectionTitle(
            doc,
            'Interpretation Notes & Data Limitations',
            y
        );

        const notes = [
            'User, session and pageview totals are interpreted according to the values supplied by the analytics layer.',
            'Derived metrics such as views per session, source share, geographic concentration and traffic volatility are calculated by this report engine.',
            'A high-bounce page is a diagnostic signal, not proof that the page is commercially ineffective.',
            'High engagement does not automatically mean high conversion performance.',
            'The report does not infer revenue, bookings, patient acquisition or clinical outcomes unless those metrics are explicitly available in the supplied dataset.',
            'The AI narrative, when enabled, is instructed to remain within the supplied data and derived calculations.',
            'Conversion optimisation recommendations are therefore directional unless actual conversion events are supplied by GA4.',
        ];

        for (const note of notes) {
            y = ensureSpace(
                doc,
                y,
                9
            );

            doc.setFillColor(
                ...LIGHT
            );

            doc.roundedRect(
                MARGIN,
                y,
                CONTENT_WIDTH,
                7,
                1.5,
                1.5,
                'F'
            );

            doc.setFont(
                'helvetica',
                'normal'
            );

            doc.setFontSize(6.9);

            doc.setTextColor(
                ...SECONDARY
            );

            const lines =
                doc.splitTextToSize(
                    `• ${note}`,
                    CONTENT_WIDTH - 8
                );

            doc.text(
                lines.slice(0, 2),
                MARGIN + 4,
                y + 4,
                {
                    lineHeightFactor:
                        1.2,
                }
            );

            y +=
                Math.max(
                    8,
                    lines.length *
                    3
                );
        }

        /*
        |--------------------------------------------------------------------------
        | FOOTERS
        |--------------------------------------------------------------------------
        */

        addFooter(doc);

        /*
        |--------------------------------------------------------------------------
        | PDF BUFFER
        |--------------------------------------------------------------------------
        */

        const pdfBuffer =
            Buffer.from(
                doc.output(
                    'arraybuffer'
                )
            );

        /*
        |--------------------------------------------------------------------------
        | SMTP
        |--------------------------------------------------------------------------
        */

        const smtpUser =
            process.env.SMTP_USER ||
            'accounts@drjpogalo.co.ke';

        const smtpPass =
            process.env.SMTP_PASS;

        if (
            !process.env.SMTP_HOST ||
            !smtpPass
        ) {
            return res.status(500).json({
                error:
                    'SMTP configuration is incomplete. Set SMTP_HOST and SMTP_PASS.',
            });
        }

        const transporter =
            nodemailer.createTransport(
                {
                    host:
                        process.env
                            .SMTP_HOST,

                    port:
                        Number(
                            process.env
                                .SMTP_PORT ||
                            465
                        ),

                    secure:
                        String(
                            process.env
                                .SMTP_SECURE ||
                            'true'
                        ) ===
                        'true',

                    auth: {
                        user:
                            smtpUser,
                        pass:
                            smtpPass,
                    },
                }
            );

        await transporter.verify();

        /*
        |--------------------------------------------------------------------------
        | EMAIL BODY
        |--------------------------------------------------------------------------
        */

        const emailHTML =
            buildEmailHTML({
                analytics,
                insights:
                    orderedInsights,
                aiNarrative,
                periodText,
            });

        const subject =
            `${reportType || 'Website Analytics Report'} - ${periodText}`;

        /*
        |--------------------------------------------------------------------------
        | SEND EMAIL
        |--------------------------------------------------------------------------
        */

        const info =
            await transporter.sendMail(
                {
                    from:
                        process.env
                            .SMTP_FROM ||
                        `Dr. JP Website Intelligence <${smtpUser}>`,

                    to:
                        recipients.join(
                            ', '
                        ),

                    subject,

                    text:
                        `Dr. JP Ogalo Clinic website analytics report.\n\n${periodText}\n\n` +
                        `Users: ${formatNumber(
                            analytics.totalUsers
                        )}\n` +
                        `Sessions: ${formatNumber(
                            analytics.sessions
                        )}\n` +
                        `Pageviews: ${formatNumber(
                            analytics.pageviews
                        )}\n` +
                        `Engagement: ${formatPercent(
                            analytics.engagementRate
                        )}\n` +
                        `Bounce: ${formatPercent(
                            analytics.bounceRate
                        )}\n` +
                        `Mobile: ${formatPercent(
                            analytics.mobileShare
                        )}\n` +
                        `Returning: ${formatPercent(
                            analytics.returningRate
                        )}\n\n` +
                        `The detailed PDF report is attached.`,

                    html:
                        emailHTML,

                    attachments:
                        [
                            {
                                filename:
                                    `dr-jp-website-intelligence-report-${Date.now()}.pdf`,

                                content:
                                    pdfBuffer,

                                contentType:
                                    'application/pdf',

                                contentDisposition:
                                    'attachment',
                            },
                        ],
                }
            );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            messageId:
                info.messageId,

            analytics: {
                users:
                    analytics.totalUsers,

                newUsers:
                    analytics.newUsers,

                sessions:
                    analytics.sessions,

                pageviews:
                    analytics.pageviews,

                engagementRate:
                    analytics.engagementRate,

                bounceRate:
                    analytics.bounceRate,

                mobileShare:
                    analytics.mobileShare,

                returningRate:
                    analytics.returningRate,

                viewsPerSession:
                    analytics.viewsPerSession,

                trafficTrend:
                    analytics.trend,

                insightsGenerated:
                    orderedInsights.length,

                aiNarrativeGenerated:
                    Boolean(
                        aiNarrative
                    ),

                datasetCoverage:
                    analytics.dataCoverage,
            },
        });
    } catch (error) {
        console.error(
            'send-report error:',
            error
        );

        return res.status(500).json({
            error:
                `Failed to generate/send report: ${error.message}`,
        });
    }
}