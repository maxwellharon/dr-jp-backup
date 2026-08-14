<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      <p class="text-sm font-medium text-slate-500 mt-4">Fetching site analytics from Google...</p>
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

    <!-- GA Data -->
    <template v-else-if="gaData">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-indigo-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Total Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.totalUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-emerald-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">New Users</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.newUsers) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-amber-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Sessions</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.sessions) }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-rose-500 hover:shadow-lg transition transform hover:-translate-y-1">
          <div class="text-slate-500 text-sm">Page Views</div>
          <div class="text-3xl font-bold">{{ formatNumber(summary.screenPageViews) }}</div>
        </div>
      </div>

      <!-- Additional Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Avg Engagement Time</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatDuration(summary.averageSessionDuration) }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Bounce Rate</p>
          <p class="text-2xl font-bold text-slate-800">{{ summary.bounceRate }}%</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p class="text-xs font-medium text-slate-400 uppercase">Engagement Rate</p>
          <p class="text-2xl font-bold text-slate-800">{{ summary.engagementRate }}%</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Visitors (Last 30 Days)</h3>
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
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h3>
          <div class="space-y-2">
            <div v-for="src in trafficSources" :key="src.source" class="flex justify-between items-center">
              <span class="text-sm text-slate-600">{{ src.source }}</span>
              <span class="font-semibold text-slate-800">{{ src.sessions }}</span>
            </div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">Device Categories</h3>
          <div class="space-y-2">
            <div v-for="dev in deviceCategories" :key="dev.device" class="flex justify-between items-center">
              <span class="text-sm text-slate-600 capitalize">{{ dev.device }}</span>
              <span class="font-semibold text-slate-800">{{ dev.sessions }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Insights -->
      <div class="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200 rounded-3xl p-6 md:p-8 shadow-sm">
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

const visitorsCanvas = ref(null)
const countriesCanvas = ref(null)
const pagesCanvas = ref(null)
let visitorsChart = null
let countriesChart = null
let pagesChart = null

const summary = computed(() => gaData.value?.summary || {})
const timeSeries = computed(() => gaData.value?.timeSeries || [])
const topCountries = computed(() => gaData.value?.topCountries || [])
const topPages = computed(() => gaData.value?.topPages || [])
const trafficSources = computed(() => gaData.value?.trafficSources || [])
const deviceCategories = computed(() => gaData.value?.deviceCategories || [])

const aiInsights = computed(() => {
  if (!gaData.value) return []
  const s = summary.value
  const topCountry = topCountries.value[0]?.country || 'Kenya'
  const topPage = topPages.value[0]?.pagePath || 'Home'
  const topSource = trafficSources.value[0]?.source || 'Direct'
  const mobileSessions = Number(deviceCategories.value.find(d => d.device === 'mobile')?.sessions || 0)
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

function createCharts() {
  if (!gaData.value) return

  // Destroy existing charts
  if (visitorsChart) visitorsChart.destroy()
  if (countriesChart) countriesChart.destroy()
  if (pagesChart) pagesChart.destroy()

  // Visitors chart
  if (visitorsCanvas.value) {
    visitorsChart = new Chart(visitorsCanvas.value, {
      type: 'line',
      data: {
        labels: timeSeries.value.map(d => formatDate(d.date)),
        datasets: [{
          label: 'Active Users',
          data: timeSeries.value.map(d => Number(d.activeUsers)),
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

  // Countries chart
  if (countriesCanvas.value) {
    countriesChart = new Chart(countriesCanvas.value, {
      type: 'pie',
      data: {
        labels: topCountries.value.map(c => c.country),
        datasets: [{
          data: topCountries.value.map(c => Number(c.sessions)),
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

  // Pages chart
  if (pagesCanvas.value) {
    pagesChart = new Chart(pagesCanvas.value, {
      type: 'bar',
      data: {
        labels: topPages.value.map(p => p.pagePath.substring(0, 20) + (p.pagePath.length > 20 ? '...' : '')),
        datasets: [{
          label: 'Page Views',
          data: topPages.value.map(p => Number(p.pageviews)),
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
</script>