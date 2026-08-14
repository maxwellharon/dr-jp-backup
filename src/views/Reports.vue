<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <i class="fas fa-file-alt text-indigo-600"></i> Reports & Data Export
        </h2>
        <p class="text-slate-500 text-sm mt-0.5">
          Filter patient records or site analytics, and download as Excel or PDF.
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          @click="activeReportTab = 'patient'"
          :class="activeReportTab === 'patient' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'"
          class="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
        >
          <i class="fas fa-user-injured"></i> Patient Data
        </button>
        <button
          @click="activeReportTab = 'site'"
          :class="activeReportTab === 'site' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'"
          class="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
        >
          <i class="fas fa-chart-line"></i> Site Analytics
        </button>
      </div>

      <!-- Content -->
      <Transition name="fade" mode="out-in">
        <div v-if="activeReportTab === 'patient'" key="patient">
          <ReportGenerator />
        </div>
        <div v-else-if="activeReportTab === 'site'" key="site">
          <SiteReportGenerator />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import ReportGenerator from '../components/ReportGenerator.vue'
import SiteReportGenerator from '../components/SiteReportGenerator.vue'

const activeReportTab = ref('patient')
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>