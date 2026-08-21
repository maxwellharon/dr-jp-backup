<template>
  <div class="space-y-6">
    <!-- Header with Export Buttons -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="text-xl font-bold text-slate-900">Site Analytics Report</h3>
        <p class="text-sm text-slate-500">Comprehensive data pulled from Google Analytics 4</p>
      </div>
      <div class="flex gap-3">
        <button
          @click="exportPDF"
          :disabled="!gaData || loading"
          class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          <i class="fas fa-file-pdf"></i> Export PDF
        </button>
        <button
          @click="exportExcel"
          :disabled="!gaData || loading"
          class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          <i class="fas fa-file-excel"></i> Export Excel
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      <p class="text-sm font-medium text-slate-500 mt-4">Fetching analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
      <p class="text-red-700 font-semibold">Failed to load data</p>
      <p class="text-xs text-red-500 mt-1">{{ error }}</p>
      <button @click="refresh" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">
        Retry
      </button>
    </div>

    <!-- Report Content -->
    <template v-else-if="gaData">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-medium text-slate-400 uppercase">Total Users</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatNumber(rawSummary.totalUsers) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-medium text-slate-400 uppercase">New Users</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatNumber(rawSummary.newUsers) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-medium text-slate-400 uppercase">Sessions</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatNumber(rawSummary.sessions) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-medium text-slate-400 uppercase">Page Views</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatNumber(rawSummary.screenPageViews) }}</p>
        </div>
      </div>

      <!-- Additional Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Avg Engagement Time</p>
          <p class="text-xl font-bold text-slate-800">{{ formatDuration(rawSummary.averageSessionDuration) }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Bounce Rate</p>
          <p class="text-xl font-bold text-slate-800">{{ rawSummary.bounceRate }}%</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Engagement Rate</p>
          <p class="text-xl font-bold text-slate-800">{{ rawSummary.engagementRate }}%</p>
        </div>
      </div>

      <!-- Time Series Chart -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Daily Active Users</h4>
        <canvas ref="timeSeriesChart" height="200"></canvas>
      </div>

      <!-- Top Pages Table -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Top Pages</h4>
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
            <tr v-for="page in rawTopPages" :key="page.pagePath">
              <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ page.pagePath }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.screenPageViews }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ formatDuration(page.averageEngagementTime) }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.bounceRate }}%</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.sessions }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Two-column: Countries and Sources -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Top Countries</h4>
          <ul class="space-y-2">
            <li v-for="c in rawTopCountries" :key="c.country" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ c.country }}</span>
              <span class="font-semibold text-slate-800">{{ c.sessions }} sessions</span>
            </li>
          </ul>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h4>
          <ul class="space-y-2">
            <li v-for="s in rawTrafficSources" :key="s.sessionSource" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ s.sessionSource }}</span>
              <span class="font-semibold text-slate-800">{{ s.sessions }} sessions</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Devices and User Types -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Device Categories</h4>
          <ul class="space-y-2">
            <li v-for="d in rawDeviceCategories" :key="d.deviceCategory" class="flex justify-between items-center">
              <span class="text-sm text-slate-600 capitalize">{{ d.deviceCategory }}</span>
              <span class="font-semibold text-slate-800">{{ d.sessions }} sessions</span>
            </li>
          </ul>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">User Types</h4>
          <ul class="space-y-2">
            <li v-for="u in rawUserTypes" :key="u.newVsReturning" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ u.newVsReturning }}</span>
              <span class="font-semibold text-slate-800">{{ u.sessions }} sessions</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Hourly Breakdown Chart -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Sessions by Hour</h4>
        <canvas ref="hourlyChart" height="150"></canvas>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import Chart from 'chart.js/auto'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const { gaData, loading, error, refresh } = useGoogleAnalytics()

// Refs for charts
const timeSeriesChartCanvas = ref(null)
const hourlyChartCanvas = ref(null)
let timeSeriesChartInstance = null
let hourlyChartInstance = null

