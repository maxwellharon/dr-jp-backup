import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase/config'
import { collection, onSnapshot, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'

export function useFirestore() {
  const patients = ref([])
  let unsubscribe = null

  const loadPatients = () => {
    const q = collection(db, 'patients')
    unsubscribe = onSnapshot(q, (snapshot) => {
      patients.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  }

  const addPatient = async (data) => {
    await addDoc(collection(db, 'patients'), data)
  }

  const deletePatient = async (id) => {
    await deleteDoc(doc(db, 'patients', id))
  }

  const bulkUpload = async (records) => {
    const batch = writeBatch(db)
    records.forEach(rec => {
      const ref = doc(collection(db, 'patients'))
      batch.set(ref, rec)
    })
    await batch.commit()
  }

  onMounted(() => {
    loadPatients()
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  return { patients, addPatient, deletePatient, bulkUpload }
}