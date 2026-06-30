// src/composables/useWixData.js
import { ref, onMounted } from 'vue'

const patients = ref([])
const inquiries = ref([])
const procedures = ref([])
const loading = ref(false)
const error = ref(null)

const COLLECTIONS = {
    patients: 'QuoteSubmissions',
    inquiries: 'contact122',
    procedures: 'Procedures'
}

async function fetchCollection(key) {
    const id = COLLECTIONS[key]
    try {
        const url = `/api/wix-data?collection=${encodeURIComponent(id)}`
        console.log(`📡 Fetching ${key} from: ${url}`)

        const res = await fetch(url)

        if (!res.ok) {
            const errorText = await res.text()
            console.error(`❌ ${key} fetch failed (${res.status}):`, errorText)
            return []
        }

        const json = await res.json()
        console.log(`✅ ${key} response:`, json)

        // Wix returns different structures depending on endpoint
        const items = json.items || json.dataItems || json.data || []
        console.log(`📊 ${key} count: ${items.length}`)

        return items
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

function mapPatient(item) {
    return {
        id: item._id || item.id,
        name: item.name || item.title || 'Anonymous Patient',
        email: item.email || '',
        phone: item.phone || item.phoneNumber || item.mobile || '—',
        age: Number(item.age) || null,
        Country: item.Country || item.country || 'Kenya',
        selectedProcedure: item.selectedProcedure || item.procedure || item.procedureName || 'General Consultation',
        isNonSurgical: Boolean(item.isNonSurgical || item.nonSurgical),
        bmi: Number(item.bmi) || null,
        calculatedPrice: Number(item.calculatedPrice || item.calculatedFinalCost || item.price || 0),
        createdDate: extractDate(item._createdDate || item.createdDate || item.timestamp)
    }
}

function mapInquiry(item) {
    return {
        id: item._id || item.id,
        email: item.email || '',
        subject: item.subject || 'General Inquiry',
        message: item.message || item.yourMessage || '',
        createdDate: extractDate(item._createdDate || item.submissionTime)
    }
}

function mapProcedure(item) {
    return {
        id: item._id || item.id,
        procedureName: item.procedureName || item.title || item.name || '',
        category: item.category || '',
        minPrice: Number(item.minPrice) || 0,
        maxPrice: Number(item.maxPrice) || 0,
        description: item.description || ''
    }
}

// Sample data to show something if Wix is empty
const SAMPLE_PATIENTS = [
    {
        id: 'sample-1',
        name: 'Jane Muthoni',
        email: 'jane@example.com',
        phone: '+254 712 345 678',
        age: 32,
        Country: 'Kenya',
        selectedProcedure: 'Botox',
        isNonSurgical: true,
        bmi: 24,
        calculatedPrice: 15000,
        createdDate: new Date().toISOString()
    },
    {
        id: 'sample-2',
        name: 'David Ochieng',
        email: 'david@example.com',
        phone: '+254 723 987 654',
        age: 45,
        Country: 'Kenya',
        selectedProcedure: 'Liposuction',
        isNonSurgical: false,
        bmi: 28,
        calculatedPrice: 250000,
        createdDate: new Date().toISOString()
    },
    {
        id: 'sample-3',
        name: 'Sarah Wanjiku',
        email: 'sarah@example.com',
        phone: '+254 734 567 890',
        age: 28,
        Country: 'Kenya',
        selectedProcedure: 'Rhinoplasty',
        isNonSurgical: false,
        bmi: 22,
        calculatedPrice: 180000,
        createdDate: new Date().toISOString()
    },
    {
        id: 'sample-4',
        name: 'Peter Kamau',
        email: 'peter@example.com',
        phone: '+254 745 123 456',
        age: 38,
        Country: 'Kenya',
        selectedProcedure: 'Botox',
        isNonSurgical: true,
        bmi: 26,
        calculatedPrice: 12000,
        createdDate: new Date().toISOString()
    },
    {
        id: 'sample-5',
        name: 'Grace Akinyi',
        email: 'grace@example.com',
        phone: '+254 756 789 012',
        age: 52,
        Country: 'Kenya',
        selectedProcedure: 'Facelift',
        isNonSurgical: false,
        bmi: 25,
        calculatedPrice: 350000,
        createdDate: new Date().toISOString()
    }
]

const SAMPLE_INQUIRIES = [
    {
        id: 'inq-1',
        email: 'patient1@example.com',
        subject: 'Consultation Request',
        message: 'I would like to book a consultation for rhinoplasty.',
        createdDate: new Date().toISOString()
    },
    {
        id: 'inq-2',
        email: 'patient2@example.com',
        subject: 'Pricing Question',
        message: 'What is the cost of liposuction?',
        createdDate: new Date().toISOString()
    }
]

const SAMPLE_PROCEDURES = [
    {
        id: 'proc-1',
        procedureName: 'Rhinoplasty',
        category: 'Surgical',
        minPrice: 150000,
        maxPrice: 250000,
        description: 'Nose reshaping surgery'
    },
    {
        id: 'proc-2',
        procedureName: 'Liposuction',
        category: 'Surgical',
        minPrice: 200000,
        maxPrice: 350000,
        description: 'Fat removal procedure'
    },
    {
        id: 'proc-3',
        procedureName: 'Botox',
        category: 'Non-Surgical',
        minPrice: 10000,
        maxPrice: 25000,
        description: 'Wrinkle reduction injections'
    },
    {
        id: 'proc-4',
        procedureName: 'Facelift',
        category: 'Surgical',
        minPrice: 300000,
        maxPrice: 500000,
        description: 'Full facial rejuvenation'
    }
]

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

        // Map the data
        procedures.value = rawPr.length > 0
            ? rawPr.map(mapProcedure)
            : SAMPLE_PROCEDURES

        inquiries.value = rawI.length > 0
            ? rawI.map(mapInquiry)
            : SAMPLE_INQUIRIES

        patients.value = rawP.length > 0
            ? rawP.map(mapPatient)
            : SAMPLE_PATIENTS

        console.log(`✅ Loaded: ${patients.value.length} patients, ${inquiries.value.length} inquiries, ${procedures.value.length} procedures`)

        if (rawP.length === 0) {
            console.warn('⚠️ Using sample data - Wix returned empty results')
        }
    } catch (e) {
        console.error('❌ Error loading Wix data:', e)
        error.value = e.message

        // Fallback to sample data on error
        patients.value = SAMPLE_PATIENTS
        inquiries.value = SAMPLE_INQUIRIES
        procedures.value = SAMPLE_PROCEDURES
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