<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 p-4 relative overflow-hidden">
    <!-- Ambient orbs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <Transition name="portal" appear>
      <div class="bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md space-y-6 relative z-10">
        
        <!-- Logo -->
        <div class="flex flex-col items-center justify-center text-center space-y-3">
          <div class="w-full bg-slate-900 py-4 px-6 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-950/20 relative group overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50"></div>
            <img 
              src="../assets/John_Paul_Logo_Design_01-03.avif" 
              alt="Dr. John Paul Logo" 
              class="h-12 w-auto object-contain relative z-10 transition-transform duration-300 group-hover:scale-103"
            />
          </div>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Clinical Workspace Terminal</p>
        </div>

        <form @submit.prevent="handleAuthSubmit" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Email</label>
            <div class="relative">
              <i class="fas fa-envelope absolute left-4 top-3.5 text-slate-400 text-sm"></i>
              <input 
                v-model="email" 
                type="email" 
                required
                :disabled="loading"
                placeholder="example@gmail.com" 
                class="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between items-center px-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
            </div>
            <div class="relative">
              <i class="fas fa-lock absolute left-4 top-3.5 text-slate-400 text-sm"></i>
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                required
                :disabled="loading"
                placeholder="••••••••••••" 
                class="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
              <button 
                type="button" 
                @click="showPassword = !showPassword" 
                class="absolute right-4 top-3 text-slate-400 hover:text-slate-600 outline-none p-0.5 text-sm"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition active:scale-[0.99] shadow-md flex items-center justify-center gap-2 text-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              <template v-if="loading">
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                <span>Validating credentials...</span>
              </template>
              <template v-else>
                <i :class="isLogin ? 'fas fa-sign-in-alt' : 'fas fa-user-plus'" class="text-xs opacity-80"></i>
                <span>{{ isLogin ? 'Authenticate Access' : 'Register Operator Profile' }}</span>
              </template>
            </button>
          </div>
        </form>

        <div class="text-center text-xs text-slate-500 pt-1">
          <p v-if="isLogin">
            New clinical terminal context? 
            <button @click="toggleViewMode" :disabled="loading" class="text-indigo-600 font-bold hover:underline ml-0.5 disabled:no-underline">Create profile account</button>
          </p>
          <p v-else>
            Already an indexed supervisor? 
            <button @click="toggleViewMode" :disabled="loading" class="text-indigo-600 font-bold hover:underline ml-0.5 disabled:no-underline">Return to login</button>
          </p>
        </div>

        <Transition name="shake">
          <div v-if="errorMsg" class="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2.5 shadow-inner">
            <i class="fas fa-exclamation-circle text-red-500 text-sm mt-0.5 shrink-0"></i>
            <p class="text-xs font-semibold text-red-700 leading-relaxed">{{ parsedError }}</p>
          </div>
        </Transition>

      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const router = useRouter()

const toggleViewMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
  password.value = ''
}

const handleAuthSubmit = async () => {
  if (loading.value) return
  errorMsg.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }
    await router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

const parsedError = computed(() => {
  if (!errorMsg.value) return ''
  const msg = errorMsg.value.toLowerCase()
  if (msg.includes('auth/invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found'))
    return 'Invalid access signature. Verify details match your registered records.'
  if (msg.includes('email-already-in-use'))
    return 'This email register block is already locked by an active administrative terminal account.'
  if (msg.includes('weak-password'))
    return 'Security threshold failure: Security password matrices require at least 6 characters.'
  if (msg.includes('network-request-failed'))
    return 'Cloud connectivity exception: Check your standard physical network infrastructure links.'
  return errorMsg.value.replace('Firebase:', '').trim()
})
</script>

<style scoped>
.portal-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.portal-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
.shake-enter-active {
  animation: errorShake 0.3s ease-in-out;
}
</style>