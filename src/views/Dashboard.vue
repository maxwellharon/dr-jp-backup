<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    
    <div class="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Clinical Dashboard</h1>
          <p class="text-slate-500 text-sm mt-1">Real-time synchronized visualization engine for Dr. JP Plastic Surgery Hub.</p>
        </div>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2 text-sm">
            <input
              type="date"
              v-model="dateFrom"
              class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <span class="text-slate-400">to</span>
            <input
              type="date"
              v-model="dateTo"
              class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <button
              @click="clearDateFilter"
              class="text-xs text-indigo-600 hover:underline ml-1"
            >
              Clear
            </button>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Wix Cloud Sync Active
          </span>
        </div>
      </div>

      <!-- Active Filters Bar -->
      <div v-if="hasActiveFilters" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center">
        <span class="text-xs font-semibold text-slate-500 mr-2">Active filters:</span>
        <span v-if="dateFrom || dateTo" class="filter-tag">
          📅 {{ dateFrom || 'Start' }} → {{ dateTo || 'End' }}
          <button @click="clearDateFilter">✕</button>
        </span>
        <span v-if="activeProcedureFilter" class="filter-tag">
          🏥 {{ activeProcedureFilter }}
          <button @click="activeProcedureFilter = ''">✕</button>
        </span>
        <span v-if="ageFilter" class="filter-tag">
          👤 Age: {{ ageFilter }}
          <button @click="ageFilter = ''">✕</button>
        </span>
        <span v-if="countryFilter" class="filter-tag">
          🌍 {{ countryFilter }}
          <button @click="countryFilter = ''">✕</button>
        </span>
        <span v-if="monthFilter" class="filter-tag">
          📆 {{ monthFilter }}
          <button @click="monthFilter = ''">✕</button>
        </span>
        <span v-if="pastSurgeriesFilter" class="filter-tag">
          🏥 Prior Surgeries: Yes
          <button @click="pastSurgeriesFilter = false">✕</button>
        </span>
        <span v-if="bmiHighRiskFilter" class="filter-tag">
          ⚠️ BMI ≥ 30
          <button @click="bmiHighRiskFilter = false">✕</button>
        </span>
        <button @click="resetAllFilters" class="ml-auto text-xs text-indigo-600 hover:underline font-semibold">Reset all</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        <p class="text-sm font-medium text-slate-500">Parsing relational clinical tables...</p>
      </div>

      <div v-else class="space-y-8">
        <!-- Stats Cards -->
        <StatsCards
          :total="totalPatients"
          :mostRequested="mostRequestedProc"
          :avgAge="averageAge"
          :nonSurgPercent="nonSurgicalPercent"
          @card-click="openDetailModal"
        />

        <!-- Deep Analytical Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Top 5 Procedures -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                <i class="fas fa-crown text-amber-500"></i> Top 5 Requested Procedures
              </h3>
            </div>
            <div class="space-y-3.5">
              <div
                v-for="(proc, idx) in topProcedures"
                :key="proc.name"
                @click="activeProcedureFilter = proc.name"
                class="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all"
                :class="{ 'ring-2 ring-indigo-300 bg-indigo-50/50': activeProcedureFilter === proc.name }"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span :class="[
                    'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    idx === 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                    idx === 2 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-600'
                  ]">
                    #{{ idx + 1 }}
                  </span>
                  <p class="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                    {{ proc.name }}
                  </p>
                </div>
                <div class="text-right shrink-0 pl-2">
                  <span class="text-xs text-slate-500">{{ proc.count }} leads</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Clinical Vitals -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                <i class="fas fa-heartbeat text-rose-500"></i> Clinical Vital Thresholds
              </h3>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <p class="text-xs font-medium text-indigo-600 uppercase tracking-wider">Average Weight</p>
                <p class="text-2xl font-bold text-indigo-900 mt-1">{{ avgWeight }} <span class="text-sm font-normal">kg</span></p>
              </div>
              <div class="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                <p class="text-xs font-medium text-purple-600 uppercase tracking-wider">Average Height</p>
                <p class="text-2xl font-bold text-purple-900 mt-1">{{ avgHeight }} <span class="text-sm font-normal">cm</span></p>
              </div>
              <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider">Mean BMI</p>
                <p class="text-2xl font-bold text-emerald-900 mt-1">{{ avgBmi }}</p>
              </div>
              <div
                @click="pastSurgeriesFilter = !pastSurgeriesFilter"
                class="p-4 rounded-xl bg-amber-50/50 border border-amber-100 cursor-pointer hover:shadow transition"
                :class="{ 'ring-2 ring-amber-400 bg-amber-100/50': pastSurgeriesFilter }"
              >
                <p class="text-xs font-medium text-amber-600 uppercase tracking-wider">Prior Surgeries</p>
                <p class="text-2xl font-bold text-amber-900 mt-1">{{ surgicalHistoryCount }}</p>
              </div>
            </div>
            <div
              @click="bmiHighRiskFilter = !bmiHighRiskFilter"
              class="mt-4 p-3 rounded-xl border text-xs cursor-pointer hover:shadow transition"
              :class="bmiHighRiskFilter ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200/60 text-slate-600'"
            >
              <i class="fas fa-info-circle mr-1.5" :class="bmiHighRiskFilter ? 'text-rose-500' : 'text-indigo-500'"></i>
              <strong>Anesthetic Risk:</strong> {{ bmisOver30 }} of {{ totalPatients }} patients with BMI ≥ 30.
              <span class="text-xs ml-1 opacity-70">{{ bmiHighRiskFilter ? '(Filter active)' : '(Click to filter)' }}</span>
            </div>
          </div>

          <!-- Registrations Chart -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
              <i class="fas fa-history text-indigo-500"></i> Submission Time Series
            </h3>
            <RegistrationsChart :data="registrationsTimeSeries" @point-click="handleMonthClick" />
          </div>
        </div>

        <!-- Demographics Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Age Bracket</h4>
            <AgeChart :data="ageDistribution" @segment-click="handleAgeClick" />
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Procedures</h4>
            <ProcedureChart :data="procedureData" @bar-click="handleProcedureClick" />
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-slate-400">Countries</h4>
            <CountryChart :data="countryDistribution" @slice-click="handleCountryClick" />
          </div>
        </div>

        <!-- Lower grid: Main patient table + Inbox -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-xl text-slate-900 flex items-center gap-2">
                <i class="fas fa-stream text-indigo-600"></i>
                Quote Submissions ({{ displayedPatients.length }})
              </h3>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
              <ResponsiveTable
                :headers="['Name', 'Procedure', 'Age', 'Country', 'Price (KES)']"
                :data="paginatedDisplayedPatients"
                :actions="true"
                @view="goToPatient"
              />
              <div class="flex justify-end p-3 border-t border-slate-100">
                <Pagination
                  :current-page="tablePage"
                  :total-pages="Math.ceil(displayedPatients.length / tablePageSize)"
                  @page-change="handleTablePageChange"
                />
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-bold text-xl text-slate-900 flex items-center gap-2">
              <i class="fas fa-envelope-open-text text-purple-600"></i> Live Inbox ({{ totalInquiries }})
            </h3>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[465px] overflow-y-auto custom-scrollbar">
              <div v-if="recentInquiries.length === 0" class="p-8 text-center text-slate-400 text-sm">
                <i class="fas fa-inbox text-2xl block mb-2 text-slate-300"></i> No new inquiries.
              </div>
              <div v-for="inquiry in recentInquiries" :key="inquiry.id" class="p-4 hover:bg-slate-50/80 transition-colors">
                <div class="flex justify-between items-start mb-1.5">
                  <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full truncate max-w-[190px]">
                    {{ inquiry.email }}
                  </span>
                  <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {{ formatDate(inquiry.createdDate) }}
                  </span>
                </div>
                <h4 class="font-bold text-sm text-slate-800 truncate">{{ inquiry.subject }}</h4>
                <p class="text-xs text-slate-500 line-clamp-2 mt-1">{{ inquiry.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="detailModal.show"
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click.self="detailModal.show = false"
        >
          <div class="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
              <div>
                <span class="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md text-indigo-200 font-semibold">
                  {{ detailModal.title }}
                </span>
                <h3 class="font-extrabold text-lg tracking-tight mt-1">{{ detailModal.subtitle }}</h3>
              </div>
              <button @click="detailModal.show = false" class="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white outline-none">
                <i class="fas fa-times text-sm"></i>
              </button>
            </div>
            <div class="overflow-y-auto p-6 space-y-4">
              <div v-if="detailModal.patients.length === 0" class="text-center py-12 text-slate-400">
                No patients match this criteria.
              </div>
              <div v-else>
                <ResponsiveTable
                  :headers="['Name', 'Procedure', 'Age', 'Country', 'Price (KES)']"
                  :data="detailModal.patients"
                  :actions="true"
                  @view="goToPatient"
                />
              </div>
            </div>
            <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <span class="text-xs text-slate-500">{{ detailModal.patients.length }} patients</span>
              <div class="flex gap-2">
                <button
                  @click="navigateToFilteredRegistry(detailModal.type)"
                  class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  View Full Registry
                </button>
                <button
                  @click="detailModal.show = false"
                  class="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useWixData } from '../composables/useWixData'
import NavBar from '../components/NavBar.vue'
import StatsCards from '../components/StatsCards.vue'
import AgeChart from '../components/AgeChart.vue'
import ProcedureChart from '../components/ProcedureChart.vue'
import CountryChart from '../components/CountryChart.vue'
import RegistrationsChart from '../components/RegistrationsChart.vue'
import ResponsiveTable from '../components/ResponsiveTable.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const { patients, inquiries, loading } = useWixData()

// --- Filter state ---
const dateFrom = ref('')
const dateTo = ref('')
const activeProcedureFilter = ref('')
const ageFilter = ref('')
const countryFilter = ref('')
const monthFilter = ref('')
const pastSurgeriesFilter = ref(false)
const bmiHighRiskFilter = ref(false)

const hasActiveFilters = computed(() => {
  return dateFrom.value || dateTo.value || activeProcedureFilter.value || ageFilter.value || countryFilter.value || monthFilter.value || pastSurgeriesFilter.value || bmiHighRiskFilter.value
})

// --- Helper functions ---
const isWithinRange = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  if (dateFrom.value && new Date(dateFrom.value) > d) return false
  if (dateTo.value && new Date(dateTo.value) < d) return false
  return true
}
const ageInRange = (age, bracket) => {
  if (age == null) return false
  const a = Number(age)
  if (isNaN(a)) return false
  if (bracket === '18-25') return a >= 18 && a <= 25
  if (bracket === '26-35') return a >= 26 && a <= 35
  if (bracket === '36-50') return a >= 36 && a <= 50
  if (bracket === '51+') return a >= 51
  return false
}
const countryMatch = (patientCountry, filter) => {
  if (!patientCountry) return false
  return patientCountry.toLowerCase() === filter.toLowerCase()
}
const monthMatch = (dateStr, monthKey) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return key === monthKey
}

