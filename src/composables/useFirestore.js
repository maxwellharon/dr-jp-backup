import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase/config'
import { collection, onSnapshot } from 'firebase/firestore'

export function useFirestore() {
  const patients = ref([])
  const inquiries = ref([])
  let unsubPatients = null
  let unsubInquiries = null

  const loadCollection = (name, targetRef) => {
    const q = collection(db, name)
    return onSnapshot(q, (snapshot) => {
      targetRef.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  }

  onMounted(() => {
    unsubPatients = loadCollection('patients', patients)
    unsubInquiries = loadCollection('inquiries', inquiries)
  })

  onUnmounted(() => {
    if (unsubPatients) unsubPatients()
    if (unsubInquiries) unsubInquiries()
  })

  // Simple add / delete / bulkUpload (only needed for patients)
  const addPatient = async (data) => {
    const { addDoc } = await import('firebase/firestore')
    await addDoc(collection(db, 'patients'), data)
  }

  const deletePatient = async (id) => {
    const { deleteDoc, doc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'patients', id))
  }

  const bulkUpload = async (records, collectionName = 'patients') => {
    const { writeBatch, doc } = await import('firebase/firestore')
    const batch = writeBatch(db)
    records.forEach(rec => {
      const ref = doc(collection(db, collectionName))
      batch.set(ref, rec)
    })
    await batch.commit()
  }

  return { patients, inquiries, addPatient, deletePatient, bulkUpload }
}