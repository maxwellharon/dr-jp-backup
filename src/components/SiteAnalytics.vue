<template>
  <div class="space-y-6">
    <!-- ================= FILTER BAR ================= -->
    <div
      v-if="gaData"
      class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end"
    >
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">From</label>

        <input
          v-model="dateFrom"
          type="date"
          :min="minDate"
          :max="dateTo || maxDate"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>

      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">To</label>

        <input
          v-model="dateTo"
          type="date"
          :min="dateFrom || minDate"
          :max="maxDate"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
      </div>

      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">
          Source
        </label>

        <select
          v-model="sourceFilter"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
        >
          <option value="all">All Sources</option>

          <option
            v-for="src in rawTrafficSources"
            :key="src.sessionSource"
            :value="src.sessionSource"
          >
            {{ src.sessionSource }}
          </option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">
          Country
        </label>

        <select
          v-model="countryFilter"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
        >
          <option value="all">All Countries</option>

          <option
            v-for="country in rawTopCountries"
            :key="country.country"
            :value="country.country"
          >
            {{ country.country }}
          </option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="text-xs font-semibold text-slate-500 mb-1">
          Device
        </label>

        <select
          v-model="deviceFilter"
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
        >
          <option value="all">All Devices</option>

          <option
            v-for="device in rawDeviceCategories"
            :key="device.deviceCategory"
            :value="device.deviceCategory"
          >
            {{ device.deviceCategory }}
          </option>
        </select>
      </div>

      <button
        type="button"
        @click="showCustomize = !showCustomize"
        class="ml-auto bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition flex items-center gap-2"
      >
        <i class="fas fa-sliders-h"></i>

        Customize
      </button>
    </div>

    <!-- ================= CUSTOMIZE PANEL ================= -->
    <Transition name="fade">
      <div
        v-if="showCustomize"
        class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showSummaryCards"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Summary Cards
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showAdditionalMetrics"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Additional Metrics
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showCharts"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Charts
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showTrafficSources"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Traffic Sources
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showDeviceCategories"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Device Categories
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showAiInsights"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          AI Insights
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showMap"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          World Map
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input
            v-model="showPageTable"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          Page Analysis Table
        </label>
      </div>
    </Transition>

    <!-- ================= LOADING ================= -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"
      ></div>

      <p class="text-sm font-medium text-slate-500 mt-4">
        Fetching site analytics...
      </p>
    </div>

    <!-- ================= ERROR ================= -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
    >
      <i
        class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"
      ></i>

      <p class="text-red-700 font-semibold">
        Failed to load site data
      </p>

      <p class="text-xs text-red-500 mt-1">
        {{ error }}
      </p>

      <button
        type="button"
        @click="refresh"
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- ================= MAIN CONTENT ================= -->
    <template v-else-if="gaData">
      <!-- ================= SUMMARY CARDS ================= -->
      <div
        v-if="showSummaryCards"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <button
          v-for="card in summaryCards"
          :key="card.key"
          type="button"
          @click="openModal(card.key)"
          class="bg-white p-5 rounded-2xl shadow-md border-l-8 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1 text-left"
          :class="card.borderClass"
        >
          <div class="text-slate-500 text-sm">
            {{ card.label }}
          </div>

          <div class="text-3xl font-bold text-slate-900 mt-1">
            {{ card.value }}
          </div>

          <div class="text-xs text-slate-400 mt-1">
            Click for details
          </div>
        </button>
      </div>

      <!-- ================= ADDITIONAL METRICS ================= -->
      <div
        v-if="showAdditionalMetrics"
        class="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div
          class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
        >
          <p class="text-xs font-medium text-slate-400 uppercase">
            Avg Engagement Time
          </p>

          <p class="text-2xl font-bold text-slate-800 mt-1">
            {{ formatDuration(filteredSummary.averageSessionDuration) }}
          </p>
        </div>

        <div
          class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
        >
          <p class="text-xs font-medium text-slate-400 uppercase">
            Bounce Rate
          </p>

          <p class="text-2xl font-bold text-slate-800 mt-1">
            {{ formatPercent(filteredSummary.bounceRate) }}
          </p>
        </div>

        <div
          class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
        >
          <p class="text-xs font-medium text-slate-400 uppercase">
            Engagement Rate
          </p>

          <p class="text-2xl font-bold text-slate-800 mt-1">
            {{ formatPercent(filteredSummary.engagementRate) }}
          </p>
        </div>

        <div
          class="bg-indigo-50 p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between"
        >
          <div>
            <p
              class="text-xs font-medium text-indigo-500 uppercase flex items-center gap-2"
            >
              <span class="relative flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>

                <span
                  class="relative inline-flex rounded-full h-3 w-3 bg-green-500"
                ></span>
              </span>

              Live Visitors
            </p>

            <p class="text-3xl font-bold text-indigo-700 mt-1">
              {{ formatNumber(realtimeUsers) }}
            </p>
          </div>
        </div>
      </div>

      <!-- ================= CHARTS ================= -->
      <div
        v-if="showCharts"
        class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <div class="chart-card">
          <h3 class="chart-title">
            Active Users (Filtered)
          </h3>

          <div class="chart-container">
            <canvas ref="visitorsCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Sessions & Pageviews
          </h3>

          <div class="chart-container">
            <canvas ref="sessionsCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Top Countries
          </h3>

          <div class="chart-container">
            <canvas ref="countriesCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Top Pages
          </h3>

          <div class="chart-container">
            <canvas ref="pagesCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Traffic Sources
          </h3>

          <div class="chart-container">
            <canvas ref="sourcesCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Device Categories
          </h3>

          <div class="chart-container">
            <canvas ref="devicesCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Sessions by Hour
          </h3>

          <div class="chart-container">
            <canvas ref="hourlyCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            New vs Returning
          </h3>

          <div class="chart-container">
            <canvas ref="userTypesCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            Page Engagement
          </h3>

          <div class="chart-container">
            <canvas ref="engagementCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- ================= WORLD MAP ================= -->
      <div
        v-if="showMap"
        class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">
            Geographical Distribution
          </h3>

          <span class="text-xs text-slate-400">
            {{ filteredCountries.length }} regions
          </span>
        </div>

        <div
          ref="mapContainer"
          class="h-96 rounded-xl border border-slate-100 overflow-hidden"
        ></div>
      </div>

      <!-- ================= TRAFFIC SOURCES / DEVICES ================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-if="showTrafficSources"
          class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"
        >
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">
            Traffic Sources
          </h3>

          <div class="space-y-2">
            <div
              v-for="src in filteredTrafficSources"
              :key="src.sessionSource"
              class="flex justify-between items-center gap-4"
            >
              <span class="text-sm text-slate-600 truncate">
                {{ src.sessionSource }}
              </span>

              <span class="font-semibold text-slate-800 whitespace-nowrap">
                {{ formatNumber(src.sessions) }} sessions
              </span>
            </div>

            <p
              v-if="!filteredTrafficSources.length"
              class="text-sm text-slate-400 py-4"
            >
              No traffic source data available.
            </p>
          </div>
        </div>

        <div
          v-if="showDeviceCategories"
          class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"
        >
          <h3 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">
            Device Categories
          </h3>

          <div class="space-y-2">
            <div
              v-for="dev in filteredDeviceCategories"
              :key="dev.deviceCategory"
              class="flex justify-between items-center gap-4"
            >
              <span class="text-sm text-slate-600 capitalize">
                {{ dev.deviceCategory }}
              </span>

              <span class="font-semibold text-slate-800 whitespace-nowrap">
                {{ formatNumber(dev.sessions) }} sessions
              </span>
            </div>

            <p
              v-if="!filteredDeviceCategories.length"
              class="text-sm text-slate-400 py-4"
            >
              No device data available.
            </p>
          </div>
        </div>
      </div>

      <!-- ================= PAGE TABLE ================= -->
      <div
        v-if="showPageTable"
        class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">
            Top Pages – Engagement Analysis
          </h3>

          <span class="text-xs text-slate-400">
            {{ rawTopPages.length }} pages
          </span>
        </div>

        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Page
              </th>

              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Pageviews
              </th>

              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Avg Engagement
              </th>

              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Bounce Rate
              </th>

              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Sessions
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="page in rawTopPages"
              :key="page.pagePath"
              class="hover:bg-slate-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-slate-700">
                <div
                  class="max-w-[320px] truncate"
                  :title="page.pagePath"
                >
                  {{ page.pagePath }}
                </div>
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                {{ formatNumber(page.screenPageViews) }}
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                {{ formatDuration(page.averageEngagementTime) }}
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                {{ formatPercent(page.bounceRate) }}
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                {{ formatNumber(page.sessions) }}
              </td>
            </tr>

            <tr v-if="!rawTopPages.length">
              <td
                colspan="5"
                class="px-4 py-8 text-center text-sm text-slate-400"
              >
                No page analytics available.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ================= AI INSIGHTS ================= -->
      <div
        v-if="showAiInsights"
        class="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200 rounded-3xl p-6 md:p-8 shadow-sm"
      >
        <div class="flex items-center gap-3 mb-6">
          <span
            class="h-10 w-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md shadow-purple-500/20"
          >
            <i class="fas fa-brain animate-pulse"></i>
          </span>

          <div>
            <h4 class="font-extrabold text-slate-900 text-lg tracking-tight">
              AI Site Analytics Insights
            </h4>

            <p class="text-xs text-purple-700 font-medium">
              Comprehensive analysis of your web traffic and engagement patterns.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(insight, idx) in aiInsights"
            :key="idx"
            class="bg-white/70 p-4 rounded-xl border border-purple-100 flex items-start gap-3"
          >
            <span
              :class="[
                'h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0',
                insight.iconBg
              ]"
            >
              <i :class="insight.icon"></i>
            </span>

            <div>
              <p class="font-bold text-slate-800 text-sm">
                {{ insight.title }}
              </p>

              <p class="text-xs text-slate-600 mt-1">
                {{ insight.message }}
              </p>
            </div>
          </div>

          <div
            v-if="!aiInsights.length"
            class="md:col-span-2 rounded-xl border border-dashed border-purple-200 p-6 text-center text-sm text-slate-400"
          >
            Not enough analytics data to generate insights yet.
          </div>
        </div>
      </div>
    </template>

    <!-- ================= SUMMARY MODAL ================= -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedCard"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeModal"
        >
          <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Analytics detail
                </p>

                <h3 class="text-xl font-bold text-slate-900 mt-1">
                  {{ selectedCardLabel }} – Detailed Analysis
                </h3>
              </div>

              <button
                type="button"
                @click="closeModal"
                class="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-slate-50 p-3 rounded-xl">
                <p class="text-xs text-slate-500">Total</p>
                <p class="font-bold text-lg text-slate-900">
                  {{ modalTotal }}
                </p>
              </div>

              <div class="bg-slate-50 p-3 rounded-xl">
                <p class="text-xs text-slate-500">Daily Avg</p>
                <p class="font-bold text-lg text-slate-900">
                  {{ modalAverage }}
                </p>
              </div>

              <div class="bg-slate-50 p-3 rounded-xl">
                <p class="text-xs text-slate-500">Max Day</p>
                <p class="font-bold text-lg text-slate-900">
                  {{ modalMax }}
                </p>
              </div>

              <div class="bg-slate-50 p-3 rounded-xl">
                <p class="text-xs text-slate-500">Min Day</p>
                <p class="font-bold text-lg text-slate-900">
                  {{ modalMin }}
                </p>
              </div>
            </div>

            <div
              v-if="modalData.length"
              class="h-64"
            >
              <canvas ref="modalChartCanvas"></canvas>
            </div>

            <div
              v-else
              class="h-48 rounded-xl bg-slate-50 flex items-center justify-center text-sm text-slate-400"
            >
              No data available for this metric.
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick
} from 'vue'

