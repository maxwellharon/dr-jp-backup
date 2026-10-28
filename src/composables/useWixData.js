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

/**
 * Fetches ALL items from a collection.
 * The backend handles Wix cursor pagination when all=true is passed.
 */
async function fetchAllFromCollection(key) {
    const id = COLLECTIONS[key]
    try {
        const res = await fetch(`/api/wix-data?collection=${encodeURIComponent(id)}&all=true`)

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

// ─── Field helper ───────────────────────────────────────────────────────────
//
// IMPORTANT WIX GOTCHA: the column header you see in the Wix Content Manager
// (e.g. "Phone", "Age") is the field's display LABEL, not necessarily its
// API field KEY. If a field was renamed after it was created, or was
// auto-generated from an import/form connection, the key the API actually
// returns can be completely different from the label shown in the table
// (e.g. label "Phone" but key "phone_1", "quiz1Field", "field_key_abc123",
// etc). A previous fix here only tried `item.Phone` / `item.phone`, which
// works ONLY if the real key happens to match the label — it still came
// back empty, which means the real key is something else entirely.
//
// This looks up a field by trying an exact-match list of likely key names,
// case-insensitively, against whatever keys the Wix item actually has. It
// also exposes a one-time diagnostic (see loadAll) that logs the real key
// names from a live record to the browser console, so the exact key can be
// read off directly instead of guessed at again.
function getField(item, candidates) {
    for (const name of candidates) {
        if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
            return item[name]
        }
    }
    // Case-insensitive fallback: match any actual key on the item whose
    // name equals one of the candidates ignoring case.
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

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapPatient(item, proceduresList) {
    // ✅ After mapProcedure(), the field is `id` not `_id`
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
        id: item._id,   // ← used by mapPatient's find()
        procedureName: item.procedureName || item.title || item.name || '',
        category: item.category || '',
        isNonSurgical: item.isNonSurgical || false,
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

        // DIAGNOSTIC: if the first record still doesn't resolve phone/age
        // after all the known-variant lookups above, print its real raw
        // keys to the console. Open your browser's DevTools console (F12)
        // after a page load and look for "🔎 RAW WIX FIELD KEYS" — whatever
        // key is holding the phone/age value will be listed there, and that
        // exact spelling can be added to the candidate lists in mapPatient
        // above (and in api/_reportHelpers.js's mapPatient, which must be
        // kept in sync with this file).
        if (rawP.length) {
            const sample = rawP[0]
            const resolvedPhone = getField(sample, ['phone', 'Phone', 'phoneNumber', 'PhoneNumber', 'phone_number', 'mobile', 'Mobile'])
            const resolvedAge = getField(sample, ['age', 'Age', 'patientAge', 'ageYears'])
            if (resolvedPhone === undefined || resolvedAge === undefined) {
                console.warn('🔎 RAW WIX FIELD KEYS (first QuoteSubmissions record):', Object.keys(sample))
                console.warn('🔎 Full first record (check which key actually holds phone/age):', sample)
            }
        }

        // Map procedures FIRST — patients need the resolved list
        procedures.value = rawPr.map(mapProcedure)
        inquiries.value = rawI.map(mapInquiry)
        patients.value = rawP.map(p => mapPatient(p, procedures.value))

        console.log(
            `✅ Done — ${patients.value.length} patients, ` +
            `${inquiries.value.length} inquiries, ` +
            `${procedures.value.length} procedures`
        )

        // Debug: show how many resolved vs unknown
        const unknown = patients.value.filter(p => p.selectedProcedure === 'Unknown Procedure').length
        if (unknown > 0) {
            console.warn(`⚠️ ${unknown} patients still have Unknown Procedure — check procedureId matches in Wix`)
        }

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