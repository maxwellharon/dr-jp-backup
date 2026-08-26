// api/cron-send-scheduled-reports.js
//
// This is the piece that was completely missing before: something that
// actually fires at the scheduled time. Everything in Settings.vue only
// ever *saved* a schedule to Firestore — nothing ever read it back and
// triggered a send. Vercel serverless functions never run on their own;
// they only run in response to an HTTP request, so a schedule sitting in
// Firestore alone will never send an email by itself.
//
// This endpoint is that trigger. Call it on a schedule (see the two
// options in the setup notes below) and it will:
//   1. Look at every user's saved automation settings.
//   2. Work out, in Africa/Nairobi time, whether each one is due.
//   3. Build the same reportData shape the "Send Now" button builds.
//   4. POST it to /api/send-report (unchanged) to generate the PDF and email it.
//   5. Record the result back onto the settings doc + emailLogs, so the
//      Settings page shows it exactly like a manual send.
//
// Protect this endpoint with CRON_SECRET so only your scheduler can call it.
//
// ---------------------------------------------------------------------
// HOW TO TRIGGER IT (pick one):
//
// Option A — Vercel Cron (needs the Pro plan for anything sub-daily).
//   Add to vercel.json (already done in this project):
//     { "path": "/api/cron-send-scheduled-reports", "schedule": "*/15 * * * *" }
//   Vercel automatically sends `Authorization: Bearer $CRON_SECRET`.
//   NOTE: On the free Hobby plan, Vercel only allows ONE run per day and
//   only guarantees it fires sometime within that hour — not workable for
//   an arbitrary "deliver at 14:30" schedule.
//
// Option B — a free external pinger (works on any Vercel plan, incl. Hobby).
//   Create a free account at https://cron-job.org (or similar), and add a
//   job that sends a GET request every 5–15 minutes to:
//     https://YOUR-DOMAIN/api/cron-send-scheduled-reports
//   with header:  Authorization: Bearer YOUR_CRON_SECRET
//   This is the recommended option unless you're already on Vercel Pro.
//
// Either way, calling this endpoint more often than needed is harmless —
// each schedule is only ever sent once per period (see isDue/claim below).
// ---------------------------------------------------------------------

import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_firebaseAdmin.js'
import { nairobiParts, resolveBaseUrl, buildReportData } from './_reportHelpers.js'

function toDate(value) {
    if (!value) return null
    if (typeof value.toDate === 'function') return value.toDate()
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

// Is this schedule due right now, in Africa/Nairobi time?
function isDue(settings, now) {
    if (!settings?.activatedAt) return false
    if (!Array.isArray(settings.recipients) || !settings.recipients.length) return false

    const [hh, mm] = String(settings.time || '09:00').split(':').map(Number)
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false

    const nowParts = nairobiParts(now)
    const scheduledMinutes = hh * 60 + mm
    const nowMinutes = nowParts.hours * 60 + nowParts.minutes

    // Only fire once the scheduled minute has passed for "today" (Nairobi).
    if (nowMinutes < scheduledMinutes) return false

    const activatedAt = toDate(settings.activatedAt) || now
    const frequency = settings.frequency || 'weekly'

    if (frequency === 'weekly') {
        const anchorDay = nairobiParts(activatedAt).day
        if (nowParts.day !== anchorDay) return false
    }

    if (frequency === 'monthly') {
        const anchorDate = nairobiParts(activatedAt).date
        const lastDayOfMonth = new Date(Date.UTC(nowParts.year, nowParts.month + 1, 0)).getUTCDate()
        const targetDate = Math.min(anchorDate, lastDayOfMonth)
        if (nowParts.date !== targetDate) return false
    }

    const lastSent = toDate(settings.lastSentAt)
    if (!lastSent) return true

    // Already sent today (Nairobi) -> not due again until tomorrow at the
    // earliest, regardless of frequency. This is what makes daily reports
    // fire once per day instead of once per cron tick.
    return nairobiParts(lastSent).dateKey !== nowParts.dateKey
}

async function sendViaApi(baseUrl, payload) {
    const res = await fetch(`${baseUrl}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) {
        return { success: false, error: result.error || `send-report failed (${res.status})` }
    }
    return { success: true, messageId: result.messageId }
}

export default async function handler(req, res) {
    const authHeader = req.headers['authorization']
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const now = new Date()
    const db = getAdminDb()
    const results = []

    let baseUrl
    try {
        baseUrl = resolveBaseUrl()
    } catch (err) {
        console.error('cron-send-scheduled-reports config error:', err)
        return res.status(500).json({ error: err.message })
    }

    try {
        // Every user's automation doc lives at users/{uid}/settings/automation.
        // A collectionGroup query reads that "settings" subcollection across
        // every user in one go. The first time you run this you may need to
        // enable collection-group queries for "settings" in the Firestore
        // console (Firestore -> Indexes -> Single field -> enable for
        // collection group "settings") — Firestore will show a direct link
        // in the error message if it's still needed.
        const snapshot = await db.collectionGroup('settings').get()

        for (const docSnap of snapshot.docs) {
            if (docSnap.id !== 'automation') continue

            const settings = docSnap.data()
            if (!isDue(settings, now)) continue

            const uid = docSnap.ref.parent.parent?.id
            if (!uid) continue

            // Claim the run inside a transaction so two overlapping cron
            // ticks for the same schedule can't both send it.
            const claimed = await db.runTransaction(async (tx) => {
                const fresh = await tx.get(docSnap.ref)
                const freshData = fresh.data()
                if (!isDue(freshData, now)) return false
                tx.set(docSnap.ref, {
                    lastSentAt: Timestamp.fromDate(now),
                    lastRunStatus: 'sending',
                }, { merge: true })
                return true
            })

            if (!claimed) continue

            try {
                const { reportData, reportType, filters } = await buildReportData(settings, baseUrl)
                const sendResult = await sendViaApi(baseUrl, {
                    recipients: settings.recipients,
                    reportData,
                    reportType,
                    filters,
                })

                await docSnap.ref.set({
                    lastRunStatus: sendResult.success ? 'sent' : 'error',
                    lastRunError: sendResult.success ? null : sendResult.error,
                }, { merge: true })

                await docSnap.ref.parent.parent.collection('emailLogs').add({
                    recipients: settings.recipients,
                    reportType,
                    filters,
                    success: sendResult.success,
                    messageId: sendResult.messageId || null,
                    error: sendResult.success ? null : sendResult.error,
                    automated: true,
                    ownerUid: uid,
                    sentAt: FieldValue.serverTimestamp(),
                })

                results.push({ uid, success: sendResult.success, error: sendResult.error || null })
            } catch (err) {
                console.error(`cron-send-scheduled-reports: failed for uid=${uid}:`, err)
                await docSnap.ref.set({
                    lastRunStatus: 'error',
                    lastRunError: err.message,
                }, { merge: true })
                results.push({ uid, success: false, error: err.message })
            }
        }

        return res.status(200).json({
            checked: snapshot.size,
            processed: results.length,
            results,
        })
    } catch (error) {
        console.error('cron-send-scheduled-reports error:', error)
        return res.status(500).json({ error: error.message })
    }
}