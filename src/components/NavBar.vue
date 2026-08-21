<template>
  <nav
    class="sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 border-b border-slate-800 shadow-md transition-all duration-300"
  >
    <div class="max-w-[1600px] mx-auto px-4 md:px-6">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link
          to="/dashboard"
          class="flex items-center group outline-none py-1 shrink-0"
        >
          <img
            src="../assets/John_Paul_Logo_Design_01-03.avif"
            alt="Dr. John Paul Logo"
            class="h-9 lg:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </router-link>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-1 xl:gap-1.5 font-semibold text-xs xl:text-sm">
          <router-link
            to="/dashboard"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-chart-pie text-sm"></i>
            <span>Dashboard</span>
          </router-link>

          <router-link
            to="/patients"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-user-injured text-sm"></i>
            <span>Patients</span>
          </router-link>

          <router-link
            to="/procedures"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-notes-medical text-sm"></i>
            <span>Procedures</span>
          </router-link>

          <router-link
            to="/inquiries"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-envelope text-sm"></i>
            <span>Inquiries</span>
          </router-link>

          <router-link
            to="/analytics"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-brain text-sm"></i>
            <span>AI Analytics</span>
          </router-link>

          <router-link
            to="/reports"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-file-alt text-sm"></i>
            <span>Reports</span>
          </router-link>

          <router-link
            to="/settings"
            active-class="bg-indigo-600 text-white border border-indigo-500"
            class="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 xl:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0"
          >
            <i class="fas fa-cog text-sm"></i>
            <span>Settings</span>
          </router-link>

          <div class="h-5 w-px bg-slate-700 mx-1 xl:mx-2 shrink-0"></div>

          <div
            v-if="userEmail"
            class="hidden xl:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl pl-2.5 pr-3 py-1.5 text-xs text-slate-300 font-mono shrink-0"
          >
            <span
              class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"
            ></span>
            <span class="truncate max-w-[110px] 2xl:max-w-[150px]" :title="userEmail">
              {{ userEmail }}
            </span>
          </div>

          <button
            @click="handleLogout"
            class="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all outline-none shrink-0"
            title="Terminate Active Control Session"
          >
            <i class="fas fa-sign-out-alt text-base"></i>
          </button>
        </div>

        <!-- Mobile hamburger -->
        <button
          @click="mobileOpen = !mobileOpen"
          class="md:hidden h-10 w-10 border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center justify-center rounded-xl transition outline-none"
        >
          <i
            :class="mobileOpen ? 'fas fa-times' : 'fas fa-bars'"
            class="text-lg transition-transform duration-200"
          ></i>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide">
      <div
        v-if="mobileOpen"
        class="md:hidden bg-slate-900/98 border-t border-slate-800 px-4 py-4 flex flex-col gap-2 font-semibold text-sm shadow-inner max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <router-link
          to="/dashboard"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-chart-pie w-5 opacity-70 text-center"></i>
          <span>Dashboard Summary</span>
        </router-link>

        <router-link
          to="/patients"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-user-injured w-5 opacity-70 text-center"></i>
          <span>Patient Registry</span>
        </router-link>

        <router-link
          to="/procedures"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-notes-medical w-5 opacity-70 text-center"></i>
          <span>Medical Procedures</span>
        </router-link>

        <router-link
          to="/inquiries"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-envelope w-5 opacity-70 text-center"></i>
          <span>Communications Inbox</span>
        </router-link>

        <router-link
          to="/analytics"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-brain w-5 opacity-70 text-center"></i>
          <span>AI Analytics</span>
        </router-link>

        <router-link
          to="/reports"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-file-alt w-5 opacity-70 text-center"></i>
          <span>Report Exports</span>
        </router-link>

        <router-link
          to="/settings"
          @click="mobileOpen = false"
          active-class="bg-indigo-600 text-white"
          class="text-slate-300 hover:text-white hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-3"
        >
          <i class="fas fa-cog w-5 opacity-70 text-center"></i>
          <span>Settings</span>
        </router-link>

        <div class="h-px bg-slate-800 my-2"></div>

        <div
          v-if="userEmail"
          class="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 font-mono flex items-center gap-2 break-all"
        >
          <i class="fas fa-shield-alt text-slate-500"></i>
          <span>Operator: {{ userEmail }}</span>
        </div>

        <button
          @click="handleLogout"
          class="text-red-400 hover:bg-red-500/10 font-bold p-3 rounded-xl transition-all text-left flex items-center gap-3 outline-none"
        >
          <i class="fas fa-sign-out-alt w-5 text-center"></i>
          <span>Terminate Control Session</span>
        </button>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";

const router = useRouter();
const mobileOpen = ref(false);
const userEmail = ref("");

onMounted(() => {
  if (auth.currentUser) {
    userEmail.value = auth.currentUser.email || "operator@ogalo.io";
  }
});

const handleLogout = async () => {
  if (
    confirm(
      "Verify confirmation statement: Terminate current clinic terminal session and exit back to security portal?",
    )
  ) {
    try {
      mobileOpen.value = false;
      await signOut(auth);
      await router.push("/login");
    } catch (error) {
      alert(
        "Authentication Exception: Unable to disconnect secure session cloud tokens correctly. Details: " +
          error.message,
      );
    }
  }
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  opacity: 1;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>