import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import Chart from 'chart.js/auto'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const {
  gaData,
  loading,
  error,
  realtimeUsers,
  refresh
} = useGoogleAnalytics()

// =====================================================
// FILTER STATE
// =====================================================

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

// =====================================================
// CANVAS / MAP REFS
// =====================================================

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

// =====================================================
// RAW DATA
// =====================================================

const rawSummary = computed(() => {
  return gaData.value?.summary || {}
})

const rawTimeSeries = computed(() => {
  return gaData.value?.timeSeries || []
})

const rawTopPages = computed(() => {
  return gaData.value?.topPages || []
})

const rawTopCountries = computed(() => {
  return gaData.value?.topCountries || []
})

const rawTrafficSources = computed(() => {
  return gaData.value?.trafficSources || []
})

const rawDeviceCategories = computed(() => {
  return gaData.value?.deviceCategories || []
})

const rawUserTypes = computed(() => {
  return gaData.value?.userTypes || []
})

const rawHourly = computed(() => {
  return gaData.value?.hourly || []
})

// =====================================================
// DATE HELPERS
// =====================================================

function normalizeDate(value) {
  if (!value) return ''

  const text = String(value)

  /*
   * Google Analytics date:
   * YYYYMMDD
   */
  if (/^\d{8}$/.test(text)) {
    return (
      `${text.slice(0, 4)}-` +
      `${text.slice(4, 6)}-` +
      `${text.slice(6, 8)}`
    )
  }

  /*
   * Already YYYY-MM-DD
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text
  }

  const parsed = new Date(text)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value) {
  const normalized = normalizeDate(value)

  if (!normalized) return ''

  const date = new Date(`${normalized}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric'
  })
}

// =====================================================
// DATE BOUNDS
// =====================================================

const normalizedTimeSeriesDates = computed(() => {
  return rawTimeSeries.value
    .map(item => normalizeDate(item.date))
    .filter(Boolean)
    .sort()
})

const minDate = computed(() => {
  return normalizedTimeSeriesDates.value[0] || ''
})

const maxDate = computed(() => {
  return (
    normalizedTimeSeriesDates.value[
      normalizedTimeSeriesDates.value.length - 1
    ] || ''
  )
})

watch(
  rawTimeSeries,
  newValue => {
    if (!newValue?.length) {
      dateFrom.value = ''
      dateTo.value = ''
      return
    }

    const firstDate = normalizeDate(
      newValue[0].date
    )

    const lastDate = normalizeDate(
      newValue[newValue.length - 1].date
    )

    if (
      !dateFrom.value ||
      !normalizedTimeSeriesDates.value.includes(
        dateFrom.value
      )
    ) {
      dateFrom.value = firstDate
    }

    if (
      !dateTo.value ||
      !normalizedTimeSeriesDates.value.includes(
        dateTo.value
      )
    ) {
      dateTo.value = lastDate
    }
  },
  {
    immediate: true
  }
)

// =====================================================
// FILTERED TIME SERIES
// =====================================================

const filteredTimeSeries = computed(() => {
  if (!rawTimeSeries.value.length) {
    return []
  }

  if (!dateFrom.value || !dateTo.value) {
    return rawTimeSeries.value
  }

  return rawTimeSeries.value.filter(item => {
    const date = normalizeDate(item.date)

    return (
      date >= dateFrom.value &&
      date <= dateTo.value
    )
  })
})

// =====================================================
// FILTERED SUMMARY
// =====================================================

const filteredSummary = computed(() => {
  const data = filteredTimeSeries.value

  if (!data.length) {
    return {
      ...rawSummary.value,

      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      screenPageViews: 0,

      averageSessionDuration:
        Number(
          rawSummary.value.averageSessionDuration
        ) || 0,

      bounceRate:
        Number(rawSummary.value.bounceRate) || 0,

      engagementRate:
        Number(
          rawSummary.value.engagementRate
        ) || 0
    }
  }

  /*
   * These are summed from the daily series because
   * the date filters operate on daily data.
   */
  const totalUsers = data.reduce(
    (sum, item) =>
      sum + (Number(item.activeUsers) || 0),
    0
  )

  const newUsers = data.reduce(
    (sum, item) =>
      sum + (Number(item.newUsers) || 0),
    0
  )

  const sessions = data.reduce(
    (sum, item) =>
      sum + (Number(item.sessions) || 0),
    0
  )

  const pageviews = data.reduce(
    (sum, item) =>
      sum +
      (Number(item.screenPageViews) || 0),
    0
  )

  /*
   * Keep the GA summary values for rate/duration
   * metrics because summing daily bounce/engagement
   * values would be mathematically incorrect.
   */
  return {
    totalUsers,
    newUsers,
    sessions,
    screenPageViews: pageviews,

    averageSessionDuration:
      Number(
        rawSummary.value.averageSessionDuration
      ) || 0,

    bounceRate:
      Number(rawSummary.value.bounceRate) || 0,

    engagementRate:
      Number(
        rawSummary.value.engagementRate
      ) || 0
  }
})

