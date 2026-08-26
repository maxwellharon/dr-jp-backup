// api/_firebaseAdmin.js
//
// Server-side Firestore access for API routes that must run without a
// signed-in browser session (currently: the scheduled-report cron job).
// This is completely separate from src/firebase/config.js, which sets up
// the *client* SDK the browser uses.
//
// Requires FIREBASE_SERVICE_ACCOUNT_B64 — a base64-encoded Firebase service
// account JSON key with Firestore access. Generate one from:
//   Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
// Then base64-encode the downloaded file, e.g.:
//   base64 -i service-account.json | tr -d '\n'
// and set the result as FIREBASE_SERVICE_ACCOUNT_B64 in Vercel's project
// environment variables (never commit the raw JSON file to the repo).

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let cachedApp = null

function getAdminApp() {
    if (cachedApp) return cachedApp

    const existing = getApps()
    if (existing.length) {
        cachedApp = existing[0]
        return cachedApp
    }

    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
    if (!b64) {
        throw new Error(
            'Missing FIREBASE_SERVICE_ACCOUNT_B64 environment variable. ' +
            'Generate a Firebase service account key and set it (base64-encoded) in Vercel.'
        )
    }

    let serviceAccount
    try {
        serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    } catch (err) {
        throw new Error(`Failed to decode FIREBASE_SERVICE_ACCOUNT_B64: ${err.message}`)
    }

    cachedApp = initializeApp({
        credential: cert(serviceAccount),
    })

    return cachedApp
}

export function getAdminDb() {
    return getFirestore(getAdminApp())
}