// Master filtered list
const filteredPatients = computed(() => {
  let list = patients.value || []
  if (dateFrom.value || dateTo.value) list = list.filter(p => isWithinRange(p.createdDate))
  if (activeProcedureFilter.value) list = list.filter(p => p.selectedProcedure === activeProcedureFilter.value)
  if (ageFilter.value) list = list.filter(p => ageInRange(p.age, ageFilter.value))
  if (countryFilter.value) list = list.filter(p => countryMatch(p.Country, countryFilter.value))
  if (monthFilter.value) list = list.filter(p => monthMatch(p.createdDate, monthFilter.value))
  if (pastSurgeriesFilter.value) list = list.filter(p => {
    const val = String(p.pastSurgeries || '').toLowerCase()
    return val.includes('yes') || (val.length > 0 && !val.includes('no'))
  })
  if (bmiHighRiskFilter.value) list = list.filter(p => Number(p?.bmi || 0) >= 30 && Number(p?.bmi || 0) <= 90)
  return list
})

// --- Stats ---
const totalPatients = computed(() => filteredPatients.value.length)
const mostRequestedProc = computed(() => {
  const map = {}
  filteredPatients.value.forEach(p => {
    const proc = p.selectedProcedure || 'General Consultation'
    map[proc] = (map[proc] || 0) + 1
  })
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || '—'
})

