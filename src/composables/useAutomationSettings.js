import { ref } from 'vue'
import { db } from '../firebase/config'
import { collection, doc, setDoc, getDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

const settings = ref(null)
const emailLogs = ref([])
let settingsUnsub = null
let logsUnsub = null

export function useAutomationSettings() {
    // Load settings
    const loadSettings = () => {
        const docRef = doc(db, 'automationSettings', 'global')
        settingsUnsub = onSnapshot(docRef, (snap) => {
            settings.value = snap.exists() ? snap.data() : null
        })
    }

    // Save settings
    const saveSettings = async (newSettings) => {
        const docRef = doc(db, 'automationSettings', 'global')
        await setDoc(docRef, newSettings, { merge: true })
    }

    // Load email logs
    const loadEmailLogs = () => {
        const q = collection(db, 'emailLogs')
        logsUnsub = onSnapshot(q, (snapshot) => {
            emailLogs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        })
    }

    // Log an email
    const logEmail = async (data) => {
        await addDoc(collection(db, 'emailLogs'), {
            ...data,
            sentAt: serverTimestamp(),
        })
    }

    // Clean up
    const cleanup = () => {
        if (settingsUnsub) settingsUnsub()
        if (logsUnsub) logsUnsub()
    }

    return {
        settings,
        emailLogs,
        loadSettings,
        saveSettings,
        loadEmailLogs,
        logEmail,
        cleanup,
    }
}