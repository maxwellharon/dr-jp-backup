import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore'

const statuses = ref({})
let unsubscribe = null

export function usePatientStatus() {
    const clearStatuses = () => {
        statuses.value = {}
    }

    const stopListening = () => {
        if (unsubscribe) {
            unsubscribe()
            unsubscribe = null
        }

        clearStatuses()
    }

    const loadStatuses = () => {
        const userId = auth.currentUser?.uid

        // Always remove any previous listener first.
        if (unsubscribe) {
            unsubscribe()
            unsubscribe = null
        }

        // Prevent statuses from a previous user/session remaining visible.
        clearStatuses()

        if (!userId) return

        const q = collection(
            db,
            'users',
            userId,
            'patientStatuses'
        )

        unsubscribe = onSnapshot(
            q,
            snapshot => {
                const map = {}

                snapshot.docs.forEach(d => {
                    map[d.id] = Boolean(d.data().done)
                })

                statuses.value = map
            },
            error => {
                console.error(
                    'Failed to load patient statuses:',
                    error
                )

                clearStatuses()
            }
        )
    }

    const setDone = async (patientId, done = true) => {
        const userId = auth.currentUser?.uid

        if (!userId) {
            throw new Error('You must be signed in.')
        }

        if (!patientId) {
            throw new Error('Patient ID is required.')
        }

        await setDoc(
            doc(
                db,
                'users',
                userId,
                'patientStatuses',
                String(patientId)
            ),
            {
                done: Boolean(done),
                updatedAt: Date.now()
            }
        )
    }

    const setActive = async patientId => {
        const userId = auth.currentUser?.uid

        if (!userId) {
            throw new Error('You must be signed in.')
        }

        if (!patientId) {
            throw new Error('Patient ID is required.')
        }

        await deleteDoc(
            doc(
                db,
                'users',
                userId,
                'patientStatuses',
                String(patientId)
            )
        )
    }

    const toggleStatus = async (patientId, currentDone) => {
        if (currentDone) {
            await setActive(patientId)
        } else {
            await setDone(patientId, true)
        }
    }

    return {
        statuses,
        loadStatuses,
        setDone,
        setActive,
        toggleStatus,
        stopListening,
        clearStatuses
    }
}