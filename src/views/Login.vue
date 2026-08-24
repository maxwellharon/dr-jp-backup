<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
      <div class="mb-8">
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
          Dr. JP Ogalo Clinic
        </p>

        <h1 class="text-3xl font-extrabold text-slate-900 mt-2">
          {{ isLogin ? 'Sign in' : 'Create account' }}
        </h1>

        <p class="text-sm text-slate-500 mt-2">
          Analytics, patient intelligence and reporting control center.
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleAuthSubmit"
      >
        <input
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="Email address"
          class="w-full rounded-xl border border-slate-200 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/30"
          :disabled="loading"
          required
        />

        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            placeholder="Password"
            class="w-full rounded-xl border border-slate-200 p-3.5 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/30"
            :disabled="loading"
            required
          />

          <button
            type="button"
            class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
            :disabled="loading"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <i
              :class="
                showPassword
                  ? 'fas fa-eye-slash'
                  : 'fas fa-eye'
              "
            ></i>
          </button>
        </div>

        <p
          v-if="parsedError"
          class="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3"
          role="alert"
        >
          {{ parsedError }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 transition"
        >
          <span v-if="loading">
            <i class="fas fa-circle-notch fa-spin mr-2"></i>
            Processing...
          </span>

          <span v-else>
            {{ isLogin ? 'Sign in' : 'Create account' }}
          </span>
        </button>
      </form>

      <div class="my-5 flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-200"></div>
        <span class="text-xs text-slate-400">OR</span>
        <div class="h-px flex-1 bg-slate-200"></div>
      </div>

      <button
        type="button"
        :disabled="loading"
        @click="handleGoogleSignIn"
        class="w-full rounded-xl border border-slate-200 py-3.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        <i class="fab fa-google text-red-500 mr-2"></i>
        Continue with Google
      </button>

      <button
        type="button"
        class="w-full mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition disabled:opacity-50"
        :disabled="loading"
        @click="toggleViewMode"
      >
        {{ isLogin ? 'Create a new account' : 'Back to sign in' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, authPersistenceReady } from '../firebase/config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const router = useRouter()

const toggleViewMode = () => {
  if (loading.value) return

  isLogin.value = !isLogin.value
  errorMsg.value = ''
  password.value = ''
}

const handleAuthSubmit = async () => {
  if (loading.value) return

  const normalizedEmail = email.value.trim()

  if (!normalizedEmail || !password.value) {
    errorMsg.value = 'Please enter your email address and password.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    /*
     * Ensure Firebase has finished configuring browser-local
     * authentication persistence before signing in.
     */
    await authPersistenceReady

    if (isLogin.value) {
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password.value
      )
    } else {
      await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password.value
      )
    }

    await router.push('/dashboard')
  } catch (err) {
    errorMsg.value =
      err?.message || 'Authentication failed.'
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = async () => {
  if (loading.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    /*
     * Wait for Firebase authentication persistence before
     * starting the Google authentication flow.
     */
    await authPersistenceReady

    const provider = new GoogleAuthProvider()

    provider.setCustomParameters({
      prompt: 'select_account'
    })

    await signInWithPopup(auth, provider)

    await router.push('/dashboard')
  } catch (err) {
    errorMsg.value =
      err?.message || 'Google authentication failed.'
  } finally {
    loading.value = false
  }
}

const parsedError = computed(() => {
  if (!errorMsg.value) return ''

  const msg = errorMsg.value.toLowerCase()

  if (
    msg.includes('invalid-credential') ||
    msg.includes('invalid credential') ||
    msg.includes('wrong-password') ||
    msg.includes('user-not-found')
  ) {
    return 'Invalid credentials. Verify the email address and password.'
  }

  if (msg.includes('email-already-in-use')) {
    return 'This email address is already registered.'
  }

  if (
    msg.includes('weak-password') ||
    msg.includes('password should be at least')
  ) {
    return 'Password does not meet the minimum strength requirement.'
  }

  if (msg.includes('invalid-email')) {
    return 'Please enter a valid email address.'
  }

  if (msg.includes('network-request-failed')) {
    return 'Network connection failed. Check the internet connection and retry.'
  }

  if (msg.includes('popup-closed-by-user')) {
    return 'Google sign-in was cancelled.'
  }

  if (msg.includes('popup-blocked')) {
    return 'The Google sign-in popup was blocked. Allow popups for this site and try again.'
  }

  if (msg.includes('too-many-requests')) {
    return 'Too many authentication attempts. Please wait and try again.'
  }

  if (msg.includes('operation-not-allowed')) {
    return 'This sign-in method is currently unavailable.'
  }

  if (msg.includes('auth/')) {
    return errorMsg.value
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\(auth\/[^)]+\)\.?$/i, '')
      .trim()
  }

  return errorMsg.value
    .replace(/^Firebase:\s*/i, '')
    .trim()
})
</script>