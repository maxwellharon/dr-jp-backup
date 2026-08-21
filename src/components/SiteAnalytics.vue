<template>
  <div class="space-y-6">
    <!-- Filter Bar -->
    <div v-if="gaData" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
      <!-- Date Range -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">From</label>
        <input type="date" v-model="dateFrom" :min="minDate" :max="dateTo" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
      </div>
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">To</label>
        <input type="date" v-model="dateTo" :min="dateFrom" :max="maxDate" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
      </div>

      <!-- Source Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Source</label>
        <select v-model="sourceFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Sources</option>
          <option v-for="src in rawTrafficSources" :key="src.sessionSource" :value="src.sessionSource">{{ src.sessionSource }}</option>
        </select>
      </div>

      <!-- Country Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Country</label>
        <select v-model="countryFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Countries</option>
          <option v-for="c in rawTopCountries" :key="c.country" :value="c.country">{{ c.country }}</option>
        </select>
      </div>

      <!-- Device Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Device</label>
        <select v-model="deviceFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Devices</option>
          <option v-for="d in rawDeviceCategories" :key="d.deviceCategory" :value="d.deviceCategory">{{ d.deviceCategory }}</option>
        </select>
      </div>

      <!-- Customize Button -->
      <button @click="showCustomize = !showCustomize" class="ml-auto bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition flex items-center gap-2">
        <i class="fas fa-sliders-h"></i> Customize
      </button>
    </div>

    <!-- Customize Panel -->
    <Transition name="fade">
      <div v-if="showCustomize" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showSummaryCards" class="rounded text-indigo-600" /> Summary Cards</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showAdditionalMetrics" class="rounded text-indigo-600" /> Additional Metrics</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showCharts" class="rounded text-indigo-600" /> Charts</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showTrafficSources" class="rounded text-indigo-600" /> Traffic Sources</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showDeviceCategories" class="rounded text-indigo-600" /> Device Categories</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showAiInsights" class="rounded text-indigo-600" /> AI Insights</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showMap" class="rounded text-indigo-600" /> World Map</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="showPageTable" class="rounded text-indigo-600" /> Page Analysis Table</label>
      </div>
    </Transition>

    <!-- Loading / Error -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      <p class="text-sm font-medium text-slate-500 mt-4">Fetching site analytics...</p>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
      <p class="text-red-700 font-semibold">Failed to load site data</p>
      <p class="text-xs text-red-500 mt-1">{{ error }}</p>
      <button @click="refresh" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">Retry</button>
    </div>

    <!-- Main Content -->
    <template v-else-if="gaData">
      <!-- Summary Cards (interactive) -->
      <div v-if="showSummaryCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="card in summaryCards" :key="card.key" @click="openModal(card.key)" class="bg-white p-5 rounded-2xl shadow-md border-l-8 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1" :class="card.borderClass">
          <div class="text-slate-500 text-sm">{{ card.label }}</div>
          <div class="text-3xl font-bold">{{ card.value }}</div>
          <div class="text-xs text-slate-400 mt-1">Click for details</div>
        </div>
      </div>

      <!-- Additional Metrics + Live Visitors -->
      <div v-if="showAdditionalMetrics" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Avg Engagement Time</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatDuration(filteredSummary.averageSessionDuration) }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Bounce Rate</p>
          <p class="text-2xl font-bold text-slate-800">{{ filteredSummary.bounceRate }}%</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Engagement Rate</p>
          <p class="text-2xl font-bold text-slate-800">{{ filteredSummary.engagementRate }}%</p>
        </div>
        <div class="bg-indigo-50 p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-indigo-500 uppercase flex items-center gap-2">
              <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
              Live Visitors
            </p>
            <p class="text-3xl font-bold text-indigo-700">{{ realtimeUsers }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div v-if="showCharts" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Active Users (Filtered)</h3>
          <canvas ref="visitorsCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Sessions & Pageviews</h3>
          <canvas ref="sessionsCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Countries</h3>
          <canvas ref="countriesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Pages</h3>
          <canvas ref="pagesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h3>
          <canvas ref="sourcesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Device Categories</h3>
          <canvas ref="devicesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Sessions by Hour</h3>
          <canvas ref="hourlyCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">New vs Returning</h3>
          <canvas ref="userTypesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Page Engagement</h3>
          <canvas ref="engagementCanvas" height="250"></canvas>
        </div>
      </div>

      <!-- World Map -->
      <div v-if="showMap" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Geographical Distribution</h3>
        <div ref="mapContainer" class="h-96 rounded-xl border border-slate-100"></div>
      </div>

      <!-- Traffic Sources & Devices Lists -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="showTrafficSources" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h3>
          <div class="space-y-2">
            <div v-for="src in filteredTrafficSources" :key="src.sessionSource" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ src.sessionSource }}</span>
              <span class="font-semibold text-slate-800">{{ src.sessions }} sessions</span>
            </div>
          </div>
        </div>
        <div v-if="showDeviceCategories" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Device Categories</h3>
          <div class="space-y-2">
            <div v-for="dev in filteredDeviceCategories" :key="dev.deviceCategory" class="flex justify-between items-center">
              <span class="text-sm text-slate-600 capitalize">{{ dev.deviceCategory }}</span>
              <span class="font-semibold text-slate-800">{{ dev.sessions }} sessions</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Page Analysis Table -->
      <div v-if="showPageTable" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <h3 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Top Pages – Engagement Analysis</h3>
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
            <tr v-for="page in rawTopPages" :key="page.pagePath" class="hover:bg-slate-50">
              <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ page.pagePath }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.screenPageViews }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ formatDuration(page.averageEngagementTime) }}</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.bounceRate }}%</td>
              <td class="px-4 py-2 text-sm text-slate-600">{{ page.sessions }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- AI Insights -->
      <div v-if="showAiInsights" class="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <span class="h-10 w-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md shadow-purple-500/20"><i class="fas fa-brain animate-pulse"></i></span>
          <div>
            <h4 class="font-extrabold text-slate-900 text-lg tracking-tight">AI Site Analytics Insights</h4>
            <p class="text-xs text-purple-700 font-medium">Automated analysis of your web traffic and engagement patterns.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(insight, idx) in aiInsights" :key="idx" class="bg-white/70 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
            <span :class="['h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0', insight.iconBg]"><i :class="insight.icon"></i></span>
            <div>
              <p class="font-bold text-slate-800 text-sm">{{ insight.title }}</p>
              <p class="text-xs text-slate-600 mt-1">{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal for Summary Card Details -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedCard" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="selectedCard = null">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-bold text-slate-900">{{ selectedCardLabel }} – Detailed Analysis</h3>
              <button @click="selectedCard = null" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times text-xl"></i></button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-500">Total</p><p class="font-bold text-lg">{{ modalTotal }}</p></div>
              <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-500">Daily Avg</p><p class="font-bold text-lg">{{ modalAverage }}</p></div>
              <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-500">Max Day</p><p class="font-bold text-lg">{{ modalMax }}</p></div>
              <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-500">Min Day</p><p class="font-bold text-lg">{{ modalMin }}</p></div>
            </div>
            <canvas ref="modalChartCanvas" height="200"></canvas>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import Chart from 'chart.js/auto'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const { gaData, loading, error, realtimeUsers, refresh, fetchRealtime } = useGoogleAnalytics()

// ================= FILTER STATE =================
const dateFrom = ref('')
const dateTo = ref('')
const sourceFilter = ref('all')
const countryFilter = ref('all')
const deviceFilter = ref('all')
const showCustomize = ref(false)
const showSummaryCards = ref(true)
const showAdditionalMetrics = ref(true)
const showCharts = ref(true)
const showTrafficSources = ref(true)
const showDeviceCategories = ref(true)
const showAiInsights = ref(true)
const showMap = ref(true)
const showPageTable = ref(true)

// Canvas refs
const visitorsCanvas = ref(null)
const sessionsCanvas = ref(null)
const countriesCanvas = ref(null)
const pagesCanvas = ref(null)
const sourcesCanvas = ref(null)
const devicesCanvas = ref(null)
const hourlyCanvas = ref(null)
const userTypesCanvas = ref(null)
const engagementCanvas = ref(null)
const modalChartCanvas = ref(null)
const mapContainer = ref(null)

let map = null
let modalChart = null
let charts = []

// ================= RAW DATA =================
const rawSummary = computed(() => gaData.value?.summary || {})
const rawTimeSeries = computed(() => gaData.value?.timeSeries || [])
const rawTopPages = computed(() => gaData.value?.topPages || [])
const rawTopCountries = computed(() => gaData.value?.topCountries || [])
const rawTrafficSources = computed(() => gaData.value?.trafficSources || [])
const rawDeviceCategories = computed(() => gaData.value?.deviceCategories || [])
const rawUserTypes = computed(() => gaData.value?.userTypes || [])
const rawHourly = computed(() => gaData.value?.hourly || [])

// ================= DATE BOUNDS =================
const minDate = computed(() => rawTimeSeries.value[0]?.date || '')
const maxDate = computed(() => rawTimeSeries.value[rawTimeSeries.value.length - 1]?.date || '')

watch(rawTimeSeries, (newVal) => {
  if (newVal?.length && !dateFrom.value) {
    dateFrom.value = newVal[0].date
    dateTo.value = newVal[newVal.length - 1].date
  }
}, { immediate: true })

// ================= FILTERED COMPUTED =================
const filteredTimeSeries = computed(() => {
  if (!dateFrom.value || !dateTo.value) return rawTimeSeries.value
  return rawTimeSeries.value.filter(d => d.date >= dateFrom.value && d.date <= dateTo.value)
})

const filteredSummary = computed(() => {
  const ts = filteredTimeSeries.value
  if (!ts.length) return rawSummary.value
  const totalUsers = ts.reduce((s, d) => s + (Number(d.activeUsers) || 0), 0)
  const newUsers = ts.reduce((s, d) => s + (Number(d.newUsers) || 0), 0)
  const sessions = ts.reduce((s, d) => s + (Number(d.sessions) || 0), 0)
  const pageviews = ts.reduce((s, d) => s + (Number(d.screenPageViews) || 0), 0)
  return {
    totalUsers,
    newUsers,
    sessions,
    screenPageViews: pageviews,
    averageSessionDuration: rawSummary.value.averageSessionDuration,
    bounceRate: rawSummary.value.bounceRate,
    engagementRate: rawSummary.value.engagementRate,
  }
})

const filteredTrafficSources = computed(() => {
  if (sourceFilter.value === 'all') return rawTrafficSources.value
  return rawTrafficSources.value.filter(s => s.sessionSource === sourceFilter.value)
})

const filteredDeviceCategories = computed(() => {
  if (deviceFilter.value === 'all') return rawDeviceCategories.value
  return rawDeviceCategories.value.filter(d => d.deviceCategory === deviceFilter.value)
})

const filteredCountries = computed(() => {
  if (countryFilter.value === 'all') return rawTopCountries.value
  return rawTopCountries.value.filter(c => c.country === countryFilter.value)
})

// ================= SUMMARY CARDS =================
const summaryCards = computed(() => [
  { key: 'totalUsers', label: 'Total Users', value: formatNumber(filteredSummary.value.totalUsers), borderClass: 'border-indigo-500', timeSeriesKey: 'activeUsers' },
  { key: 'newUsers', label: 'New Users', value: formatNumber(filteredSummary.value.newUsers), borderClass: 'border-emerald-500', timeSeriesKey: 'newUsers' },
  { key: 'sessions', label: 'Sessions', value: formatNumber(filteredSummary.value.sessions), borderClass: 'border-amber-500', timeSeriesKey: 'sessions' },
  { key: 'screenPageViews', label: 'Page Views', value: formatNumber(filteredSummary.value.screenPageViews), borderClass: 'border-rose-500', timeSeriesKey: 'screenPageViews' },
])

// ================= MODAL LOGIC =================
const selectedCard = ref(null)
const selectedCardLabel = computed(() => summaryCards.value.find(c => c.key === selectedCard.value)?.label || '')
const modalTimeSeriesKey = computed(() => summaryCards.value.find(c => c.key === selectedCard.value)?.timeSeriesKey || '')

const modalData = computed(() => {
  if (!selectedCard.value || !modalTimeSeriesKey.value) return []
  return filteredTimeSeries.value.map(d => ({
    date: d.date,
    value: Number(d[modalTimeSeriesKey.value] || 0)
  }))
})

const modalTotal = computed(() => modalData.value.reduce((s, d) => s + d.value, 0).toLocaleString())
const modalAverage = computed(() => {
  if (!modalData.value.length) return '0'
  return (modalData.value.reduce((s, d) => s + d.value, 0) / modalData.value.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
})
const modalMax = computed(() => Math.max(...modalData.value.map(d => d.value)).toLocaleString())
const modalMin = computed(() => Math.min(...modalData.value.map(d => d.value)).toLocaleString())

function openModal(key) {
  selectedCard.value = key
  nextTick(() => createModalChart())
}

function createModalChart() {
  if (modalChart) modalChart.destroy()
  if (!modalChartCanvas.value || !modalData.value.length) return
  modalChart = new Chart(modalChartCanvas.value, {
    type: 'line',
    data: {
      labels: modalData.value.map(d => formatDate(d.date)),
      datasets: [{
        label: selectedCardLabel.value,
        data: modalData.value.map(d => d.value),
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  })
}

// ================= CHART CREATION =================
function destroyCharts() {
  charts.forEach(c => c.destroy())
  charts = []
}

function createAllCharts() {
  if (!gaData.value) return
  destroyCharts()

  // 1. Visitors line (Active Users + New Users)
  if (visitorsCanvas.value && filteredTimeSeries.value.length) {
    charts.push(new Chart(visitorsCanvas.value, {
      type: 'line',
      data: {
        labels: filteredTimeSeries.value.map(d => formatDate(d.date)),
        datasets: [
          { label: 'Active Users', data: filteredTimeSeries.value.map(d => d.activeUsers), borderColor: '#6366f1', tension: 0.2, fill: false, pointBackgroundColor: '#6366f1' },
          { label: 'New Users', data: filteredTimeSeries.value.map(d => d.newUsers), borderColor: '#10b981', tension: 0.2, fill: false, pointBackgroundColor: '#10b981' }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // 2. Sessions vs Pageviews
  if (sessionsCanvas.value && filteredTimeSeries.value.length) {
    charts.push(new Chart(sessionsCanvas.value, {
      type: 'bar',
      data: {
        labels: filteredTimeSeries.value.map(d => formatDate(d.date)),
        datasets: [
          { label: 'Sessions', data: filteredTimeSeries.value.map(d => d.sessions), backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: 'Pageviews', data: filteredTimeSeries.value.map(d => d.screenPageViews), backgroundColor: '#818cf8', borderRadius: 4 }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // 3. Top Countries bar
  if (countriesCanvas.value && filteredCountries.value.length) {
    charts.push(new Chart(countriesCanvas.value, {
      type: 'bar',
      data: {
        labels: filteredCountries.value.map(c => c.country),
        datasets: [{ label: 'Sessions', data: filteredCountries.value.map(c => c.sessions), backgroundColor: '#8b5cf6', borderRadius: 6 }]
      },
      options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    }))
  }

  // 4. Top Pages bar
  if (pagesCanvas.value && rawTopPages.value.length) {
    charts.push(new Chart(pagesCanvas.value, {
      type: 'bar',
      data: {
        labels: rawTopPages.value.map(p => p.pagePath.substring(0, 25) + (p.pagePath.length > 25 ? '...' : '')),
        datasets: [{ label: 'Pageviews', data: rawTopPages.value.map(p => p.screenPageViews), backgroundColor: '#10b981', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // 5. Traffic Sources doughnut
  if (sourcesCanvas.value && rawTrafficSources.value.length) {
    charts.push(new Chart(sourcesCanvas.value, {
      type: 'doughnut',
      data: {
        labels: rawTrafficSources.value.map(s => s.sessionSource),
        datasets: [{ data: rawTrafficSources.value.map(s => s.sessions), backgroundColor: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16','#f97316','#06b6d4'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }))
  }

  // 6. Device Categories pie
  if (devicesCanvas.value && rawDeviceCategories.value.length) {
    charts.push(new Chart(devicesCanvas.value, {
      type: 'pie',
      data: {
        labels: rawDeviceCategories.value.map(d => d.deviceCategory),
        datasets: [{ data: rawDeviceCategories.value.map(d => d.sessions), backgroundColor: ['#6366f1','#10b981','#f59e0b'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }))
  }

  // 7. Hourly sessions
  if (hourlyCanvas.value && rawHourly.value.length) {
    charts.push(new Chart(hourlyCanvas.value, {
      type: 'line',
      data: {
        labels: rawHourly.value.map(h => `${h.hour}:00`),
        datasets: [{ label: 'Sessions', data: rawHourly.value.map(h => h.sessions), borderColor: '#f97316', tension: 0.3, fill: true, backgroundColor: 'rgba(249, 115, 22, 0.1)' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    }))
  }

  // 8. User Types doughnut
  if (userTypesCanvas.value && rawUserTypes.value.length) {
    charts.push(new Chart(userTypesCanvas.value, {
      type: 'doughnut',
      data: {
        labels: rawUserTypes.value.map(u => u.newVsReturning),
        datasets: [{ data: rawUserTypes.value.map(u => u.sessions), backgroundColor: ['#6366f1','#10b981'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }))
  }

  // 9. Page Engagement bubble (x: avg engagement time, y: bounce rate, r: pageviews)
  if (engagementCanvas.value && rawTopPages.value.length) {
    charts.push(new Chart(engagementCanvas.value, {
      type: 'bubble',
      data: {
        datasets: rawTopPages.value.map((p, i) => ({
          label: p.pagePath,
          data: [{ x: Number(p.averageEngagementTime), y: Number(p.bounceRate), r: Math.sqrt(Number(p.screenPageViews)) / 10 }],
          backgroundColor: `hsla(${i * 40}, 70%, 60%, 0.6)`
        }))
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Avg Engagement Time (s)' } },
          y: { title: { display: true, text: 'Bounce Rate (%)' }, beginAtZero: true }
        }
      }
    }))
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
  return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}
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

// ================= MAP INITIALIZATION =================
const countryCoords = {
  'Kenya': [-1.286389, 36.817223],
  'United States': [37.09024, -95.712891],
  'United Kingdom': [55.378051, -3.435973],
  'India': [20.593684, 78.96288],
  'Germany': [51.165691, 10.451526],
  'Nigeria': [9.081999, 8.675277],
  'South Africa': [-30.559482, 22.937506],
  'Canada': [56.130366, -106.346771],
  'Australia': [-25.274398, 133.775136],
  'Netherlands': [52.132633, 5.291266],
  'France': [46.227638, 2.213749],
  'Brazil': [-14.235004, -51.92528],
  'Tanzania': [-6.369028, 34.888822],
  'Uganda': [1.373333, 32.290275],
  'Rwanda': [-1.940278, 29.873888],
  'Ethiopia': [9.145, 40.489673],
  'China': [35.86166, 104.195397],
  'Japan': [36.204824, 138.252924],
  'United Arab Emirates': [23.424076, 53.847818],
  'Saudi Arabia': [23.885942, 45.079162],
}

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value).setView([20, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  updateMapMarkers()
}

function updateMapMarkers() {
  if (!map) return
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) map.removeLayer(layer)
  })
  filteredCountries.value.forEach(c => {
    const coords = countryCoords[c.country]
    if (coords) {
      const circle = L.circleMarker(coords, {
        radius: Math.min(20, Math.sqrt(c.sessions) / 10),
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.6
      }).addTo(map)
      circle.bindPopup(`<b>${c.country}</b><br>Sessions: ${c.sessions}<br>Users: ${c.activeUsers}`)
    }
  })
}

// ================= AI INSIGHTS =================
const aiInsights = computed(() => {
  if (!gaData.value) return []
  const s = filteredSummary.value
  const topCountry = filteredCountries.value[0]?.country || 'Unknown'
  const topPage = rawTopPages.value[0]?.pagePath || 'Home'
  const topSource = rawTrafficSources.value[0]?.sessionSource || 'Direct'
  const mobile = rawDeviceCategories.value.find(d => d.deviceCategory === 'mobile')?.sessions || 0
  const totalSessions = Number(s.sessions) || 1
  const mobilePercent = Math.round((mobile / totalSessions) * 100)
  const bounce = Number(s.bounceRate) || 0
  const returning = rawUserTypes.value.find(u => u.newVsReturning === 'returning')?.sessions || 0
  const returningPercent = Math.round((returning / totalSessions) * 100)
  const topPageTime = rawTopPages.value[0]?.averageEngagementTime || 0
  const worstPage = rawTopPages.value.slice().sort((a,b) => b.bounceRate - a.bounceRate)[0]

  return [
    {
      title: 'Geographic Focus',
      message: `The majority of your traffic comes from ${topCountry}. Consider localized content and targeted ads for this region.`,
      icon: 'fas fa-globe-africa',
      iconBg: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Top Performing Page',
      message: `"${topPage}" is your most visited page with an average engagement of ${formatDuration(topPageTime)}. Ensure it has clear CTAs.`,
      icon: 'fas fa-file-alt',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Traffic Acquisition',
      message: `Most sessions originate from ${topSource}. Invest more in this channel or diversify to reduce dependency.`,
      icon: 'fas fa-chart-line',
      iconBg: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Mobile Experience',
      message: `${mobilePercent}% of sessions come from mobile devices. Optimize mobile UX to reduce bounce and improve engagement.`,
      icon: 'fas fa-mobile-alt',
      iconBg: 'bg-rose-50 text-rose-600'
    },
    {
      title: 'Engagement Health',
      message: `Bounce rate is ${bounce}%. ${bounce > 50 ? 'Consider improving content relevance or page speed.' : 'You are doing well, keep monitoring.'}`,
      icon: 'fas fa-heartbeat',
      iconBg: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Audience Retention',
      message: `${returningPercent}% of your sessions are from returning users. ${returningPercent < 30 ? 'Focus on retention strategies like email marketing.' : 'Your audience loyalty is strong.'}`,
      icon: 'fas fa-users',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Problem Page',
      message: `"${worstPage?.pagePath}" has the highest bounce rate (${worstPage?.bounceRate}%). Consider redesigning this page or improving its content.`,
      icon: 'fas fa-exclamation-circle',
      iconBg: 'bg-red-50 text-red-600'
    },
    {
      title: 'Content Strategy',
      message: `Your average session duration is ${formatDuration(s.averageSessionDuration)}. Longer sessions indicate strong content engagement.`,
      icon: 'fas fa-clock',
      iconBg: 'bg-teal-50 text-teal-600'
    }
  ]
})

// ================= WATCHERS & LIFECYCLE =================
watch([filteredTimeSeries, filteredCountries, sourceFilter, deviceFilter], () => {
  nextTick(() => {
    createAllCharts()
    updateMapMarkers()
  })
})

watch(gaData, (newData) => {
  if (newData) {
    nextTick(() => {
      createAllCharts()
      if (showMap.value) initMap()
    })
  }
})

onMounted(() => {
  if (gaData.value) {
    nextTick(() => {
      createAllCharts()
      if (showMap.value) initMap()
    })
  }
})

onUnmounted(() => {
  destroyCharts()
})
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

<style>
/* Leaflet CSS required for map */
@import 'leaflet/dist/leaflet.css';
</style>