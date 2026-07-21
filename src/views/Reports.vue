<template>
    <div class="min-h-screen bg-slate-50/50">
      <NavBar />
      
      <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <i class="fas fa-file-alt text-indigo-600"></i> Reports & Data Export
            </h2>
            <p class="text-slate-500 text-sm mt-0.5">Generate filtered reports and download as Excel or beautifully styled PDF.</p>
          </div>
        </div>
  
        <ReportGenerator />
      </div>
    </div>
  </template>
  
  <script setup>
  import NavBar from '../components/NavBar.vue'
  import ReportGenerator from '../components/ReportGenerator.vue'
  </script>