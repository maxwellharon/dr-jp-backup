<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      <p class="text-sm font-medium text-slate-500 mt-4">Fetching site analytics...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
      <p class="text-red-700 font-semibold">Failed to load site data</p>
      <p class="text-xs text-red-500 mt-1">{{ error }}</p>
      <button @click="refresh" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">
        Retry
      </button>
    </div>

    <!-- Main Report -->
    <template v-else-if="gaData">
      <!-- Report Header & Export Buttons -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i class="fas fa-file-alt text-indigo-600"></i> Site Analytics Report
          </h3>
          <p class="text-sm text-slate-500 mt-1">
            Generated on {{ new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            · Data period: {{ minDate }} to {{ maxDate }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="exportPDF"
            class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <i class="fas fa-file-pdf"></i> Export PDF
          </button>
          <button
            @click="exportExcel"
            class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-indigo-500">
          <div class="text-slate-500 text-sm">Total Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.totalUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-emerald-500">
          <div class="text-slate-500 text-sm">New Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.newUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-amber-500">
          <div class="text-slate-500 text-sm">Sessions</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.sessions) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-rose-500">
          <div class="text-slate-500 text-sm">Page Views</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.screenPageViews) }}</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Active Users & New Users</h4>
          <canvas ref="visitorsChartCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Sessions & Pageviews</h4>
          <canvas ref="sessionsChartCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Countries</h4>
          <canvas ref="countriesChartCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Pages</h4>
          <canvas ref="pagesChartCanvas" height="250"></canvas>
        </div>
      </div>

      <!-- Data Tables -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Top Pages – Engagement Analysis</h4>
        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Page</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Pageviews</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Avg Engagement</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Bounce Rate</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Sessions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="page in topPages" :key="page.pagePath" class="hover:bg-slate-50">
              <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ page.pagePath }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.screenPageViews }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ formatDuration(page.averageEngagementTime) }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.bounceRate }}%</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.sessions }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Countries</h4>
          <table class="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Country</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Active Users</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Bounce Rate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="country in topCountries" :key="country.country" class="hover:bg-slate-50">
                <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ country.country }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ country.sessions }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ country.activeUsers }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ country.bounceRate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h4>
          <table class="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Source</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Active Users</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="src in trafficSources" :key="src.sessionSource" class="hover:bg-slate-50">
                <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ src.sessionSource }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ src.sessions }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ src.activeUsers }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Device Categories</h4>
        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Device</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Sessions</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Active Users</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="device in deviceCategories" :key="device.deviceCategory" class="hover:bg-slate-50">
              <td class="px-4 py-2 text-sm font-medium text-slate-700 capitalize">{{ device.deviceCategory }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ device.sessions }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ device.activeUsers }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import Chart from 'chart.js/auto'

const { gaData, loading, error, refresh } = useGoogleAnalytics()

// Chart canvas refs
const visitorsChartCanvas = ref(null)
const sessionsChartCanvas = ref(null)
const countriesChartCanvas = ref(null)
const pagesChartCanvas = ref(null)
let charts = []

// Raw data
const summary = computed(() => gaData.value?.summary || {})
const timeSeries = computed(() => gaData.value?.timeSeries || [])
const topPages = computed(() => gaData.value?.topPages || [])
const topCountries = computed(() => gaData.value?.topCountries || [])
const trafficSources = computed(() => gaData.value?.trafficSources || [])
const deviceCategories = computed(() => gaData.value?.deviceCategories || [])

// Date range
const minDate = computed(() => timeSeries.value[0]?.date || '')
const maxDate = computed(() => timeSeries.value[timeSeries.value.length - 1]?.date || '')

// Format helpers
function formatNumber(value) {
  if (!value) return '0'
  return Number(value).toLocaleString('en-KE')
}
function formatDuration(seconds) {
  if (!seconds) return '0s'
  const sec = Number(seconds)
  const mins = Math.floor(sec / 60)
  const remainingSec = Math.round(sec % 60)
  return `${mins}m ${remainingSec}s`
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
  return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}

// Chart creation
function destroyCharts() {
  charts.forEach(c => c.destroy())
  charts = []
}