// Raw data computed
const rawSummary = computed(() => gaData.value?.summary || {})
const rawTimeSeries = computed(() => gaData.value?.timeSeries || [])
const rawTopPages = computed(() => gaData.value?.topPages || [])
const rawTopCountries = computed(() => gaData.value?.topCountries || [])
const rawTrafficSources = computed(() => gaData.value?.trafficSources || [])
const rawDeviceCategories = computed(() => gaData.value?.deviceCategories || [])
const rawUserTypes = computed(() => gaData.value?.userTypes || [])
const rawHourly = computed(() => gaData.value?.hourly || [])

// Formatting helpers
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
function createCharts() {
  if (!gaData.value) return

  // Destroy existing charts
  if (timeSeriesChartInstance) timeSeriesChartInstance.destroy()
  if (hourlyChartInstance) hourlyChartInstance.destroy()

  // Time series chart
  if (timeSeriesChartCanvas.value && rawTimeSeries.value.length) {
    timeSeriesChartInstance = new Chart(timeSeriesChartCanvas.value, {
      type: 'line',
      data: {
        labels: rawTimeSeries.value.map(d => formatDate(d.date)),
        datasets: [
          { label: 'Active Users', data: rawTimeSeries.value.map(d => d.activeUsers), borderColor: '#6366f1', tension: 0.2, fill: false },
          { label: 'New Users', data: rawTimeSeries.value.map(d => d.newUsers), borderColor: '#10b981', tension: 0.2, fill: false }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    })
  }

  // Hourly chart
  if (hourlyChartCanvas.value && rawHourly.value.length) {
    hourlyChartInstance = new Chart(hourlyChartCanvas.value, {
      type: 'bar',
      data: {
        labels: rawHourly.value.map(h => `${h.hour}:00`),
        datasets: [{ label: 'Sessions', data: rawHourly.value.map(h => h.sessions), backgroundColor: '#818cf8', borderRadius: 4 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
  }
}

// Watch for data changes
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
  if (timeSeriesChartInstance) timeSeriesChartInstance.destroy()
  if (hourlyChartInstance) hourlyChartInstance.destroy()
})

// ================= EXPORT PDF =================
async function exportPDF() {
  if (!gaData.value) return

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Title
  doc.setFontSize(20)
  doc.text('Site Analytics Report', margin, 20)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 28)

  // Summary metrics
  doc.setFontSize(14)
  doc.text('Summary', margin, 40)
  doc.autoTable({
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
      ['Total Users', formatNumber(rawSummary.value.totalUsers)],
      ['New Users', formatNumber(rawSummary.value.newUsers)],
      ['Sessions', formatNumber(rawSummary.value.sessions)],
      ['Page Views', formatNumber(rawSummary.value.screenPageViews)],
      ['Avg Engagement Time', formatDuration(rawSummary.value.averageSessionDuration)],
      ['Bounce Rate', `${rawSummary.value.bounceRate}%`],
      ['Engagement Rate', `${rawSummary.value.engagementRate}%`],
    ],
  })

  // Time series table
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Daily Traffic', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Date', 'Active Users', 'New Users', 'Sessions', 'Page Views']],
    body: rawTimeSeries.value.map(d => [
      d.date,
      d.activeUsers,
      d.newUsers,
      d.sessions,
      d.screenPageViews
    ]),
  })

  // Top pages table
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Top Pages', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Page', 'Pageviews', 'Avg Engagement', 'Bounce Rate', 'Sessions']],
    body: rawTopPages.value.map(p => [
      p.pagePath,
      p.screenPageViews,
      formatDuration(p.averageEngagementTime),
      `${p.bounceRate}%`,
      p.sessions
    ]),
  })

  // Countries
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Top Countries', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Country', 'Sessions', 'Active Users', 'New Users', 'Bounce Rate']],
    body: rawTopCountries.value.map(c => [
      c.country,
      c.sessions,
      c.activeUsers,
      c.newUsers,
      `${c.bounceRate}%`
    ]),
  })

  // Traffic sources
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Traffic Sources', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Source', 'Sessions', 'Active Users']],
    body: rawTrafficSources.value.map(s => [s.sessionSource, s.sessions, s.activeUsers]),
  })

  // Device categories
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Device Categories', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Device', 'Sessions', 'Active Users']],
    body: rawDeviceCategories.value.map(d => [d.deviceCategory, d.sessions, d.activeUsers]),
  })

  // User types
  doc.addPage()
  doc.setFontSize(14)
  doc.text('User Types', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Type', 'Sessions', 'Active Users']],
    body: rawUserTypes.value.map(u => [u.newVsReturning, u.sessions, u.activeUsers]),
  })

  // Hourly
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Sessions by Hour', margin, 20)
  doc.autoTable({
    startY: 25,
    head: [['Hour', 'Sessions', 'Active Users']],
    body: rawHourly.value.map(h => [`${h.hour}:00`, h.sessions, h.activeUsers]),
  })

  doc.save('site-analytics-report.pdf')
}

