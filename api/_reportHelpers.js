// api/_reportHelpers.js
//
// Server-side equivalent of what Settings.vue's sendNow() does in the
// browser: pull patient data (via /api/wix-data) and website analytics
// (via /api/ga-data), shape them into the reportData payload that
// /api/send-report expects, and (for automated runs) work out a sensible
// rolling date window since there's no operator sitting at a date picker.
//
// Kept intentionally close to src/composables/useWixData.js and
// src/composables/useReportGeneration.js so scheduled reports look the
// same as manually-sent ones.

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000 // Africa/Nairobi = UTC+3, no DST

export function nairobiNow(date = new Date()) {
    return new Date(date.getTime() + NAIROBI_OFFSET_MS)
}

export function nairobiParts(date = new Date()) {
    const shifted = nairobiNow(date)
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(), // 0-11
        date: shifted.getUTCDate(),
        day: shifted.getUTCDay(), // 0 = Sunday
        hours: shifted.getUTCHours(),
        minutes: shifted.getUTCMinutes(),
        dateKey: shifted.toISOString().slice(0, 10),
    }
}

function toISODate(shiftedUtcDate) {
    return shiftedUtcDate.toISOString().slice(0, 10)
}

// Rolling window ending "yesterday" (Nairobi time), sized to the report's
// frequency. Only used when the automation wasn't configured with explicit
// fixed dates — a fixed date range would otherwise repeat the same stale
// data on every scheduled send.
export function rollingRange(frequency, now = new Date()) {
    const shifted = nairobiNow(now)
    const end = new Date(shifted)
    end.setUTCDate(end.getUTCDate() - 1)

    const start = new Date(end)
    if (frequency === 'weekly') start.setUTCDate(start.getUTCDate() - 6)
    else if (frequency === 'monthly') start.setUTCDate(start.getUTCDate() - 29)
    // daily: start === end

    return { dateFrom: toISODate(start), dateTo: toISODate(end) }
}

export function resolveBaseUrl() {
    if (process.env.PUBLIC_APP_URL) {
        return process.env.PUBLIC_APP_URL.replace(/\/$/, '')
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }
    throw new Error(
        'Unable to determine the site URL for internal API calls. ' +
        'Set PUBLIC_APP_URL in your Vercel environment variables.'
    )
}

/* ------------------------------------------------------------------ */
/* Patient data (Wix)                                                 */
/* ------------------------------------------------------------------ */

const WIX_COLLECTIONS = {
    patients: 'QuoteSubmissions',
    procedures: 'Procedures',
}

async function fetchWixCollection(baseUrl, key) {
    const id = WIX_COLLECTIONS[key]
    const res = await fetch(
        `${baseUrl}/api/wix-data?collection=${encodeURIComponent(id)}&all=true`
    )
    if (!res.ok) {
        throw new Error(`Failed to fetch ${key} from Wix (${res.status})`)
    }
    const json = await res.json()
    return json.items || json.dataItems || []
}

function extractDate(d) {
    if (!d) return null
    if (typeof d === 'string') return d
    if (d.$date) return d.$date
    return null
}

// Kept identical to getField() in src/composables/useWixData.js — see the
// comment there for why this is needed (Wix's displayed column label can
// differ from the actual API field key, and this collection also mixes
// casings). If you change the candidate lists in one file, change them in
// the other too.
function getField(item, candidates) {
    for (const name of candidates) {
        if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
            return item[name]
        }
    }
    const lowerCandidates = candidates.map(c => c.toLowerCase())
    for (const key of Object.keys(item)) {
        if (lowerCandidates.includes(key.toLowerCase())) {
            const value = item[key]
            if (value !== undefined && value !== null && value !== '') {
                return value
            }
        }
    }
    return undefined
}

function mapProcedure(item) {
    return {
        id: item._id,
        procedureName: item.procedureName || item.title || item.name || '',
        category: item.category || '',
        isNonSurgical: item.isNonSurgical || false,
        minPrice: Number(item.minPrice) || 0,
        maxPrice: Number(item.maxPrice) || 0,
        description: item.description || '',
    }
}