// =====================================================
// FILTERED LISTS
// =====================================================

const filteredTrafficSources = computed(() => {
  if (sourceFilter.value === 'all') {
    return rawTrafficSources.value
  }

  return rawTrafficSources.value.filter(
    source =>
      source.sessionSource ===
      sourceFilter.value
  )
})

const filteredDeviceCategories = computed(() => {
  if (deviceFilter.value === 'all') {
    return rawDeviceCategories.value
  }

  return rawDeviceCategories.value.filter(
    device =>
      device.deviceCategory ===
      deviceFilter.value
  )
})

const filteredCountries = computed(() => {
  if (countryFilter.value === 'all') {
    return rawTopCountries.value
  }

  return rawTopCountries.value.filter(
    country =>
      country.country ===
      countryFilter.value
  )
})

// =====================================================
// SUMMARY CARDS
// =====================================================

const summaryCards = computed(() => [
  {
    key: 'totalUsers',
    label: 'Total Users',
    value: formatNumber(
      filteredSummary.value.totalUsers
    ),
    borderClass: 'border-indigo-500',
    timeSeriesKey: 'activeUsers'
  },

  {
    key: 'newUsers',
    label: 'New Users',
    value: formatNumber(
      filteredSummary.value.newUsers
    ),
    borderClass: 'border-emerald-500',
    timeSeriesKey: 'newUsers'
  },

  {
    key: 'sessions',
    label: 'Sessions',
    value: formatNumber(
      filteredSummary.value.sessions
    ),
    borderClass: 'border-amber-500',
    timeSeriesKey: 'sessions'
  },

  {
    key: 'screenPageViews',
    label: 'Page Views',
    value: formatNumber(
      filteredSummary.value.screenPageViews
    ),
    borderClass: 'border-rose-500',
    timeSeriesKey: 'screenPageViews'
  }
])

// =====================================================
// MODAL
// =====================================================

const selectedCard = ref(null)

const selectedCardLabel = computed(() => {
  return (
    summaryCards.value.find(
      card =>
        card.key === selectedCard.value
    )?.label || ''
  )
})

