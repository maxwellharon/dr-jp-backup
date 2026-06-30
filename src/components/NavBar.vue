<template>
  <nav class="sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 border-b border-slate-800 shadow-md transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <div class="flex justify-between items-center h-16">
        
        <router-link to="/dashboard" class="flex items-center group outline-none py-1">
          <img 
            src="../assets/John_Paul_Logo_Design_01-03.avif" 
            alt="Dr. John Paul Logo" 
            class="h-10 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
          />
        </router-link>
        
        <div class="hidden md:flex items-center gap-1.5 font-semibold text-sm">
          <router-link to="/dashboard" active-class="bg-indigo-600 text-white border border-indigo-500" class="text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2">
            📊 Dashboard
          </router-link>
          <router-link to="/patients" active-class="bg-indigo-600 text-white border border-indigo-500" class="text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2">
            👥 Patients
          </router-link>
          <router-link to="/procedures" active-class="bg-indigo-600 text-white border border-indigo-500" class="text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2">
            📋 Procedures
          </router-link>
          <router-link to="/inquiries" active-class="bg-indigo-600 text-white border border-indigo-500" class="text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2">
            📩 Inquiries
          </router-link>
          <router-link to="/analytics" active-class="bg-indigo-600 text-white border border-indigo-500" class="text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2">
            🤖 AI Analytics
          </router-link>

          <div class="h-5 w-px bg-slate-700 mx-2"></div>

          <div v-if="userEmail" class="hidden lg:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl pl-2.5 pr-3 py-1.5 text-xs text-slate-300 font-mono">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="truncate max-w-[120px]" :title="userEmail">{{ userEmail }}</span>
          </div>

          <button @click="handleLogout" class="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all outline-none ml-1" title="Terminate Active Control Session">
            <i class="fas fa-sign-out-alt text-base"></i>
          </button>
        </div>

        <button @click="mobileOpen = !mobileOpen" class="md:hidden h-10 w-10 border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center justify-center rounded-xl transition outline-none">
          <i :class="mobileOpen ? 'fas fa-times' : 'fas fa-bars'" class="text-lg transition-transform duration-200"></i>
        </button>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="mobileOpen" class="md:hidden bg-slate-900/98 border-t border-slate-800 px-4 py-4 flex flex-col gap-2 font-semibold text-sm shadow-inner max-h-[calc(100vh-4rem)] overflow-y-auto">
        <router-link to="/dashboard" @click="mobileOpen = false" active-class="bg-indigo-600 text-white" class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3">
          <i class="fas fa-chart-pie w-5 opacity-70 text-center"></i> Dashboard Summary
        </router-link>
        <router-link to="/patients" @click="mobileOpen = false" active-class="bg-indigo-600 text-white" class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3">
          <i class="fas fa-user-injured w-5 opacity-70 text-center"></i> Patient Registry
        </router-link>
        <router-link Bureau to="/procedures" @click="mobileOpen = false" active-class="bg-indigo-600 text-white" class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3">
          <i class="fas fa-notes-medical w-5 opacity-70 text-center"></i> Medical Procedures
        </router-link>
        <router-link to="/inquiries" @click="mobileOpen = false" active-class="bg-indigo-600 text-white" class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3">
          <i class="fas fa-envelope w-5 opacity-70 text-center"></i> Communications Inbox
        </router-link>
        <router-link to="/analytics" @click="mobileOpen = false" active-class="bg-indigo-600 text-white" class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3">
          <i class="fas fa-brain w-5 opacity-70 text-center"></i> AI Analytics
        </router-link>

        <div class="h-px bg-slate-800 my-2"></div>
        
        <div v-if="userEmail" class="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 font-mono flex items-center gap-2 break-all">
          <i class="fas fa-shield-alt text-slate-500"></i> Operator: {{ userEmail }}
        </div>

        <button @click="handleLogout" class="text-red-400 hover:bg-red-500/10 font-bold p-3 rounded-xl transition-all text-left flex items-center gap-3 outline-none">
          <i class="fas fa-sign-out-alt w-5 text-center"></i> Terminate Control Session
        </button>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'

const router = useRouter()
const mobileOpen = ref(false)
const userEmail = ref('')

// Initialize operational auth cache fields dynamically inside lifecycle anchors
onMounted(() => {
  if (auth.currentUser) {
    userEmail.value = auth.currentUser.email || 'operator@ogalo.io'
  }
})

// Defensively shielded asynchronous router checkout action sequence
const handleLogout = async () => {
  if (confirm('Verify confirmation statement: Terminate current clinic terminal session and exit back to security portal?')) {
    try {
      mobileOpen.value = false
      await signOut(auth)
      await router.push('/login')
    } catch (error) {
      alert('Authentication Exception: Unable to disconnect secure session cloud tokens correctly. Details: ' + error.message)
    }
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
  opacity: 1;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>