function mapPatient(item, proceduresList) {
    const proc = proceduresList.find(p => p.id === item.procedureId)
    const procedureName = proc
        ? (proc.procedureName || proc.title || proc.name || 'Unknown Procedure')
        : 'Unknown Procedure'
    const isNonSurgical = proc
        ? Boolean(proc.isNonSurgical || proc.category?.toLowerCase().includes('non'))
        : false

    const rawPhone = getField(item, [
        'phone', 'Phone', 'phoneNumber', 'PhoneNumber', 'phone_number',
        'mobile', 'Mobile', 'mobileNumber', 'contactNumber', 'contact'
    ])

    const rawAge = getField(item, ['age', 'Age', 'patientAge', 'ageYears'])

    const rawCountry = getField(item, ['Country', 'country', 'origin', 'originCountry', 'location'])

    return {
        id: item._id,
        name: item.name || 'Anonymous',
        email: item.email || '',
        phone: rawPhone || '—',
        age: rawAge !== undefined ? Number(rawAge) : null,
        Country: rawCountry || 'Kenya',
        selectedProcedure: procedureName,
        isNonSurgical,
        bmi: item.bmi ? Number(item.bmi) : null,
        weight: item.weight ? Number(item.weight) : null,
        height: item.height ? Number(item.height) : null,
        pastSurgeries: item.pastSurgeries || '',
        calculatedPrice: item.calculatedFinalCost ? Number(item.calculatedFinalCost) : 0,
        createdDate: extractDate(item.timestamp || item._createdDate),
    }
}

async function loadPatients(baseUrl) {
    const [rawPatients, rawProcedures] = await Promise.all([
        fetchWixCollection(baseUrl, 'patients'),
        fetchWixCollection(baseUrl, 'procedures'),
    ])
    const procedures = rawProcedures.map(mapProcedure)
    return rawPatients.map(p => mapPatient(p, procedures))
}

// Same filtering + shaping as useReportGeneration.js's generateReportData
function filterPatients(patients, filters = {}) {
    let data = [...patients]

    if (filters.dateFrom) {
        const from = new Date(filters.dateFrom)
        from.setHours(0, 0, 0, 0)
        data = data.filter(p => {
            if (!p.createdDate) return false
            const created = new Date(p.createdDate)
            return !Number.isNaN(created.getTime()) && created >= from
        })
    }

    if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23, 59, 59, 999)
        data = data.filter(p => {
            if (!p.createdDate) return false
            const created = new Date(p.createdDate)
            return !Number.isNaN(created.getTime()) && created <= to
        })
    }

    if (filters.procedure) {
        data = data.filter(
            p => String(p.selectedProcedure || '').trim() === String(filters.procedure).trim()
        )
    }

    if (filters.country) {
        data = data.filter(
            p => String(p.Country || '').trim() === String(filters.country).trim()
        )
    }

    return data.map(p => ({
        id: p.id,
        name: p.name || 'Anonymous',
        email: p.email || '',
        phone: p.phone || '',
        age: p.age || '',
        country: p.Country || '',
        procedure: p.selectedProcedure || '—',
        price: Number(p.calculatedPrice) || 0,
        isNonSurgical: p.isNonSurgical === true,
        bmi: p.bmi || '',
        weight: p.weight || '',
        height: p.height || '',
        pastSurgeries: p.pastSurgeries || '',
        createdDate: p.createdDate || '',
    }))
}

