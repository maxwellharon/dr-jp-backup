import { ref, onMounted } from 'vue'

export function useGoogleAnalytics() {
    const gaData = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const fetchData = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch('/api/ga-data')
            if (!res.ok) throw new Error(`GA fetch failed: ${res.status}`)
            const data = await res.json()
            gaData.value = data
        } catch (e) {
            console.error('GA fetch error:', e)
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    onMounted(() => {
        if (!gaData.value) fetchData()
    })

    return { gaData, loading, error, refresh: fetchData }
}