import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import {
    collection,
    doc,
    addDoc,
    setDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    deleteDoc,
} from 'firebase/firestore'

const settings = ref(null)
const emailLogs = ref([])
const mailingLists = ref([])
let settingsUnsub = null
let logsUnsub = null
let mailingUnsub = null

const uid = () => auth.currentUser?.uid || null
const userSettingsRef = () => {
    const userId = uid()
    return userId ? doc(db, 'users', userId, 'settings', 'automation') : null
}
const logsRef = () => {
    const userId = uid()
    return userId ? collection(db, 'users', userId, 'emailLogs') : null
}
const listsRef = () => {
    const userId = uid()
    return userId ? collection(db, 'users', userId, 'mailingLists') : null
}

export function useAutomationSettings() {
    const loadSettings = () => {
        const ref = userSettingsRef()
        if (!ref) return
        settingsUnsub?.()
        settingsUnsub = onSnapshot(ref, snap => { settings.value = snap.exists() ? snap.data() : null })
    }

    const saveSettings = async (newSettings) => {
        const ref = userSettingsRef()
        if (!ref) throw new Error('You must be signed in to save settings.')
        await setDoc(ref, { ...newSettings, updatedAt: serverTimestamp(), ownerUid: uid() }, { merge: true })
        return true
    }

    const loadEmailLogs = () => {
        const ref = logsRef()
        if (!ref) return
        logsUnsub?.()
        const q = query(ref, orderBy('sentAt', 'desc'))
        logsUnsub = onSnapshot(q, snap => {
            emailLogs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        })
    }

    const logEmail = async (data) => {
        const ref = logsRef()
        if (!ref) return
        await addDoc(ref, { ...data, ownerUid: uid(), sentAt: serverTimestamp() })
    }

    const saveMailingList = async (name, recipients) => {
        const ref = listsRef()
        if (!ref) throw new Error('You must be signed in to save mailing lists.')
        const clean = [...new Set((recipients || []).map(v => String(v).trim()).filter(Boolean))]
        if (!name?.trim()) throw new Error('Mailing list name is required.')
        await addDoc(ref, { name: name.trim(), recipients: clean, ownerUid: uid(), updatedAt: serverTimestamp() })
    }

    const loadMailingLists = () => {
        const ref = listsRef()
        if (!ref) return
        mailingUnsub?.()
        const q = query(ref, orderBy('updatedAt', 'desc'))
        mailingUnsub = onSnapshot(q, snap => {
            mailingLists.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        })
    }

    const deleteMailingList = async (id) => {
        const ref = listsRef()
        if (!ref || !id) return
        await deleteDoc(doc(ref, id))
    }

    const sendReportEmail = async (recipients, reportData, reportType, filters) => {
        try {
            const res = await fetch('/api/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients, reportData, reportType, filters }),
            })
            const result = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(result.error || 'Failed to send email')
            await logEmail({ recipients, reportType, filters, success: true, messageId: result.messageId })
            return { success: true, messageId: result.messageId }
        } catch (error) {
            await logEmail({ recipients, reportType, filters, success: false, error: error.message })
            return { success: false, error: error.message }
        }
    }

    const cancelAutomation = async () => {
        await saveSettings({ activatedAt: null })
    }

    const cleanup = () => {
        settingsUnsub?.(); settingsUnsub = null
        logsUnsub?.(); logsUnsub = null
        mailingUnsub?.(); mailingUnsub = null
    }

    return {
        settings,
        emailLogs,
        mailingLists,
        loadSettings,
        saveSettings,
        loadEmailLogs,
        loadMailingLists,
        saveMailingList,
        deleteMailingList,
        logEmail,
        sendReportEmail,
        cancelAutomation,
        cleanup,
    }
}