// Same math as useReportGeneration.js's generateDetailedInsights
function detailedInsights(data = []) {
    if (!Array.isArray(data) || !data.length) return null

    const total = data.length
    const ages = data.map(p => Number(p.age)).filter(a => Number.isFinite(a) && a > 0 && a < 120)
    const avgAge = ages.length ? Number((ages.reduce((s, v) => s + v, 0) / ages.length).toFixed(1)) : 0

    const nonSurgCount = data.filter(p => p.isNonSurgical === true).length
    const nonSurgPercent = total ? Number(((nonSurgCount / total) * 100).toFixed(1)) : 0

    const totalValue = data.reduce((s, p) => s + (Number.isFinite(Number(p.price)) ? Number(p.price) : 0), 0)
    const avgValue = total ? Number((totalValue / total).toFixed(1)) : 0

    const bmis = data.map(p => Number(p.bmi)).filter(b => Number.isFinite(b) && b > 10 && b < 90)
    const avgBmi = bmis.length ? Number((bmis.reduce((s, v) => s + v, 0) / bmis.length).toFixed(1)) : 0
    const highBmiCount = data.filter(p => {
        const bmi = Number(p.bmi)
        return Number.isFinite(bmi) && bmi >= 30 && bmi <= 90
    }).length

    const pastSurgCount = data.filter(p => {
        const value = String(p.pastSurgeries || '').trim().toLowerCase()
        if (!value) return false
        if (['no', 'false', 'none', 'no previous surgery'].includes(value)) return false
        return value.includes('yes') || value.includes('surgery') || value.includes('surgeries') || value.length > 0
    }).length

    const procMap = new Map()
    const procValueMap = new Map()
    data.forEach(p => {
        const procedure = p.procedure || 'Unknown'
        procMap.set(procedure, (procMap.get(procedure) || 0) + 1)
        const price = Number(p.price)
        if (Number.isFinite(price) && price > 0) {
            const entry = procValueMap.get(procedure) || { total: 0, count: 0 }
            entry.total += price
            entry.count += 1
            procValueMap.set(procedure, entry)
        }
    })
    const allProcedures = [...procMap.entries()].sort((a, b) => b[1] - a[1])
    const topProcs = allProcedures.slice(0, 5)
    const procedureValueBreakdown = [...procValueMap.entries()]
        .map(([procedure, { total, count }]) => ({
            procedure,
            avgValue: Number((total / count).toFixed(1)),
            totalValue: Number(total.toFixed(1)),
            count,
        }))
        .sort((a, b) => b.avgValue - a.avgValue)

    const mostRequested = topProcs[0]?.[0] || 'N/A'
    const mostRequestedCount = topProcs[0]?.[1] || 0

    const countryMap = new Map()
    data.forEach(p => {
        const country = p.country || 'Unknown'
        countryMap.set(country, (countryMap.get(country) || 0) + 1)
    })
    const topCountries = [...countryMap.entries()].sort((a, b) => b[1] - a[1])

    const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 }
    ages.forEach(age => {
        if (age >= 18 && age <= 25) ageGroups['18-25']++
        else if (age >= 26 && age <= 35) ageGroups['26-35']++
        else if (age >= 36 && age <= 50) ageGroups['36-50']++
        else if (age > 50) ageGroups['51+']++
    })

    const bmiCategories = {
        'Underweight (<18.5)': 0,
        'Normal (18.5–24.9)': 0,
        'Overweight (25–29.9)': 0,
        'Obese (30+)': 0,
    }
    bmis.forEach(bmi => {
        if (bmi < 18.5) bmiCategories['Underweight (<18.5)']++
        else if (bmi < 25) bmiCategories['Normal (18.5–24.9)']++
        else if (bmi < 30) bmiCategories['Overweight (25–29.9)']++
        else bmiCategories['Obese (30+)']++
    })

    const monthly = new Map()
    data.forEach(p => {
        if (!p.createdDate) return
        const date = new Date(p.createdDate)
        if (Number.isNaN(date.getTime())) return
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthly.set(key, (monthly.get(key) || 0) + 1)
    })
    const monthlyTrend = [...monthly.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    const weights = data.map(p => Number(p.weight)).filter(w => Number.isFinite(w) && w > 0 && w < 500)
    const avgWeight = weights.length ? Number((weights.reduce((s, v) => s + v, 0) / weights.length).toFixed(1)) : 0

    const heights = data.map(p => Number(p.height)).filter(h => Number.isFinite(h) && h > 0 && h < 300)
    const avgHeight = heights.length ? Number((heights.reduce((s, v) => s + v, 0) / heights.length).toFixed(1)) : 0

    const ageGroupEntries = Object.entries(ageGroups).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
    const dominantAgeGroup = ageGroupEntries[0]?.[0] || 'N/A'
    const dominantCountry = topCountries[0]?.[0] || 'N/A'
    const dominantCountryCount = topCountries[0]?.[1] || 0

    return {
        total, avgAge, nonSurgCount, nonSurgPercent,
        totalValue: Number(totalValue.toFixed(1)), avgValue,
        avgBmi, highBmiCount, bmiCategories, pastSurgCount,
        mostRequested, mostRequestedCount,
        topProcedures: topProcs, allProcedures, procedureValueBreakdown,
        countryDistribution: topCountries, dominantCountry, dominantCountryCount,
        ageGroups, dominantAgeGroup,
        monthlyTrend, avgWeight, avgHeight,
    }
}

/* ------------------------------------------------------------------ */
/* Website data (GA4)                                                 */
/* ------------------------------------------------------------------ */

