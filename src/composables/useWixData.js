// src/composables/useWixData.js
import { ref, onMounted } from 'vue'

const patients = ref([])
const inquiries = ref([])
const procedures = ref([])
const loading = ref(false)
const error = ref(null)

const COLLECTIONS = {
    patients: 'QuoteSubmissions',
    inquiries: 'contact122',          // adjust if your Wix collection ID is different
    procedures: 'Procedures'
}

async function fetchCollection(key) {
    const id = COLLECTIONS[key]
    try {
        // Appended &limit=1000 alongside &all=true to explicitly force Wix's 50-item default limit constraint open
        const res = await fetch(`/api/wix-data?collection=${encodeURIComponent(id)}&all=true&limit=1000`)
        if (!res.ok) {
            console.error(`❌ ${key} fetch failed (${res.status})`)
            return []
        }
        const json = await res.json()
        return json.items || json.dataItems || []
    } catch (e) {
        console.error(`❌ Error fetching ${key}:`, e)
        return []
    }
}

function extractDate(d) {
    if (!d) return null
    if (typeof d === 'string') return d
    if (d.$date) return d.$date
    return null
}

function mapPatient(item, proceduresList) {
    // Resolve procedure name from procedureId
    const proc = proceduresList.find(p => p._id === item.procedureId)
    const procedureName = proc ? (proc.procedureName || proc.title || proc.name) : 'Unknown Procedure'
    const isNonSurgical = proc ? Boolean(proc.isNonSurgical || proc.category?.toLowerCase().includes('non')) : false

    return {
        id: item._id,
        name: item.name || 'Anonymous',
        email: item.email || '',
        phone: item.phone || item.phoneNumber || item.mobile || '—',
        age: item.age ? Number(item.age) : null,        // may be missing in your form – leave null
        Country: item.Country || item.country || 'Kenya',
        selectedProcedure: procedureName,
        isNonSurgical: isNonSurgical,
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

// Optional sample data – only used if Wix returns empty
const SAMPLE_PATIENTS = []   // leave empty to rely 100% on live data

async function loadAll() {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
        const [rawP, rawI, rawPr] = await Promise.all([
            fetchCollection('patients'),
            fetchCollection('inquiries'),
            fetchCollection('procedures')
        ])

        procedures.value = rawPr.map(mapProcedure)

        // Map inquiries
        inquiries.value = rawI.length > 0 ? rawI.map(mapInquiry) : []

        // Map patients – pass procedures list to resolve procedureId
        patients.value = rawP.length > 0
            ? rawP.map(p => mapPatient(p, procedures.value))
            : SAMPLE_PATIENTS

        console.log(`✅ Loaded: ${patients.value.length} patients, ${inquiries.value.length} inquiries, ${procedures.value.length} procedures`)
    } catch (e) {
        console.error('❌ Error loading Wix data:', e)
        error.value = e.message
    } finally {
        loading.value = false
    }
}

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