// ================= EXPORT EXCEL =================
function exportExcel() {
  if (!gaData.value) return

  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Users', rawSummary.value.totalUsers],
    ['New Users', rawSummary.value.newUsers],
    ['Sessions', rawSummary.value.sessions],
    ['Page Views', rawSummary.value.screenPageViews],
    ['Avg Engagement Time', rawSummary.value.averageSessionDuration],
    ['Bounce Rate', rawSummary.value.bounceRate],
    ['Engagement Rate', rawSummary.value.engagementRate],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Time series sheet
  const timeSeriesData = [
    ['Date', 'Active Users', 'New Users', 'Sessions', 'Page Views'],
    ...rawTimeSeries.value.map(d => [d.date, d.activeUsers, d.newUsers, d.sessions, d.screenPageViews])
  ]
  const timeSeriesSheet = XLSX.utils.aoa_to_sheet(timeSeriesData)
  XLSX.utils.book_append_sheet(wb, timeSeriesSheet, 'Daily Traffic')

  // Top pages sheet
  const pagesData = [
    ['Page', 'Pageviews', 'Avg Engagement (s)', 'Bounce Rate', 'Sessions'],
    ...rawTopPages.value.map(p => [p.pagePath, p.screenPageViews, p.averageEngagementTime, p.bounceRate, p.sessions])
  ]
  const pagesSheet = XLSX.utils.aoa_to_sheet(pagesData)
  XLSX.utils.book_append_sheet(wb, pagesSheet, 'Top Pages')

  // Countries sheet
  const countriesData = [
    ['Country', 'Sessions', 'Active Users', 'New Users', 'Bounce Rate'],
    ...rawTopCountries.value.map(c => [c.country, c.sessions, c.activeUsers, c.newUsers, c.bounceRate])
  ]
  const countriesSheet = XLSX.utils.aoa_to_sheet(countriesData)
  XLSX.utils.book_append_sheet(wb, countriesSheet, 'Countries')

  // Sources sheet
  const sourcesData = [
    ['Source', 'Sessions', 'Active Users'],
    ...rawTrafficSources.value.map(s => [s.sessionSource, s.sessions, s.activeUsers])
  ]
  const sourcesSheet = XLSX.utils.aoa_to_sheet(sourcesData)
  XLSX.utils.book_append_sheet(wb, sourcesSheet, 'Traffic Sources')

  // Devices sheet
  const devicesData = [
    ['Device', 'Sessions', 'Active Users'],
    ...rawDeviceCategories.value.map(d => [d.deviceCategory, d.sessions, d.activeUsers])
  ]
  const devicesSheet = XLSX.utils.aoa_to_sheet(devicesData)
  XLSX.utils.book_append_sheet(wb, devicesSheet, 'Devices')

  // User types sheet
  const userTypesData = [
    ['Type', 'Sessions', 'Active Users'],
    ...rawUserTypes.value.map(u => [u.newVsReturning, u.sessions, u.activeUsers])
  ]
  const userTypesSheet = XLSX.utils.aoa_to_sheet(userTypesData)
  XLSX.utils.book_append_sheet(wb, userTypesSheet, 'User Types')

  // Hourly sheet
  const hourlyData = [
    ['Hour', 'Sessions', 'Active Users'],
    ...rawHourly.value.map(h => [`${h.hour}:00`, h.sessions, h.activeUsers])
  ]
  const hourlySheet = XLSX.utils.aoa_to_sheet(hourlyData)
  XLSX.utils.book_append_sheet(wb, hourlySheet, 'Hourly')

  XLSX.writeFile(wb, 'site-analytics-report.xlsx')
}
</script>

<style scoped>
/* No additional styles needed; Tailwind classes handle everything */
</style>