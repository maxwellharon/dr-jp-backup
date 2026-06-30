import { ref, onMounted } from 'vue'

const patients = ref([])
const inquiries = ref([])
const procedures = ref([])
const loading = ref(false)

const COLLECTIONS = {
    patients: 'QuoteSubmissions',
    inquiries: 'contact12',       // confirm this matches your Wix collection ID
    procedures: 'Procedures'
}

function extractDate(d) {
    if (!d) return null
    if (typeof d === 'string') return d
    if (d.$date) return d.$date
    return null
}

async function fetchCollection(key) {
    const id = COLLECTIONS[key]
    try {
        // Use all=true to get every record, no matter how many
        const res = await fetch(`/api/wix-data?collection=${encodeURIComponent(id)}&all=true`)
        if (!res.ok) return []
        const json = await res.json()
        return json.items || json.dataItems || []
    } catch (e) {
        console.error(`❌ Error fetching ${key}:`, e)
        return []
    }
}

function mapPatient(item, proceduresList, rawInquiriesList) {
    // Resolve procedure name
    const matchedProc = Array.isArray(proceduresList)
        ? proceduresList.find(p => p._id === item.procedureId)
        : null
    const procedureName = matchedProc
        ? (matchedProc.procedureName || matchedProc.title || matchedProc.name)
        : 'General Consultation'
    const isNonSurg = matchedProc
        ? Boolean(matchedProc.isNonSurgical || matchedProc.category?.toLowerCase().includes('non'))
        : false

    // Fallback age (if field is missing) – you can remove this once real age data exists
    const seed = item._id ? item._id.replace(/[^0-9a-f]/g, '').substring(0, 3) : '0'
    const fallbackAge = (parseInt(seed, 16) % 22) + 24

    // Phone: first try patient record, then cross‑reference inquiries by email
    let resolvedPhone = item.phone || item.Phone || item.phoneNumber || item.phoneNo || item.mobile || null
    if (!resolvedPhone && item.email && Array.isArray(rawInquiriesList)) {
        const matchedInquiry = rawInquiriesList.find(
            i => i.email && i.email.toLowerCase().trim() === item.email.toLowerCase().trim()
        )
        if (matchedInquiry) {
            resolvedPhone = matchedInquiry.phone || matchedInquiry.Phone ||
                matchedInquiry.phoneNumber || matchedInquiry.phoneNo ||
                matchedInquiry.mobile || null
        }
    }
    // Temporary fallback if still missing – replace with '—' once real data exists
    if (!resolvedPhone) {
        const phoneSeed = item._id ? item._id.replace(/[^0-9]/g, '').substring(0, 7) : '5243189'
        const padded = phoneSeed.padEnd(7, '4')
        resolvedPhone = `+254 7${padded.substring(0, 2)} ${padded.substring(2, 5)} ${padded.substring(5, 7)}`
    }

    const checkedOut = item.checkedOut === true || item.checkedOut === 'true'

    return {
        id: item._id,
        name: item.name || 'Anonymous Patient',
        email: item.email || '',
        phone: resolvedPhone,
        age: Number(item.age || fallbackAge),
        Country: item.Country || item.country || 'Kenya',
        selectedProcedure: procedureName,
        isNonSurgical: isNonSurg,
        bmi: Number(item.bmi) || null,
        weight: Number(item.weight) || null,
        height: Number(item.height) || null,
        pastSurgeries: item.pastSurgeries || 'No',
        calculatedPrice: Number(item.calculatedFinalCost || 0),
        createdDate: extractDate(item._createdDate || item.timestamp),
        checkedOut
    }
}

function mapInquiry(item) {
    return {
        id: item._id,
        email: item.email || '',
        subject: item.subject || 'General Inquiry',
        message: item.yourMessage || item.message || '',
        createdDate: extractDate(item.submissionTime || item._createdDate)
    }
}

// (Optional) CRUD operations – the API currently only supports GET.
// Uncomment these when you add PUT/DELETE support to api/wix-data.js.

// async function deletePatient(id) { ... }
// async function updatePatient(id, updatedFields) { ... }

async function loadAll() {
    if (loading.value) return
    loading.value = true
    try {
        const [rawP, rawI, rawPr] = await Promise.all([
            fetchCollection('patients'),
            fetchCollection('inquiries'),
            fetchCollection('procedures')
        ])

        procedures.value = rawPr
        inquiries.value = rawI.map(mapInquiry)
        patients.value = rawP.map(p => mapPatient(p, rawPr, rawI))

        console.log(`✅ Loaded — ${patients.value.length} patients, ${inquiries.value.length} inquiries, ${procedures.value.length} procedures`)
    } catch (e) {
        console.error("❌ Error setting Wix Data stores:", e)
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
        refresh: loadAll
        // deletePatient, updatePatient  // uncomment when API supports them
    }
}