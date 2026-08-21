import { ref } from 'vue'
import { db } from '../firebase/config'
import { collection, doc, setDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

const settings = ref(null)
const emailLogs = ref([])
let settingsUnsub = null
let logsUnsub = null

export function useAutomationSettings() {
    const loadSettings = () => {
        const docRef = doc(db, 'automationSettings', 'global')
        settingsUnsub = onSnapshot(docRef, (snap) => {
            settings.value = snap.exists() ? snap.data() : null
        })
    }

    const saveSettings = async (newSettings) => {
        const docRef = doc(db, 'automationSettings', 'global')
        await setDoc(docRef, newSettings, { merge: true })
    }

    const loadEmailLogs = () => {
        const q = collection(db, 'emailLogs')
        logsUnsub = onSnapshot(q, (snapshot) => {
            emailLogs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        })
    }

    const logEmail = async (data) => {
        await addDoc(collection(db, 'emailLogs'), {
            ...data,
            sentAt: serverTimestamp(),
        })
    }

    const sendReportEmail = async (recipients, reportData, reportType, filters) => {
        try {
            const res = await fetch('/api/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients, reportData, reportType, filters }),
            })
            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.error || 'Failed to send email')
            }
            await logEmail({
                recipients,
                reportType,
                filters,
                success: true,
                messageId: result.messageId,
            })
            return { success: true }
        } catch (error) {
            await logEmail({
                recipients,
                reportType,
                filters,
                success: false,
                error: error.message,
            })
            return { success: false, error: error.message }
        }
    }

    const cancelAutomation = async (id) => {
        const docRef = doc(db, 'automationSettings', 'global')
        await setDoc(docRef, { activatedAt: null }, { merge: true })
    }

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
        sendReportEmail,
        cancelAutomation,
        cleanup,
    }
}