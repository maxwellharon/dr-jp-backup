import { ref } from 'vue'
import { db } from '../firebase/config'
import { doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore'

const statuses = ref({})

export function usePatientStatus() {
    const loadStatuses = () => {
        const q = collection(db, 'patientStatuses')
        onSnapshot(q, (snapshot) => {
            const map = {}
            snapshot.docs.forEach(doc => {
                map[doc.id] = doc.data().done
            })
            statuses.value = map
        })
    }

    const setDone = async (patientId, done = true) => {
        await setDoc(doc(db, 'patientStatuses', patientId), { done })
    }

    const setActive = async (patientId) => {
        await deleteDoc(doc(db, 'patientStatuses', patientId))
    }

    const toggleStatus = async (patientId, currentDone) => {
        if (currentDone) {
            await setActive(patientId)
        } else {
            await setDone(patientId, true)
        }
    }

    return { statuses, loadStatuses, setDone, setActive, toggleStatus }
}