// src/composables/useGoogleAnalytics.js

import { ref, onMounted, onUnmounted } from 'vue'

const gaData = ref(null)
const loading = ref(false)
const error = ref(null)
const realtimeUsers = ref(0)

let realtimeInterval = null

const fetchData = async (options = {}) => {
    loading.value = true
    error.value = null

    try {
        const params = new URLSearchParams()

        if (options.dateFrom) {
            params.set(
                'dateFrom',
                options.dateFrom
            )
        }

        if (options.dateTo) {
            params.set(
                'dateTo',
                options.dateTo
            )
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : ''

        const res = await fetch(
            `/api/ga-data${query}`,
            {
                headers: {
                    Accept:
                        'application/json'
                },
                cache: 'no-store'
            }
        )

        const text = await res.text()

        let data = null

        try {
            data = text
                ? JSON.parse(text)
                : null
        } catch (parseError) {
            console.error(
                'GA response was not JSON:',
                text.substring(0, 300)
            )

            throw new Error(
                'Google Analytics endpoint returned an invalid response.'
            )
        }

        if (!res.ok) {
            throw new Error(
                data?.error ||
                `GA fetch failed: ${res.status}`
            )
        }

        gaData.value = data

        return data
    } catch (e) {
        console.error(
            'GA fetch error:',
            e
        )

        error.value =
            e?.message ||
            'Failed to load Google Analytics data.'

        return null
    } finally {
        loading.value = false
    }
}

const fetchRealtime = async () => {
    try {
        const res = await fetch(
            '/api/ga-realtime',
            {
                headers: {
                    Accept:
                        'application/json'
                },
                cache: 'no-store'
            }
        )

        if (!res.ok) {
            /*
             * Realtime is supplementary.
             * Do not break the main dashboard if
             * this endpoint is temporarily unavailable.
             */
            realtimeUsers.value = 0
            return 0
        }

        const text = await res.text()

        if (!text) {
            realtimeUsers.value = 0
            return 0
        }

        let data

        try {
            data = JSON.parse(text)
        } catch (error) {
            /*
             * This specifically protects the dashboard
             * from the "// api/ga-realtime..." response
             * you saw earlier.
             */
            console.warn(
                'Realtime endpoint returned non-JSON data.'
            )

            realtimeUsers.value = 0
            return 0
        }

        realtimeUsers.value =
            Number(
                data?.activeUsers
            ) || 0

        return realtimeUsers.value
    } catch (e) {
        console.warn(
            'Realtime fetch error:',
            e?.message || e
        )

        realtimeUsers.value = 0

        return 0
    }
}

const startRealtimePolling = () => {
    if (realtimeInterval) {
        clearInterval(
            realtimeInterval
        )
    }

    fetchRealtime()

    realtimeInterval =
        setInterval(
            fetchRealtime,
            30000
        )
}

const stopRealtimePolling = () => {
    if (realtimeInterval) {
        clearInterval(
            realtimeInterval
        )

        realtimeInterval = null
    }
}

export function useGoogleAnalytics() {
    onMounted(() => {
        if (!gaData.value) {
            fetchData()
        }

        startRealtimePolling()
    })

    onUnmounted(() => {
        stopRealtimePolling()
    })

    return {
        gaData,
        loading,
        error,
        realtimeUsers,
        refresh: fetchData,
        fetchRealtime,
        startRealtimePolling,
        stopRealtimePolling
    }
}