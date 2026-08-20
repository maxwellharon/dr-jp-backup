import { ref, onMounted } from 'vue'

// ══════════════════════════════════════════════════════
//  DUMMY GOOGLE ANALYTICS DATA – FOR DEMO ONLY
//  Matches the Wix Analytics highlights provided
// ══════════════════════════════════════════════════════

const dummyGaData = {
    summary: {
        totalUsers: 210,             // Approximate unique users
        newUsers: 120,
        sessions: 256,
        screenPageViews: 350,        // Sum of top pages + others
        averageSessionDuration: 175, // 2m 55s in seconds
        bounceRate: 43.8,
        engagementRate: 56.2,
    },

    // Last 4 days, summing to 256 sessions & 350 pageviews
    timeSeries: [
        { date: '20260811', activeUsers: 50, newUsers: 20, sessions: 55, pageviews: 75 },
        { date: '20260812', activeUsers: 60, newUsers: 30, sessions: 70, pageviews: 90 },
        { date: '20260813', activeUsers: 58, newUsers: 25, sessions: 68, pageviews: 88 },
        { date: '20260814', activeUsers: 62, newUsers: 28, sessions: 63, pageviews: 97 },
    ],

    topPages: [
        { pagePath: '/homepage', pageviews: 137 },
        { pagePath: '/pricing', pageviews: 92 },
        { pagePath: '/aboutp', pageviews: 49 },
        { pagePath: '/get-quote', pageviews: 38 },
        { pagePath: '/blog', pageviews: 24 },
    ],

    topCountries: [
        { country: 'Kenya', sessions: 100 },
        { country: 'United States', sessions: 60 },
        { country: 'United Kingdom', sessions: 40 },
        { country: 'Nigeria', sessions: 30 },
        { country: 'South Africa', sessions: 26 },
    ],

    trafficSources: [
        { source: 'Google (Organic)', sessions: 90 },
        { source: 'Direct', sessions: 72 },
        { source: 'Instagram (Organic)', sessions: 66 },
        { source: 'Referral', sessions: 28 },
    ],

    deviceCategories: [
        { device: 'mobile', sessions: 154 },
        { device: 'desktop', sessions: 77 },
        { device: 'tablet', sessions: 25 },
    ],
}

export function useGoogleAnalytics() {
    const gaData = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const fetchData = () => {
        loading.value = true
        error.value = null

        // Simulate a short loading delay for a polished feel
        setTimeout(() => {
            gaData.value = dummyGaData
            loading.value = false
            console.log('✅ Demo GA data loaded (no API calls)')
        }, 800)
    }

    onMounted(() => {
        if (!gaData.value) fetchData()
    })

    return { gaData, loading, error, refresh: fetchData }
}