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
            if (!res.ok) {
                let errorMessage = `GA fetch failed: ${res.status}`
                try {
                    const errorData = await res.json()
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error
                    }
                    if (errorData && errorData.details) {
                        errorMessage += ` - ${errorData.details}`
                    }
                    if (errorData && errorData.code) {
                        errorMessage += ` (code: ${errorData.code})`
                    }
                } catch (e) {
                    // If response is not JSON, show raw text
                    const text = await res.text()
                    errorMessage += ` - ${text.substring(0, 200)}`
                }
                throw new Error(errorMessage)
            }
            const data = await res.json()
            gaData.value = data
            console.log('✅ GA data loaded:', data)
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