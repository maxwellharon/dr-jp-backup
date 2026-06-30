import { ref } from 'vue'
import { masterData } from '../data/master-data.js'
import { seedCollection } from '../utils/seedData.js'

export function useMasterData() {
  const data = ref(masterData)
  const loading = ref(false)

  const getPatients = () => data.value.patients || []
  const getProcedures = () => data.value.procedures || []
  const getInquiries = () => data.value.inquiries || []
  const getPatientById = (id) => data.value.patients?.find(p => p.id === id) || null

  const seedAllIfNeeded = async () => {
    loading.value = true
    try {
      await seedCollection('patients', getPatients())
      await seedCollection('inquiries', getInquiries())
      console.log('✅ Master data seeded to Firestore')
    } catch (e) {
      console.error('Seeding failed:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    getPatients,
    getProcedures,
    getInquiries,
    getPatientById,
    seedAllIfNeeded
  }
}