function createCharts() {
  if (!gaData.value) return
  destroyCharts()

  // Visitors line chart
  if (visitorsChartCanvas.value && timeSeries.value.length) {
    charts.push(new Chart(visitorsChartCanvas.value, {
      type: 'line',
      data: {
        labels: timeSeries.value.map(d => formatDate(d.date)),
        datasets: [
          { label: 'Active Users', data: timeSeries.value.map(d => d.activeUsers), borderColor: '#6366f1', tension: 0.2, fill: false, pointBackgroundColor: '#6366f1' },
          { label: 'New Users', data: timeSeries.value.map(d => d.newUsers), borderColor: '#10b981', tension: 0.2, fill: false, pointBackgroundColor: '#10b981' }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // Sessions & Pageviews bar chart
  if (sessionsChartCanvas.value && timeSeries.value.length) {
    charts.push(new Chart(sessionsChartCanvas.value, {
      type: 'bar',
      data: {
        labels: timeSeries.value.map(d => formatDate(d.date)),
        datasets: [
          { label: 'Sessions', data: timeSeries.value.map(d => d.sessions), backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: 'Pageviews', data: timeSeries.value.map(d => d.screenPageViews), backgroundColor: '#818cf8', borderRadius: 4 }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // Top Countries horizontal bar
  if (countriesChartCanvas.value && topCountries.value.length) {
    charts.push(new Chart(countriesChartCanvas.value, {
      type: 'bar',
      data: {
        labels: topCountries.value.map(c => c.country),
        datasets: [{ label: 'Sessions', data: topCountries.value.map(c => c.sessions), backgroundColor: '#8b5cf6', borderRadius: 6 }]
      },
      options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    }))
  }

  // Top Pages bar
  if (pagesChartCanvas.value && topPages.value.length) {
    charts.push(new Chart(pagesChartCanvas.value, {
      type: 'bar',
      data: {
        labels: topPages.value.map(p => p.pagePath.substring(0, 25) + (p.pagePath.length > 25 ? '...' : '')),
        datasets: [{ label: 'Pageviews', data: topPages.value.map(p => p.screenPageViews), backgroundColor: '#10b981', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    }))
  }
}

// Export to PDF (using browser print)
function exportPDF() {
  window.print()
}

// Export to Excel (CSV)
function exportExcel() {
  const rows = []
  // Header
  rows.push('Site Analytics Report')
  rows.push(`Generated on ${new Date().toLocaleDateString()}`)
  rows.push(`Period: ${minDate.value} to ${maxDate.value}`)
  rows.push('')

  // Summary
  rows.push('Summary')
  rows.push('Total Users,New Users,Sessions,Page Views,Avg Session Duration,Bounce Rate,Engagement Rate')
  rows.push(`${summary.value.totalUsers},${summary.value.newUsers},${summary.value.sessions},${summary.value.screenPageViews},${formatDuration(summary.value.averageSessionDuration)},${summary.value.bounceRate}%,${summary.value.engagementRate}%`)
  rows.push('')

  // Top Pages
  rows.push('Top Pages')
  rows.push('Page,Pageviews,Avg Engagement,Bounce Rate,Sessions')
  topPages.value.forEach(p => {
    rows.push(`${p.pagePath},${p.screenPageViews},${formatDuration(p.averageEngagementTime)},${p.bounceRate}%,${p.sessions}`)
  })
  rows.push('')

  // Top Countries
  rows.push('Top Countries')
  rows.push('Country,Sessions,Active Users,Bounce Rate')
  topCountries.value.forEach(c => {
    rows.push(`${c.country},${c.sessions},${c.activeUsers},${c.bounceRate}%`)
  })
  rows.push('')

  // Traffic Sources
  rows.push('Traffic Sources')
  rows.push('Source,Sessions,Active Users')
  trafficSources.value.forEach(s => {
    rows.push(`${s.sessionSource},${s.sessions},${s.activeUsers}`)
  })
  rows.push('')

  // Device Categories
  rows.push('Device Categories')
  rows.push('Device,Sessions,Active Users')
  deviceCategories.value.forEach(d => {
    rows.push(`${d.deviceCategory},${d.sessions},${d.activeUsers}`)
  })

  // Create CSV blob and download
  const csvContent = rows.map(row => row.split(',').map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `site-analytics-report-${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Watch for data and create charts
watch(gaData, (newData) => {
  if (newData) {
    nextTick(() => createCharts())
  }
})

onMounted(() => {
  if (gaData.value) {
    nextTick(() => createCharts())
  }
})

onUnmounted(() => {
  destroyCharts()
})
</script>

<style scoped>
/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  .bg-white {
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
  }
  .min-h-screen {
    background: white !important;
  }
  canvas {
    max-width: 100% !important;
    height: auto !important;
  }
}
</style>