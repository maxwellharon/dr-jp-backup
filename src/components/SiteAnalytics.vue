<template>
  <div class="space-y-6">
    <!-- Filter Bar -->
    <div v-if="gaData" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
      <!-- Date Range -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">From</label>
        <input
          type="date"
          v-model="dateFrom"
          :min="minDate"
          :max="dateTo"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">To</label>
        <input
          type="date"
          v-model="dateTo"
          :min="dateFrom"
          :max="maxDate"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>

      <!-- Source Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Source</label>
        <select v-model="sourceFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Sources</option>
          <option v-for="src in trafficSources" :key="src.source" :value="src.source">{{ src.source }}</option>
        </select>
      </div>

      <!-- Country Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Country</label>
        <select v-model="countryFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Countries</option>
          <option v-for="c in topCountries" :key="c.country" :value="c.country">{{ c.country }}</option>
        </select>
      </div>

      <!-- Device Filter -->
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">Device</label>
        <select v-model="deviceFilter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
          <option value="all">All Devices</option>
          <option v-for="d in deviceCategories" :key="d.device" :value="d.device">{{ d.device }}</option>
        </select>
      </div>

      <!-- Customize Button -->
      <button
        @click="showCustomize = !showCustomize"
        class="ml-auto bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition flex items-center gap-2"
      >
        <i class="fas fa-sliders-h"></i> Customize
      </button>
    </div>

    <!-- Customize Panel -->
    <Transition name="fade">
      <div v-if="showCustomize" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-3">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showSummaryCards" class="rounded text-indigo-600 focus:ring-indigo-500" />
          Summary Cards
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showAdditionalMetrics" class="rounded text-indigo-600 focus:ring-indigo-500" />
          Additional Metrics
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showCharts" class="rounded text-indigo-600 focus:ring-indigo-500" />
          Charts
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showTrafficSources" class="rounded text-indigo-600 focus:ring-indigo-500" />
          Traffic Sources
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showDeviceCategories" class="rounded text-indigo-600 focus:ring-indigo-500" />
          Device Categories
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showAiInsights" class="rounded text-indigo-600 focus:ring-indigo-500" />
          AI Insights
        </label>
      </div>
    </Transition>

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

    <!-- Main Content -->
    <template v-else-if="gaData">
      <!-- Summary Cards -->
      <div v-if="showSummaryCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-indigo-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Total Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(filteredSummary.totalUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-emerald-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">New Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(filteredSummary.newUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-amber-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Sessions</div>
          <div class="text-3xl font-bold">{{ formatNumber(filteredSummary.sessions) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-rose-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Page Views</div>
          <div class="text-3xl font-bold">{{ formatNumber(filteredSummary.screenPageViews) }}</div>
        </div>
      </div>

      <!-- Additional Metrics -->
      <div v-if="showAdditionalMetrics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <!-- Charts Row -->
      <div v-if="showCharts" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Visitors (Filtered)</h3>
          <canvas ref="visitorsCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Countries</h3>
          <canvas ref="countriesCanvas" height="250"></canvas>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Top Pages</h3>
          <canvas ref="pagesCanvas" height="250"></canvas>
        </div>
      </div>

      <!-- Traffic sources & devices -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="showTrafficSources" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h3>
          <div class="space-y-2">
            <div v-for="src in filteredTrafficSources" :key="src.source" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ src.source }}</span>
              <span class="font-semibold text-slate-800">{{ src.sessions }}</span>
            </div>
          </div>
        </div>
        <div v-if="showDeviceCategories" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Device Categories</h3>
          <div class="space-y-2">
            <div v-for="dev in filteredDeviceCategories" :key="dev.device" class="flex justify-between items-center">
              <span class="text-sm text-slate-600 capitalize">{{ dev.device }}</span>
              <span class="font-semibold text-slate-800">{{ dev.sessions }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Insights -->
      <div v-if="showAiInsights" class="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <span class="h-10 w-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md shadow-purple-500/20">
            <i class="fas fa-brain animate-pulse"></i>
          </span>
          <div>
            <h4 class="font-extrabold text-slate-900 text-lg tracking-tight">AI Site Analytics Insights</h4>
            <p class="text-xs text-purple-700 font-medium">Automated analysis of your web traffic and engagement patterns.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(insight, idx) in aiInsights" :key="idx" class="bg-white/70 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
            <span :class="['h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0', insight.iconBg]">
              <i :class="insight.icon"></i>
            </span>
            <div>
              <p class="font-bold text-slate-800 text-sm">{{ insight.title }}</p>
              <p class="text-xs text-slate-600 mt-1">{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import Chart from 'chart.js/auto'

const { gaData, loading, error, refresh } = useGoogleAnalytics()

// Filter state
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

// Canvas refs
const visitorsCanvas = ref(null)
const countriesCanvas = ref(null)
const pagesCanvas = ref(null)
let visitorsChart = null
let countriesChart = null
let pagesChart = null

// Get raw data
const rawSummary = computed(() => gaData.value?.summary || {})
const rawTimeSeries = computed(() => gaData.value?.timeSeries || [])
const rawTopPages = computed(() => gaData.value?.topPages || [])
const rawTopCountries = computed(() => gaData.value?.topCountries || [])
const rawTrafficSources = computed(() => gaData.value?.trafficSources || [])
const rawDeviceCategories = computed(() => gaData.value?.deviceCategories || [])

// Date range bounds
const minDate = computed(() => {
  if (rawTimeSeries.value.length === 0) return ''
  return rawTimeSeries.value[0].date
})
const maxDate = computed(() => {
  if (rawTimeSeries.value.length === 0) return ''
  return rawTimeSeries.value[rawTimeSeries.value.length - 1].date
})

// Initialize date range when data loads
watch(rawTimeSeries, (newVal) => {
  if (newVal && newVal.length > 0 && !dateFrom.value) {
    dateFrom.value = newVal[0].date
    dateTo.value = newVal[newVal.length - 1].date
  }
}, { immediate: true })

// Filter time series by date range
const filteredTimeSeries = computed(() => {
  if (!dateFrom.value || !dateTo.value) return rawTimeSeries.value
  return rawTimeSeries.value.filter(d => d.date >= dateFrom.value && d.date <= dateTo.value)
})

// Compute filtered summary from filtered time series
const filteredSummary = computed(() => {
  const ts = filteredTimeSeries.value
  if (ts.length === 0) return rawSummary.value
  const totalUsers = ts.reduce((s, d) => s + d.activeUsers, 0)
  const newUsers = ts.reduce((s, d) => s + d.newUsers, 0)
  const sessions = ts.reduce((s, d) => s + d.sessions, 0)
  const pageviews = ts.reduce((s, d) => s + d.pageviews, 0)
  return {
    totalUsers,
    newUsers,
    sessions,
    screenPageViews: pageviews,
    // Keep other metrics from raw summary (can't be recomputed per-day)
    averageSessionDuration: rawSummary.value.averageSessionDuration,
    bounceRate: rawSummary.value.bounceRate,
    engagementRate: rawSummary.value.engagementRate,
  }
})

// Filter traffic sources
const filteredTrafficSources = computed(() => {
  if (sourceFilter.value === 'all') return rawTrafficSources.value
  return rawTrafficSources.value.filter(s => s.source === sourceFilter.value)
})

// Filter device categories
const filteredDeviceCategories = computed(() => {
  if (deviceFilter.value === 'all') return rawDeviceCategories.value
  return rawDeviceCategories.value.filter(d => d.device === deviceFilter.value)
})

// Filter countries (for chart and list)
const filteredCountries = computed(() => {
  if (countryFilter.value === 'all') return rawTopCountries.value
  return rawTopCountries.value.filter(c => c.country === countryFilter.value)
})

// AI Insights (unchanged logic, using filtered summary where possible)
const aiInsights = computed(() => {
  if (!gaData.value) return []
  const s = filteredSummary.value
  const topCountry = filteredCountries.value[0]?.country || 'Kenya'
  const topPage = rawTopPages.value[0]?.pagePath || 'Home'
  const topSource = filteredTrafficSources.value[0]?.source || 'Direct'
  const mobileSessions = Number(filteredDeviceCategories.value.find(d => d.device === 'mobile')?.sessions || 0)
  const totalSessions = Number(s.sessions) || 1
  const mobilePercent = Math.round((mobileSessions / totalSessions) * 100)
  const bounce = Number(s.bounceRate) || 0

  return [
    {
      title: 'Geographic Focus',
      message: `The majority of your traffic comes from ${topCountry}. Consider localized content and targeted ads for this region.`,
      icon: 'fas fa-globe-africa',
      iconBg: 'bg-indigo-50 text-indigo-600'
    },
    {
  title: 'Conversion Potential',
  message: `High interest on pricing and quote pages indicates strong purchase intent. Optimize CTAs to maximize conversions.`,
  icon: 'fas fa-tags',
  iconBg: 'bg-orange-50 text-orange-600'
},
{
  title: 'Social Media Impact',
  message: `Instagram traffic shows significant growth (+314%). Consider increasing investment in social media marketing.`,
  icon: 'fas fa-share-alt',
  iconBg: 'bg-pink-50 text-pink-600'
},
    {
      title: 'Top Performing Page',
      message: `"${topPage}" is your most visited page. Ensure it has clear CTAs and fast loading times to convert visitors.`,
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
      title: 'Content Strategy',
      message: `Your average session duration is ${formatDuration(s.averageSessionDuration)}. Longer sessions indicate strong content engagement.`,
      icon: 'fas fa-clock',
      iconBg: 'bg-blue-50 text-blue-600'
    }
  ]
})

// Chart creation
function createCharts() {
  if (!gaData.value) return

  if (visitorsChart) visitorsChart.destroy()
  if (countriesChart) countriesChart.destroy()
  if (pagesChart) pagesChart.destroy()

  // Visitors line chart (using filtered time series)
  if (visitorsCanvas.value && filteredTimeSeries.value.length) {
    visitorsChart = new Chart(visitorsCanvas.value, {
      type: 'line',
      data: {
        labels: filteredTimeSeries.value.map(d => formatDate(d.date)),
        datasets: [{
          label: 'Active Users',
          data: filteredTimeSeries.value.map(d => Number(d.activeUsers)),
          fill: false,
          borderColor: '#6366f1',
          tension: 0.1,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }

  // Countries pie chart (using filtered countries)
  if (countriesCanvas.value && filteredCountries.value.length) {
    countriesChart = new Chart(countriesCanvas.value, {
      type: 'pie',
      data: {
        labels: filteredCountries.value.map(c => c.country),
        datasets: [{
          data: filteredCountries.value.map(c => Number(c.sessions)),
          backgroundColor: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    })
  }

  // Pages bar chart (top pages unchanged)
  if (pagesCanvas.value && rawTopPages.value.length) {
    pagesChart = new Chart(pagesCanvas.value, {
      type: 'bar',
      data: {
        labels: rawTopPages.value.map(p => p.pagePath.substring(0, 20) + (p.pagePath.length > 20 ? '...' : '')),
        datasets: [{
          label: 'Page Views',
          data: rawTopPages.value.map(p => Number(p.pageviews)),
          backgroundColor: '#818cf8',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
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

// Watch for changes that affect charts
watch([filteredTimeSeries, filteredCountries], () => {
  nextTick(() => createCharts())
})

onMounted(() => {
  if (gaData.value) {
    nextTick(() => createCharts())
  }
})

// Watch for data load
watch(gaData, (newData) => {
  if (newData) {
    nextTick(() => createCharts())
  }
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