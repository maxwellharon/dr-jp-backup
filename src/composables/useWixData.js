// src/composables/useWixData.js
import { ref, onMounted } from 'vue'

const patients = ref([])
const inquiries = ref([])
const procedures = ref([])
const loading = ref(false)
const error = ref(null)

const COLLECTIONS = {
    patients: 'QuoteSubmissions',
    inquiries: 'contact122',   // adjust if your Wix collection ID is different
    procedures: 'Procedures'
}

/**
 * Fetches ALL items from a collection via the backend proxy.
 * The backend handles Wix cursor pagination when all=true is passed —
 * this function is intentionally simple: one request, backend does the work.
 */
async function fetchAllFromCollection(key) {
    const id = COLLECTIONS[key]
    try {
        const url = `/api/wix-data?collection=${encodeURIComponent(id)}&all=true`
        const res = await fetch(url)

        if (!res.ok) {
            console.error(`❌ ${key} fetch failed (${res.status})`)
            return []
        }

        const json = await res.json()
        const items = json.items || json.dataItems || []
        console.log(`📦 ${key}: ${items.length} items loaded`)
        return items

    } catch (e) {
        console.error(`❌ Error fetching ${key}:`, e)
        return []
    }
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function extractDate(d) {
    if (!d) return null
    if (typeof d === 'string') return d
    if (d.$date) return d.$date
    return null
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapPatient(item, proceduresList) {
    const proc = proceduresList.find(p => p._id === item.procedureId)
    const procedureName = proc
        ? (proc.procedureName || proc.title || proc.name)
        : 'Unknown Procedure'
    const isNonSurgical = proc
        ? Boolean(proc.isNonSurgical || proc.category?.toLowerCase().includes('non'))
        : false

    return {
        id: item._id,
        name: item.name || 'Anonymous',
        email: item.email || '',
        phone: item.phone || item.phoneNumber || item.mobile || '—',
        age: item.age ? Number(item.age) : null,
        Country: item.Country || item.country || 'Kenya',
        selectedProcedure: procedureName,
        isNonSurgical,
        bmi: item.bmi ? Number(item.bmi) : null,
        weight: item.weight ? Number(item.weight) : null,
        height: item.height ? Number(item.height) : null,
        pastSurgeries: item.pastSurgeries || '',
        medicalConditions: item.medicalConditions || '',
        smokeVape: item.smokeVape || '',
        calculatedPrice: item.calculatedFinalCost ? Number(item.calculatedFinalCost) : 0,
        createdDate: extractDate(item.timestamp || item._createdDate)
    }
}

function mapInquiry(item) {
    return {
        id: item._id,
        email: item.email || '',
        subject: item.subject || 'General Inquiry',
        message: item.message || item.yourMessage || '',
        createdDate: extractDate(item.submissionTime || item._createdDate)
    }
}

function mapProcedure(item) {
    return {
        id: item._id,
        procedureName: item.procedureName || item.title || item.name || '',
        category: item.category || '',
        minPrice: Number(item.minPrice) || 0,
        maxPrice: Number(item.maxPrice) || 0,
        description: item.description || ''
    }
}

// ─── Main loader ──────────────────────────────────────────────────────────────

async function loadAll() {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
        const [rawP, rawI, rawPr] = await Promise.all([
            fetchAllFromCollection('patients'),
            fetchAllFromCollection('inquiries'),
            fetchAllFromCollection('procedures')
        ])

        procedures.value = rawPr.map(mapProcedure)
        inquiries.value = rawI.map(mapInquiry)
        patients.value = rawP.map(p => mapPatient(p, procedures.value))

        console.log(
            `✅ Done — ${patients.value.length} patients, ` +
            `${inquiries.value.length} inquiries, ` +
            `${procedures.value.length} procedures`
        )
    } catch (e) {
        console.error('❌ loadAll error:', e)
        error.value = e.message
    } finally {
        loading.value = false
    }
}

// ─── Composable export ────────────────────────────────────────────────────────

export function useWixData() {
    onMounted(() => {
        if (patients.value.length === 0 && inquiries.value.length === 0) {
            loadAll()
        }
    })

    return {
        patients,
        inquiries,
        procedures,
        loading,
        error,
        refresh: loadAll
    }
}