const averageAge = computed(() => {
  // use fallback ages (24-46) if real age missing
  const ages = filteredPatients.value.map(p => Number(p.age)).filter(a => !isNaN(a) && a > 0 && a < 120)
  return ages.length ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : 'N/A'
})

const nonSurgicalPercent = computed(() => {
  if (!totalPatients.value) return 0
  const nonSurg = filteredPatients.value.filter(p => p.isNonSurgical).length
  return Math.round((nonSurg / totalPatients.value) * 100)
})
const avgWeight = computed(() => {
  const vals = filteredPatients.value.map(p => Number(p?.weight || 0)).filter(w => w > 0 && w < 500)
  return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 'N/A'
})
const avgHeight = computed(() => {
  const vals = filteredPatients.value.map(p => Number(p?.height || 0)).filter(h => h > 0 && h < 300)
  return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 'N/A'
})
const avgBmi = computed(() => {
  const items = filteredPatients.value.map(p => Number(p?.bmi || 0)).filter(b => b >= 10 && b <= 90)
  return items.length ? (items.reduce((s, v) => s + v, 0) / items.length).toFixed(1) : 'N/A'
})
const bmisOver30 = computed(() => filteredPatients.value.filter(p => Number(p?.bmi || 0) >= 30 && Number(p?.bmi || 0) <= 90).length)
const surgicalHistoryCount = computed(() => filteredPatients.value.filter(p => {
  const val = String(p.pastSurgeries || '').toLowerCase()
  return val.includes('yes') || (val.length > 0 && !val.includes('no'))
}).length)