async function fetchGaData(baseUrl, dateFrom, dateTo) {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const query = params.toString() ? `?${params.toString()}` : ''

    const res = await fetch(`${baseUrl}/api/ga-data${query}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
        throw new Error(data?.error || `GA fetch failed: ${res.status}`)
    }
    return data
}

/* ------------------------------------------------------------------ */
/* Full reportData assembly — mirrors Settings.vue's sendNow()        */
/* ------------------------------------------------------------------ */

export async function buildReportData(settings, baseUrl) {
    const frequency = settings.frequency || 'weekly'
    const dataType = settings.dataType || 'both'

    const reportData = {
        summary: {},
        patientAnalytics: null,
        timeSeries: [],
        topPages: [],
        topCountries: [],
        trafficSources: [],
        deviceCategories: [],
        userTypes: [],
        hourly: [],
        tables: [],
        aiInsights: [],
        images: [],
    }

    /* PATIENT SIDE */
    if (dataType !== 'web') {
        const patientRange = (settings.patientDateFrom || settings.patientDateTo)
            ? { dateFrom: settings.patientDateFrom || '', dateTo: settings.patientDateTo || '' }
            : rollingRange(frequency)

        const allPatients = await loadPatients(baseUrl)
        const patientData = filterPatients(allPatients, {
            dateFrom: patientRange.dateFrom,
            dateTo: patientRange.dateTo,
            procedure: settings.procedureFilter === 'all' ? '' : settings.procedureFilter,
            country: settings.countryFilter || '',
        })

        const insights = detailedInsights(patientData)

        if (insights) {
            reportData.summary = {
                totalPatients: patientData.length,
                avgAge: insights.avgAge,
                avgBmi: insights.avgBmi,
                nonSurgicalPercent: insights.nonSurgPercent,
                totalQuotedValue: insights.totalValue,
                avgQuoteValue: insights.avgValue,
                highBmiCount: insights.highBmiCount,
                priorSurgeryCount: insights.pastSurgCount,
                avgWeight: insights.avgWeight,
                avgHeight: insights.avgHeight,
            }

            reportData.patientAnalytics = {
                total: insights.total,
                avgAge: insights.avgAge,
                avgBmi: insights.avgBmi,
                avgWeight: insights.avgWeight,
                avgHeight: insights.avgHeight,
                nonSurgCount: insights.nonSurgCount,
                nonSurgPercent: insights.nonSurgPercent,
                totalValue: insights.totalValue,
                avgValue: insights.avgValue,
                highBmiCount: insights.highBmiCount,
                bmiCategories: insights.bmiCategories,
                pastSurgCount: insights.pastSurgCount,
                procedures: insights.allProcedures,
                procedureValueBreakdown: insights.procedureValueBreakdown,
                countries: insights.countryDistribution,
                ageGroups: insights.ageGroups,
                monthlyTrend: insights.monthlyTrend,
            }

            reportData.aiInsights.push(
                {
                    type: 'patient',
                    title: 'Procedure demand',
                    message: `${insights.mostRequested} is the leading request at ${insights.mostRequestedCount} of ${insights.total} records.`,
                    action: 'Align service capacity, content and lead follow-up around the strongest demand.',
                },
                {
                    type: 'patient',
                    title: 'Age mix',
                    message: `Average patient age is ${insights.avgAge} years. ${insights.dominantAgeGroup} is the largest identifiable age segment.`,
                    action: 'Use the strongest demographic segment when prioritizing creative and campaign messaging.',
                },
                {
                    type: 'patient',
                    title: 'Non-surgical demand',
                    message: `${insights.nonSurgPercent}% of records are non-surgical.`,
                    action: 'Consider using non-surgical treatments as lower-friction entry points into the clinic.',
                },
                {
                    type: 'patient',
                    title: 'Geographic footprint',
                    message: `${insights.dominantCountry} accounts for ${insights.dominantCountryCount} of the captured records.`,
                    action: 'Prioritize localization, targeting and follow-up around the strongest geographic market.',
                },
                {
                    type: 'patient',
                    title: 'BMI profile',
                    message: `${insights.highBmiCount} records have a BMI of 30 or higher.`,
                    action: 'Use this as a screening and clinical workflow signal rather than a standalone eligibility decision.',
                },
                {
                    type: 'patient',
                    title: 'Commercial value',
                    message: `Average quoted value across the filtered cohort is KES ${Number(insights.avgValue).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}.`,
                    action: 'Track quoted value alongside lead volume to identify commercially meaningful demand.',
                }
            )
        }

        if (settings.includePatientData) {
            reportData.tables.push({
                title: 'Patient Records',
                headers: ['Name', 'Procedure', 'Age', 'Country', 'BMI', 'Price'],
                rows: patientData.slice(0, 100).map(p => [p.name, p.procedure, p.age, p.country, p.bmi, p.price]),
            })
        }
    }

    /* WEBSITE SIDE */
    if (dataType !== 'patient') {
        const webRange = (settings.webDateFrom || settings.webDateTo)
            ? { dateFrom: settings.webDateFrom || '', dateTo: settings.webDateTo || '' }
            : rollingRange(frequency)

        const gaData = await fetchGaData(baseUrl, webRange.dateFrom, webRange.dateTo)
        const summary = gaData.summary || {}

        reportData.timeSeries = Array.isArray(gaData.timeSeries) ? gaData.timeSeries : []
        reportData.topPages = Array.isArray(gaData.topPages) ? gaData.topPages : []
        reportData.topCountries = Array.isArray(gaData.topCountries) ? gaData.topCountries : []
        reportData.trafficSources = Array.isArray(gaData.trafficSources) ? gaData.trafficSources : []
        reportData.deviceCategories = Array.isArray(gaData.deviceCategories) ? gaData.deviceCategories : []
        reportData.userTypes = Array.isArray(gaData.userTypes) ? gaData.userTypes : []
        reportData.hourly = Array.isArray(gaData.hourly) ? gaData.hourly : []

        reportData.summary = {
            ...reportData.summary,
            totalUsers: Number(summary.totalUsers || 0),
            sessions: Number(summary.sessions || 0),
            pageViews: Number(summary.screenPageViews || 0),
            bounceRate: Number(Number(summary.bounceRate || 0).toFixed(1)),
            engagementRate: Number(Number(summary.engagementRate || 0).toFixed(1)),
        }

        const trafficSource = gaData.trafficSources?.[0]?.sessionSource || 'Direct'
        const bestPage = gaData.topPages?.[0]?.pagePath || '/'
        const mobileSessions = gaData.deviceCategories?.find(d => d.deviceCategory === 'mobile')?.sessions || 0
        const mobilePercent = ((100 * Number(mobileSessions)) / Math.max(1, Number(summary.sessions || 0))).toFixed(1)

        reportData.aiInsights.push(
            {
                type: 'web',
                title: 'Web acquisition',
                message: `${trafficSource} is currently the leading traffic source.`,
                action: 'Maintain the strongest acquisition channel while gradually diversifying dependency.',
            },
            {
                type: 'web',
                title: 'Best page',
                message: `"${bestPage}" is the most visited page in the available dataset.`,
                action: 'Prioritize CTA clarity, lead capture and content quality on this page.',
            },
            {
                type: 'web',
                title: 'Mobile',
                message: `Mobile contributes ${mobilePercent}% of sessions.`,
                action: 'Treat mobile conversion quality as a primary website KPI.',
            },
            {
                type: 'web',
                title: 'Engagement health',
                message: `The current bounce rate is ${Number(summary.bounceRate || 0).toFixed(1)}%.`,
                action: Number(summary.bounceRate || 0) > 50
                    ? 'Review landing-page relevance, page speed and content alignment.'
                    : 'Continue monitoring while improving pages with the highest drop-off.',
            }
        )

        reportData.tables.push({
            title: 'Top Pages',
            headers: ['Page', 'Views', 'Sessions', 'Bounce'],
            rows: (gaData.topPages || []).map(p => [p.pagePath, p.screenPageViews, p.sessions, `${Number(p.bounceRate || 0).toFixed(1)}%`]),
        })

        reportData.tables.push({
            title: 'Traffic Sources',
            headers: ['Source', 'Sessions', 'Active Users'],
            rows: (gaData.trafficSources || []).map(s => [s.sessionSource, s.sessions, s.activeUsers]),
        })
    }

    const reportType = dataType === 'both'
        ? 'Patient & Web Report'
        : dataType === 'web'
            ? 'Web Analytics Report'
            : 'Patient Report'

    const dateFrom = settings.patientDateFrom || settings.webDateFrom || ''
    const dateTo = settings.patientDateTo || settings.webDateTo || ''

    return { reportData, reportType, filters: { dateFrom, dateTo } }
}