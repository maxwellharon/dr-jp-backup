import { ref, onMounted, onUnmounted } from 'vue'

export function useGoogleAnalytics() {
    const gaData = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const realtimeUsers = ref(0)
    let realtimeInterval = null

    const fetchData = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch('/api/ga-data')
            if (!res.ok) {
                const errorData = await res.json().catch(() => null)
                throw new Error(errorData?.error || `GA fetch failed: ${res.status}`)
            }
            const data = await res.json()
            gaData.value = data
        } catch (e) {
            console.error('GA fetch error:', e)
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    const fetchRealtime = async () => {
        try {
            const res = await fetch('/api/ga-realtime')
            if (res.ok) {
                const data = await res.json()
                realtimeUsers.value = Number(data.activeUsers) || 0
            }
        } catch (e) {
            console.error('Realtime fetch error:', e)
        }
    }

    const startRealtimePolling = () => {
        if (realtimeInterval) clearInterval(realtimeInterval)
        fetchRealtime()
        realtimeInterval = setInterval(fetchRealtime, 30000) // every 30 seconds
    }

    onMounted(() => {
        if (!gaData.value) fetchData()
        startRealtimePolling()
    })

    onUnmounted(() => {
        if (realtimeInterval) clearInterval(realtimeInterval)
    })

    return { gaData, loading, error, realtimeUsers, refresh: fetchData, fetchRealtime }
}