const topProcedures = computed(() => {
  const map = {}
  filteredPatients.value.forEach(p => {
    const proc = p.selectedProcedure || 'General Consultation'
    map[proc] = (map[proc] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
})

const ageDistribution = computed(() => {
  const groups = [0,0,0,0]
  filteredPatients.value.forEach(p => {
    const age = Number(p.age)
    if (isNaN(age)) return
    if (age >= 18 && age <= 25) groups[0]++
    else if (age >= 26 && age <= 35) groups[1]++
    else if (age >= 36 && age <= 50) groups[2]++
    else if (age > 50) groups[3]++
  })
  return groups
})

const procedureData = computed(() => {
  const counts = {}
  filteredPatients.value.forEach(p => {
    const proc = p.selectedProcedure || 'General Consultation'
    counts[proc] = (counts[proc] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return { labels: sorted.map(e => e[0]), counts: sorted.map(e => e[1]) }
})

const countryDistribution = computed(() => {
  const counts = {}
  filteredPatients.value.forEach(p => {
    const c = p.Country || 'Kenya'
    counts[c] = (counts[c] || 0) + 1
  })
  return { labels: Object.keys(counts), values: Object.values(counts) }
})

const registrationsTimeSeries = computed(() => {
  const months = {}
  filteredPatients.value.forEach(p => {
    if (p.createdDate) {
      const d = new Date(p.createdDate)
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months[key] = (months[key] || 0) + 1
      }
    }
  })
  const sortedKeys = Object.keys(months).sort()
  return { labels: sortedKeys, counts: sortedKeys.map(k => months[k]) }
})

const recentInquiries = computed(() => (inquiries.value || []).slice(0, 15))
const totalInquiries = computed(() => (inquiries.value || []).length)

// --- Table pagination ---
const displayedPatients = computed(() => filteredPatients.value)
const tablePageSize = 10
const tablePage = ref(1)
const paginatedDisplayedPatients = computed(() => {
  const start = (tablePage.value - 1) * tablePageSize
  return displayedPatients.value.slice(start, start + tablePageSize)
})
const handleTablePageChange = (page) => { tablePage.value = page }

// --- Event handlers ---
const handleAgeClick = (label) => { ageFilter.value = label; tablePage.value = 1 }
const handleCountryClick = (label) => { countryFilter.value = label; tablePage.value = 1 }
const handleMonthClick = (monthLabel) => { monthFilter.value = monthLabel; tablePage.value = 1 }
const handleProcedureClick = (label) => { activeProcedureFilter.value = label; tablePage.value = 1 }

const clearDateFilter = () => { dateFrom.value = ''; dateTo.value = '' }
const resetAllFilters = () => {
  dateFrom.value = ''
  dateTo.value = ''
  activeProcedureFilter.value = ''
  ageFilter.value = ''
  countryFilter.value = ''
  monthFilter.value = ''
  pastSurgeriesFilter.value = false
  bmiHighRiskFilter.value = false
  tablePage.value = 1
}

// --- Detail modal ---
const detailModal = reactive({ show: false, title: '', subtitle: '', type: '', patients: [] })
const openDetailModal = (cardType) => {
  let patientsSubset = []
  let title = ''
  let subtitle = ''
  switch (cardType) {
    case 'total':
      patientsSubset = filteredPatients.value
      title = 'Total Patients'
      subtitle = 'All Quote Submissions'
      break
    case 'procedure':
      if (mostRequestedProc.value && mostRequestedProc.value !== '—') {
        patientsSubset = filteredPatients.value.filter(p => p.selectedProcedure === mostRequestedProc.value)
        title = 'Most Requested Procedure'
        subtitle = mostRequestedProc.value
      }
      break
    case 'age':
      patientsSubset = filteredPatients.value.filter(p => p.age !== null && p.age >= 18 && p.age <= 25)
      title = 'Average Age'
      subtitle = 'Patients 18-25 (youngest bracket)'
      break
    case 'nonSurgical':
      patientsSubset = filteredPatients.value.filter(p => p.isNonSurgical)
      title = 'Non‑Surgical %'
      subtitle = 'Non‑Surgical Patients'
      break
    default:
      break
  }
  detailModal.show = true
  detailModal.title = title
  detailModal.subtitle = subtitle
  detailModal.type = cardType
  detailModal.patients = patientsSubset
}
const navigateToFilteredRegistry = (type) => {
  if (type === 'nonSurgical') {
    router.push({ path: '/patients', query: { nonSurgical: 'true' } })
  } else if (type === 'procedure' && mostRequestedProc.value !== '—') {
    router.push({ path: '/patients', query: { procedure: mostRequestedProc.value } })
  } else {
    router.push('/patients')
  }
}

const goToPatient = (p) => { if (p?.id) router.push(`/patients/${p.id}`) }
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}
</script>