const modalTimeSeriesKey = computed(() => {
  return (
    summaryCards.value.find(
      card =>
        card.key === selectedCard.value
    )?.timeSeriesKey || ''
  )
})

const modalData = computed(() => {
  if (
    !selectedCard.value ||
    !modalTimeSeriesKey.value
  ) {
    return []
  }

  return filteredTimeSeries.value.map(item => ({
    date: item.date,

    value:
      Number(
        item[modalTimeSeriesKey.value]
      ) || 0
  }))
})

const modalTotal = computed(() => {
  if (!modalData.value.length) {
    return '0'
  }

  return formatNumber(
    modalData.value.reduce(
      (sum, item) =>
        sum + item.value,
      0
    )
  )
})

const modalAverage = computed(() => {
  if (!modalData.value.length) {
    return '0'
  }

  const average =
    modalData.value.reduce(
      (sum, item) =>
        sum + item.value,
      0
    ) /
    modalData.value.length

  return Number(
    average.toFixed(1)
  ).toLocaleString('en-KE')
})

const modalMax = computed(() => {
  if (!modalData.value.length) {
    return '0'
  }

  return formatNumber(
    Math.max(
      ...modalData.value.map(
        item => item.value
      )
    )
  )
})

const modalMin = computed(() => {
  if (!modalData.value.length) {
    return '0'
  }

  return formatNumber(
    Math.min(
      ...modalData.value.map(
        item => item.value
      )
    )
  )
})

function openModal(key) {
  selectedCard.value = key

  nextTick(() => {
    createModalChart()
  })
}

function closeModal() {
  selectedCard.value = null

  if (modalChart) {
    modalChart.destroy()
    modalChart = null
  }
}

function createModalChart() {
  if (modalChart) {
    modalChart.destroy()
    modalChart = null
  }

  if (
    !modalChartCanvas.value ||
    !modalData.value.length
  ) {
    return
  }

  modalChart = new Chart(
    modalChartCanvas.value,
    {
      type: 'line',

      data: {
        labels: modalData.value.map(
          item =>
            formatDate(item.date)
        ),

        datasets: [
          {
            label:
              selectedCardLabel.value,

            data: modalData.value.map(
              item =>
                item.value
            ),

            fill: true,

            borderColor:
              '#6366f1',

            backgroundColor:
              'rgba(99, 102, 241, 0.1)',

            tension: 0.2,

            pointRadius: 3,

            pointHoverRadius: 5
          }
        ]
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          intersect: false,
          mode: 'index'
        },

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    }
  )
}

// =====================================================
// CHART CONFIG
// =====================================================

const commonChartOptions = {
  responsive: true,

  maintainAspectRatio: false,

  interaction: {
    intersect: false,
    mode: 'index'
  },

  plugins: {
    legend: {
      position: 'bottom'
    }
  },

  scales: {
    y: {
      beginAtZero: true
    }
  }
}

function destroyCharts() {
  charts.forEach(chart => {
    try {
      chart.destroy()
    } catch {
      // Ignore already-destroyed charts.
    }
  })

  charts = []
}

function createAllCharts() {
  if (!gaData.value) {
    return
  }

  if (!showCharts.value) {
    destroyCharts()
    return
  }

  /*
   * Vue must have mounted all canvas elements before
   * Chart.js touches them.
   */
  if (
    !visitorsCanvas.value &&
    !sessionsCanvas.value &&
    !countriesCanvas.value &&
    !pagesCanvas.value &&
    !sourcesCanvas.value &&
    !devicesCanvas.value &&
    !hourlyCanvas.value &&
    !userTypesCanvas.value &&
    !engagementCanvas.value
  ) {
    return
  }

  destroyCharts()

  // ---------------------------------------------------
  // 1. ACTIVE USERS
  // ---------------------------------------------------

  if (
    visitorsCanvas.value &&
    filteredTimeSeries.value.length
  ) {
    charts.push(
      new Chart(
        visitorsCanvas.value,
        {
          type: 'line',

          data: {
            labels:
              filteredTimeSeries.value.map(
                item =>
                  formatDate(
                    item.date
                  )
              ),

            datasets: [
              {
                label:
                  'Active Users',

                data:
                  filteredTimeSeries.value.map(
                    item =>
                      Number(
                        item.activeUsers
                      ) || 0
                  ),

                borderColor:
                  '#6366f1',

                backgroundColor:
                  'rgba(99,102,241,0.08)',

                tension: 0.2,

                fill: true,

                pointBackgroundColor:
                  '#6366f1'
              },

              {
                label:
                  'New Users',

                data:
                  filteredTimeSeries.value.map(
                    item =>
                      Number(
                        item.newUsers
                      ) || 0
                  ),

                borderColor:
                  '#10b981',

                backgroundColor:
                  'rgba(16,185,129,0.05)',

                tension: 0.2,

                fill: false,

                pointBackgroundColor:
                  '#10b981'
              }
            ]
          },

          options: {
            ...commonChartOptions
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 2. SESSIONS VS PAGEVIEWS
  // ---------------------------------------------------

  if (
    sessionsCanvas.value &&
    filteredTimeSeries.value.length
  ) {
    charts.push(
      new Chart(
        sessionsCanvas.value,
        {
          type: 'bar',

          data: {
            labels:
              filteredTimeSeries.value.map(
                item =>
                  formatDate(
                    item.date
                  )
              ),

            datasets: [
              {
                label:
                  'Sessions',

                data:
                  filteredTimeSeries.value.map(
                    item =>
                      Number(
                        item.sessions
                      ) || 0
                  ),

                backgroundColor:
                  '#f59e0b',

                borderRadius: 4
              },

              {
                label:
                  'Pageviews',

                data:
                  filteredTimeSeries.value.map(
                    item =>
                      Number(
                        item.screenPageViews
                      ) || 0
                  ),

                backgroundColor:
                  '#818cf8',

                borderRadius: 4
              }
            ]
          },

          options: {
            ...commonChartOptions
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 3. COUNTRIES
  // ---------------------------------------------------

  if (
    countriesCanvas.value &&
    filteredCountries.value.length
  ) {
    charts.push(
      new Chart(
        countriesCanvas.value,
        {
          type: 'bar',

          data: {
            labels:
              filteredCountries.value.map(
                country =>
                  country.country
              ),

            datasets: [
              {
                label:
                  'Sessions',

                data:
                  filteredCountries.value.map(
                    country =>
                      Number(
                        country.sessions
                      ) || 0
                  ),

                backgroundColor:
                  '#8b5cf6',

                borderRadius: 6
              }
            ]
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            indexAxis: 'y',

            plugins: {
              legend: {
                display: false
              }
            },

            scales: {
              x: {
                beginAtZero: true
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 4. TOP PAGES
  // ---------------------------------------------------

  if (
    pagesCanvas.value &&
    rawTopPages.value.length
  ) {
    charts.push(
      new Chart(
        pagesCanvas.value,
        {
          type: 'bar',

          data: {
            labels:
              rawTopPages.value.map(
                page => {
                  const path =
                    page.pagePath ||
                    '/'

                  return path.length >
                    25
                    ? `${path.substring(
                        0,
                        25
                      )}...`
                    : path
                }
              ),

            datasets: [
              {
                label:
                  'Pageviews',

                data:
                  rawTopPages.value.map(
                    page =>
                      Number(
                        page.screenPageViews
                      ) || 0
                  ),

                backgroundColor:
                  '#10b981',

                borderRadius: 6
              }
            ]
          },

          options: {
            ...commonChartOptions,

            plugins: {
              legend: {
                display: false
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 5. TRAFFIC SOURCES
  // ---------------------------------------------------

  if (
    sourcesCanvas.value &&
    rawTrafficSources.value.length
  ) {
    charts.push(
      new Chart(
        sourcesCanvas.value,
        {
          type: 'doughnut',

          data: {
            labels:
              rawTrafficSources.value.map(
                source =>
                  source.sessionSource
              ),

            datasets: [
              {
                data:
                  rawTrafficSources.value.map(
                    source =>
                      Number(
                        source.sessions
                      ) || 0
                  ),

                backgroundColor: [
                  '#6366f1',
                  '#8b5cf6',
                  '#ec4899',
                  '#f59e0b',
                  '#10b981',
                  '#3b82f6',
                  '#ef4444',
                  '#84cc16',
                  '#f97316',
                  '#06b6d4'
                ],

                borderWidth: 0
              }
            ]
          },

          options: {
            responsive: true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                position:
                  'bottom'
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 6. DEVICE CATEGORIES
  // ---------------------------------------------------

  if (
    devicesCanvas.value &&
    rawDeviceCategories.value.length
  ) {
    charts.push(
      new Chart(
        devicesCanvas.value,
        {
          type: 'pie',

          data: {
            labels:
              rawDeviceCategories.value.map(
                device =>
                  device.deviceCategory
              ),

            datasets: [
              {
                data:
                  rawDeviceCategories.value.map(
                    device =>
                      Number(
                        device.sessions
                      ) || 0
                  ),

                backgroundColor: [
                  '#6366f1',
                  '#10b981',
                  '#f59e0b',
                  '#ec4899'
                ],

                borderWidth: 0
              }
            ]
          },

          options: {
            responsive: true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                position:
                  'bottom'
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 7. HOURLY SESSIONS
  // ---------------------------------------------------

  if (
    hourlyCanvas.value &&
    rawHourly.value.length
  ) {
    charts.push(
      new Chart(
        hourlyCanvas.value,
        {
          type: 'line',

          data: {
            labels:
              rawHourly.value.map(
                item =>
                  `${item.hour}:00`
              ),

            datasets: [
              {
                label:
                  'Sessions',

                data:
                  rawHourly.value.map(
                    item =>
                      Number(
                        item.sessions
                      ) || 0
                  ),

                borderColor:
                  '#f97316',

                backgroundColor:
                  'rgba(249,115,22,0.10)',

                tension: 0.3,

                fill: true
              }
            ]
          },

          options: {
            ...commonChartOptions,

            plugins: {
              legend: {
                display: false
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 8. NEW VS RETURNING
  // ---------------------------------------------------

  if (
    userTypesCanvas.value &&
    rawUserTypes.value.length
  ) {
    charts.push(
      new Chart(
        userTypesCanvas.value,
        {
          type: 'doughnut',

          data: {
            labels:
              rawUserTypes.value.map(
                item =>
                  item.newVsReturning
              ),

            datasets: [
              {
                data:
                  rawUserTypes.value.map(
                    item =>
                      Number(
                        item.sessions
                      ) || 0
                  ),

                backgroundColor: [
                  '#6366f1',
                  '#10b981'
                ],

                borderWidth: 0
              }
            ]
          },

          options: {
            responsive: true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                position:
                  'bottom'
              }
            }
          }
        }
      )
    )
  }

  // ---------------------------------------------------
  // 9. PAGE ENGAGEMENT
  // ---------------------------------------------------

  if (
    engagementCanvas.value &&
    rawTopPages.value.length
  ) {
    charts.push(
      new Chart(
        engagementCanvas.value,
        {
          type: 'bubble',

          data: {
            datasets:
              rawTopPages.value.map(
                (page, index) => {
                  const views =
                    Number(
                      page.screenPageViews
                    ) || 0

                  const hue =
                    (index * 40) % 360

                  return {
                    label:
                      page.pagePath,

                    data: [
                      {
                        x:
                          Number(
                            page.averageEngagementTime
                          ) || 0,

                        y:
                          Number(
                            page.bounceRate
                          ) || 0,

                        r: Math.max(
                          4,
                          Math.min(
                            20,
                            Math.sqrt(
                              views
                            ) / 2
                          )
                        )
                      }
                    ],

                    backgroundColor:
                      `hsla(${hue}, 70%, 60%, 0.6)`
                  }
                }
              )
          },

          options: {
            responsive: true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                display: false
              },

              tooltip: {
                callbacks: {
                  label(context) {
                    const dataset =
                      context.dataset

                    return (
                      `${dataset.label}: ` +
                      `engagement ${context.raw.x}s, ` +
                      `bounce ${context.raw.y}%`
                    )
                  }
                }
              }
            },

            scales: {
              x: {
                title: {
                  display: true,
                  text:
                    'Avg Engagement Time (s)'
                }
              },

              y: {
                beginAtZero: true,

                title: {
                  display: true,
                  text:
                    'Bounce Rate (%)'
                }
              }
            }
          }
        }
      )
    )
  }
}

// =====================================================
// FORMATTING
// =====================================================

function formatNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return number.toLocaleString(
    'en-KE'
  )
}

function formatPercent(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0.0%'
  }

  return `${number.toFixed(1)}%`
}

function formatDuration(seconds) {
  const value = Number(seconds)

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return '0s'
  }

  const mins = Math.floor(
    value / 60
  )

  const remainingSeconds = Math.round(
    value % 60
  )

  if (mins === 0) {
    return `${remainingSeconds}s`
  }

  return `${mins}m ${remainingSeconds}s`
}

// =====================================================
// MAP
// =====================================================

const countryCoords = {
  Kenya: [-1.286389, 36.817223],
  'United States': [
    37.09024,
    -95.712891
  ],
  'United Kingdom': [
    55.378051,
    -3.435973
  ],
  India: [
    20.593684,
    78.96288
  ],
  Germany: [
    51.165691,
    10.451526
  ],
  Nigeria: [
    9.081999,
    8.675277
  ],
  'South Africa': [
    -30.559482,
    22.937506
  ],
  Canada: [
    56.130366,
    -106.346771
  ],
  Australia: [
    -25.274398,
    133.775136
  ],
  Netherlands: [
    52.132633,
    5.291266
  ],
  France: [
    46.227638,
    2.213749
  ],
  Brazil: [
    -14.235004,
    -51.92528
  ],
  Tanzania: [
    -6.369028,
    34.888822
  ],
  Uganda: [
    1.373333,
    32.290275
  ],
  Rwanda: [
    -1.940278,
    29.873888
  ],
  Ethiopia: [
    9.145,
    40.489673
  ],
  China: [
    35.86166,
    104.195397
  ],
  Japan: [
    36.204824,
    138.252924
  ],
  'United Arab Emirates': [
    23.424076,
    53.847818
  ],
  'Saudi Arabia': [
    23.885942,
    45.079162
  ]
}

function destroyMap() {
  if (!map) {
    return
  }

  map.remove()
  map = null
}

function initMap() {
  if (
    !showMap.value ||
    !mapContainer.value
  ) {
    return
  }

  /*
   * Do not reuse a stale map instance if Vue has
   * recreated the container.
   */
  if (map) {
    try {
      map.invalidateSize()
      updateMapMarkers()
      return
    } catch {
      destroyMap()
    }
  }

  map = L.map(
    mapContainer.value,
    {
      preferCanvas: true
    }
  ).setView(
    [20, 0],
    2
  )

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(map)

  updateMapMarkers()

  setTimeout(() => {
    map?.invalidateSize()
  }, 100)
}

function updateMapMarkers() {
  if (!map) {
    return
  }

  map.eachLayer(layer => {
    if (
      layer instanceof
      L.CircleMarker
    ) {
      map.removeLayer(layer)
    }
  })

  filteredCountries.value.forEach(
    country => {
      const coords =
        countryCoords[
          country.country
        ]

      if (!coords) {
        return
      }

      const sessions =
        Number(
          country.sessions
        ) || 0

      const radius = Math.max(
        5,
        Math.min(
          20,
          Math.sqrt(
            sessions
          ) / 5
        )
      )

      const circle =
        L.circleMarker(
          coords,
          {
            radius,

            color:
              '#6366f1',

            fillColor:
              '#6366f1',

            fillOpacity:
              0.6,

            weight: 2
          }
        ).addTo(map)

      circle.bindPopup(
        `
          <div style="min-width:160px">
            <strong>${escapeHtml(
              country.country
            )}</strong>
            <br />
            Sessions:
            ${formatNumber(
              country.sessions
            )}
            <br />
            Users:
            ${formatNumber(
              country.activeUsers
            )}
          </div>
        `
      )
    }
  )
}

function escapeHtml(value) {
  return String(value)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    )
}

// =====================================================
// AI INSIGHTS
// =====================================================

const aiInsights = computed(() => {
  if (!gaData.value) {
    return []
  }

  const insights = []
  const summary =
    filteredSummary.value

  const pct = (
    part,
    total
  ) => {
    if (
      !total ||
      Number(total) <= 0
    ) {
      return '0.0'
    }

    return (
      (Number(part) /
        Number(total)) *
      100
    ).toFixed(1)
  }

  // ---------------------------------------------------
  // 1. GEOGRAPHIC FOCUS
  // ---------------------------------------------------

  const topCountry =
    filteredCountries.value[0]

  if (topCountry) {
    insights.push({
      title:
        'Geographic Focus',

      message:
        `The majority of your traffic comes from ` +
        `${topCountry.country} ` +
        `(${pct(
          topCountry.sessions,
          summary.sessions
        )}% of sessions). ` +
        `Consider localized content and targeted campaigns for this region.`,

      icon:
        'fas fa-globe-africa',

      iconBg:
        'bg-indigo-50 text-indigo-600'
    })
  }

  // ---------------------------------------------------
  // 2. TOP PAGE
  // ---------------------------------------------------

  const topPage =
    rawTopPages.value[0]

  if (topPage) {
    insights.push({
      title:
        'Top Performing Page',

      message:
        `"${topPage.pagePath}" is your most visited page ` +
        `(${formatNumber(
          topPage.screenPageViews
        )} views) with an average engagement time of ` +
        `${formatDuration(
          topPage.averageEngagementTime
        )}. Ensure it has clear conversion paths.`,

      icon:
        'fas fa-file-alt',

      iconBg:
        'bg-emerald-50 text-emerald-600'
    })
  }

  // ---------------------------------------------------
  // 3. TRAFFIC ACQUISITION
  // ---------------------------------------------------

  const topSource =
    filteredTrafficSources.value[0]

  if (topSource) {
    insights.push({
      title:
        'Traffic Acquisition',

      message:
        `Most sessions originate from ` +
        `${topSource.sessionSource} ` +
        `(${formatNumber(
          topSource.sessions
        )} sessions). ` +
        `Strengthen this channel while diversifying acquisition.`,

      icon:
        'fas fa-chart-line',

      iconBg:
        'bg-amber-50 text-amber-600'
    })
  }

  // ---------------------------------------------------
  // 4. MOBILE EXPERIENCE
  // ---------------------------------------------------

  const mobileSessions =
    rawDeviceCategories.value.find(
      device =>
        String(
          device.deviceCategory
        ).toLowerCase() ===
        'mobile'
    )?.sessions || 0

  insights.push({
    title:
      'Mobile Experience',

    message:
      `${pct(
        mobileSessions,
        summary.sessions
      )}% of sessions come from mobile devices. ` +
      `Mobile UX should remain a primary conversion KPI.`,

    icon:
      'fas fa-mobile-alt',

    iconBg:
      'bg-rose-50 text-rose-600'
  })

  // ---------------------------------------------------
  // 5. ENGAGEMENT HEALTH
  // ---------------------------------------------------

  const bounce =
    Number(
      summary.bounceRate
    ) || 0

  insights.push({
    title:
      'Engagement Health',

    message:
      `Bounce rate is ${bounce.toFixed(
        1
      )}%. ` +
      `${
        bounce > 50
          ? 'Review landing-page relevance, speed and content alignment.'
          : 'Current bounce performance is comparatively healthy; continue monitoring the weaker pages.'
      }`,

    icon:
      'fas fa-heartbeat',

    iconBg:
      'bg-purple-50 text-purple-600'
  })

  // ---------------------------------------------------
  // 6. AUDIENCE RETENTION
  // ---------------------------------------------------

  const returning =
    rawUserTypes.value.find(
      item =>
        String(
          item.newVsReturning
        ).toLowerCase() ===
        'returning'
    )?.sessions || 0

  const returningPercent =
    Number(
      pct(
        returning,
        summary.sessions
      )
    )

  insights.push({
    title:
      'Audience Retention',

    message:
      `${returningPercent.toFixed(
        1
      )}% of sessions are from returning users. ` +
      `${
        returningPercent < 30
          ? 'Strengthen retention through remarketing, email and repeat-visit content.'
          : 'Returning-user share indicates healthy repeat engagement.'
      }`,

    icon:
      'fas fa-users',

    iconBg:
      'bg-blue-50 text-blue-600'
  })

  // ---------------------------------------------------
  // 7. PROBLEM PAGE
  // ---------------------------------------------------

  const worstPage =
    rawTopPages.value
      .slice()
      .sort(
        (a, b) =>
          Number(b.bounceRate || 0) -
          Number(a.bounceRate || 0)
      )[0]

  if (worstPage) {
    const bounceRate =
      Number(
        worstPage.bounceRate
      ) || 0

    insights.push({
      title:
        'Problem Page',

      message:
        `"${worstPage.pagePath}" has the highest bounce rate ` +
        `(${bounceRate.toFixed(
          1
        )}%). ` +
        `Review its content, speed and conversion path.`,

      icon:
        'fas fa-exclamation-circle',

      iconBg:
        'bg-red-50 text-red-600'
    })
  }

  // ---------------------------------------------------
  // 8. CONTENT STRATEGY
  // ---------------------------------------------------

  insights.push({
    title:
      'Content Strategy',

    message:
      `Average session duration is ` +
      `${formatDuration(
        summary.averageSessionDuration
      )}. ` +
      `Use this alongside bounce and engagement rate when assessing content quality.`,

    icon:
      'fas fa-clock',

    iconBg:
      'bg-teal-50 text-teal-600'
  })

  // ---------------------------------------------------
  // 9. TRAFFIC TREND
  // ---------------------------------------------------

  if (
    filteredTimeSeries.value.length >=
    4
  ) {
    const half =
      Math.floor(
        filteredTimeSeries.value.length /
          2
      )

    const firstHalf =
      filteredTimeSeries.value.slice(
        0,
        half
      )

    const secondHalf =
      filteredTimeSeries.value.slice(
        half
      )

    const firstHalfAvg =
      firstHalf.reduce(
        (sum, item) =>
          sum +
          (Number(
            item.activeUsers
          ) || 0),
        0
      ) / Math.max(
        1,
        firstHalf.length
      )

    const secondHalfAvg =
      secondHalf.reduce(
        (sum, item) =>
          sum +
          (Number(
            item.activeUsers
          ) || 0),
        0
      ) / Math.max(
        1,
        secondHalf.length
      )

    const change =
      firstHalfAvg > 0
        ? (
            (secondHalfAvg -
              firstHalfAvg) /
            firstHalfAvg
          ) * 100
        : 0

    if (change > 10) {
      insights.push({
        title:
          'Traffic Growth',

        message:
          `Active users increased by ` +
          `${change.toFixed(
            1
          )}% in the second half of the selected period.`,

        icon:
          'fas fa-arrow-up',

        iconBg:
          'bg-green-50 text-green-600'
      })
    } else if (change < -10) {
      insights.push({
        title:
          'Traffic Decline',

        message:
          `Active users decreased by ` +
          `${Math.abs(
            change
          ).toFixed(
            1
          )}% in the second half of the selected period. Investigate campaign and content changes.`,

        icon:
          'fas fa-arrow-down',

        iconBg:
          'bg-yellow-50 text-yellow-600'
      })
    }
  }

  // ---------------------------------------------------
  // 10. WEEKLY PATTERN
  // ---------------------------------------------------

  if (
    filteredTimeSeries.value.length >=
    7
  ) {
    const dayMap = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }

    const dayTotals = {}

    filteredTimeSeries.value.forEach(
      item => {
        const normalized =
          normalizeDate(
            item.date
          )

        if (!normalized) {
          return
        }

        const day =
          new Date(
            `${normalized}T00:00:00`
          ).getDay()

        dayTotals[day] =
          (dayTotals[day] || 0) +
          (Number(
            item.activeUsers
          ) || 0)
      }
    )

    const entries =
      Object.entries(
        dayTotals
      )

    if (entries.length) {
      const bestDay =
        entries.sort(
          (a, b) =>
            b[1] - a[1]
        )[0]

      const worstDay =
        entries.sort(
          (a, b) =>
            a[1] - b[1]
        )[0]

      const weeks =
        Math.max(
          1,
          filteredTimeSeries.value.length /
            7
        )

      insights.push({
        title:
          'Weekly Pattern',

        message:
          `${dayMap[bestDay[0]]} is your strongest traffic day, while ` +
          `${dayMap[worstDay[0]]} is your weakest. ` +
          `Use this pattern when planning content and campaigns.`,

        icon:
          'fas fa-calendar-week',

        iconBg:
          'bg-indigo-50 text-indigo-600'
      })
    }
  }

  // ---------------------------------------------------
  // 11. HOURLY PEAK
  // ---------------------------------------------------

  if (
    rawHourly.value.length
  ) {
    const peak =
      rawHourly.value
        .slice()
        .sort(
          (a, b) =>
            Number(b.sessions || 0) -
            Number(a.sessions || 0)
        )[0]

    if (peak) {
      insights.push({
        title:
          'Peak Hours',

        message:
          `Your site sees the most sessions around ` +
          `${peak.hour}:00 with ` +
          `${formatNumber(
            peak.sessions
          )} sessions.`,

        icon:
          'fas fa-hourglass-half',

        iconBg:
          'bg-cyan-50 text-cyan-600'
      })
    }
  }

  // ---------------------------------------------------
  // 12. UNDERPERFORMING COUNTRY
  // ---------------------------------------------------

  const highBounceCountry =
    rawTopCountries.value
      .slice()
      .sort(
        (a, b) =>
          Number(b.bounceRate || 0) -
          Number(a.bounceRate || 0)
      )[0]

  if (
    highBounceCountry &&
    Number(
      highBounceCountry.bounceRate
    ) > 60
  ) {
    insights.push({
      title:
        'Underperforming Region',

      message:
        `${highBounceCountry.country} has a bounce rate of ` +
        `${Number(
          highBounceCountry.bounceRate
        ).toFixed(
          1
        )}%. ` +
        `Review localization, page speed and relevance for this audience.`,

      icon:
        'fas fa-map-marker-alt',

      iconBg:
        'bg-orange-50 text-orange-600'
    })
  }

  // ---------------------------------------------------
  // 13. HIDDEN GEM
  // ---------------------------------------------------

  const hiddenGem =
    rawTopPages.value
      .filter(
        page =>
          Number(
            page.screenPageViews
          ) < 100 &&
          Number(
            page.averageEngagementTime
          ) > 60
      )
      .sort(
        (a, b) =>
          Number(
            b.averageEngagementTime
          ) -
          Number(
            a.averageEngagementTime
          )
      )[0]

  if (hiddenGem) {
    insights.push({
      title:
        'Hidden Gem',

      message:
        `"${hiddenGem.pagePath}" has relatively low traffic but strong engagement. ` +
        `Consider promoting it more heavily.`,

      icon:
        'fas fa-gem',

      iconBg:
        'bg-pink-50 text-pink-600'
    })
  }

  // ---------------------------------------------------
  // 14. NEW USER GROWTH
  // ---------------------------------------------------

  if (
    filteredTimeSeries.value.length >=
    2
  ) {
    const first =
      Number(
        filteredTimeSeries.value[0]
          .newUsers
      ) || 0

    const last =
      Number(
        filteredTimeSeries.value[
          filteredTimeSeries.value
            .length - 1
        ].newUsers
      ) || 0

    if (first > 0) {
      const growth =
        ((last - first) /
          first) *
        100

      if (growth > 20) {
        insights.push({
          title:
            'New User Growth',

          message:
            `New-user volume increased by ` +
            `${growth.toFixed(
              1
            )}% between the beginning and end of the selected period.`,

          icon:
            'fas fa-user-plus',

          iconBg:
            'bg-green-50 text-green-600'
        })
      }
    }
  }

  // ---------------------------------------------------
  // 15. SESSION QUALITY
  // ---------------------------------------------------

  const engagementRate =
    Number(
      summary.engagementRate
    ) || 0

  insights.push({
    title:
      'Session Quality',

    message:
      `Overall engagement rate is ` +
      `${engagementRate.toFixed(
        1
      )}%. ` +
      `${
        engagementRate > 60
          ? 'Users are actively engaging with the website.'
          : 'There is room to improve content relevance, navigation and conversion paths.'
      }`,

    icon:
      'fas fa-thumbs-up',

    iconBg:
      'bg-blue-50 text-blue-600'
  })

  // ---------------------------------------------------
  // 16. ANOMALY DETECTION
  // ---------------------------------------------------

  if (
    filteredTimeSeries.value.length >=
    10
  ) {
    const sessions =
      filteredTimeSeries.value.map(
        item =>
          Number(
            item.sessions
          ) || 0
      )

    const mean =
      sessions.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      sessions.length

    const variance =
      sessions.reduce(
        (sum, value) =>
          sum +
          Math.pow(
            value - mean,
            2
          ),
        0
      ) /
      sessions.length

    const standardDeviation =
      Math.sqrt(
        variance
      )

    const maxValue =
      Math.max(
        ...sessions
      )

    if (
      standardDeviation >
        0 &&
      (maxValue - mean) /
        standardDeviation >
        3
    ) {
      insights.push({
        title:
          'Traffic Anomaly',

        message:
          `A significant session spike was detected: ` +
          `${formatNumber(
            maxValue
          )} sessions versus an average of ` +
          `${formatNumber(
            Math.round(
              mean
            )
          )}. ` +
          `Investigate campaigns or content events around that date.`,

        icon:
          'fas fa-exclamation-triangle',

        iconBg:
          'bg-yellow-50 text-yellow-600'
      })
    }
  }

  return insights
})

// =====================================================
// WATCHERS
// =====================================================

watch(
  [
    filteredTimeSeries,
    filteredCountries,
    filteredTrafficSources,
    filteredDeviceCategories
  ],
  async () => {
    await nextTick()

    if (showCharts.value) {
      createAllCharts()
    }

    if (showMap.value) {
      initMap()
      updateMapMarkers()
    }
  }
)

watch(
  gaData,
  async newData => {
    if (!newData) {
      destroyCharts()
      destroyMap()
      return
    }

    await nextTick()

    if (showCharts.value) {
      createAllCharts()
    }

    if (showMap.value) {
      initMap()
    }
  },
  {
    deep: false
  }
)

watch(
  showCharts,
  async enabled => {
    if (!enabled) {
      destroyCharts()
      return
    }

    await nextTick()

    createAllCharts()
  }
)

watch(
  showMap,
  async enabled => {
    if (!enabled) {
      destroyMap()
      return
    }

    await nextTick()

    initMap()
  }
)

watch(
  selectedCard,
  async value => {
    if (!value) {
      return
    }

    await nextTick()

    createModalChart()
  }
)

// =====================================================
// LIFECYCLE
// =====================================================

onMounted(async () => {
  await nextTick()

  if (gaData.value) {
    if (showCharts.value) {
      createAllCharts()
    }

    if (showMap.value) {
      initMap()
    }
  }
})

onUnmounted(() => {
  destroyCharts()

  if (modalChart) {
    modalChart.destroy()
    modalChart = null
  }

  destroyMap()
})
</script>

<style scoped>
.chart-card {
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.chart-title {
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 250px;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>