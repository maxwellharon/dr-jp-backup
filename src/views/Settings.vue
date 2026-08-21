<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    <div class="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <i class="fas fa-cog text-indigo-600"></i> Automation Settings
          </h1>
          <p class="text-slate-500 text-sm mt-1">Configure automated report generation and email delivery.</p>
        </div>
        <button
          @click="sendNow"
          :disabled="sendingNow"
          class="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm text-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          <i class="fas fa-paper-plane"></i>
          {{ sendingNow ? 'Sending...' : 'Send Report Now' }}
        </button>
      </div>

      <!-- Active Automations -->
      <div v-if="activeAutomations.length > 0" class="space-y-3">
        <h2 class="text-lg font-bold text-slate-900">⚡ Active Automations</h2>
        <div v-for="auto in activeAutomations" :key="auto.id" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p class="font-semibold text-emerald-800 text-sm">{{ auto.reportType }} - {{ auto.frequency }}</p>
              <p class="text-xs text-emerald-600">Started {{ formatDate(auto.activatedAt?.toDate()) }}</p>
            </div>
          </div>
          <button @click="handleCancelAutomation(auto.id)" class="text-red-500 hover:text-red-700 text-sm font-semibold">
            <i class="fas fa-times-circle mr-1"></i> Cancel
          </button>
        </div>
      </div>

      <!-- Wizard Container -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div v-for="(step, idx) in steps" :key="idx" class="flex items-center gap-2" :class="{ 'opacity-60': currentStep < idx }">
            <div class="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300" :class="currentStep === idx ? 'bg-indigo-600 text-white scale-110' : currentStep > idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'">
              <i v-if="currentStep > idx" class="fas fa-check"></i>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span class="hidden md:inline text-xs font-semibold text-slate-600">{{ step.title }}</span>
          </div>
        </div>

        <div class="p-6 md:p-8">
          <Transition name="slide-fade" mode="out-in">
            <!-- Step 0: Data Selection -->
            <div v-if="currentStep === 0" key="step0" class="space-y-6">
              <h2 class="text-xl font-bold text-slate-900">📊 What data should be included?</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button @click="form.dataType = 'patient'; currentStep++" class="p-6 rounded-2xl border-2 transition-all hover:shadow-lg" :class="form.dataType === 'patient' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-user-injured text-3xl text-indigo-600 mb-3"></i>
                  <h3 class="font-bold">Patient Only</h3>
                  <p class="text-xs text-slate-500 mt-1">Clinical data and registrations</p>
                </button>
                <button @click="form.dataType = 'web'; currentStep++" class="p-6 rounded-2xl border-2 transition-all hover:shadow-lg" :class="form.dataType === 'web' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-globe text-3xl text-emerald-600 mb-3"></i>
                  <h3 class="font-bold">Web Only</h3>
                  <p class="text-xs text-slate-500 mt-1">Google Analytics site data</p>
                </button>
                <button @click="form.dataType = 'both'; currentStep++" class="p-6 rounded-2xl border-2 transition-all hover:shadow-lg" :class="form.dataType === 'both' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-layer-group text-3xl text-purple-600 mb-3"></i>
                  <h3 class="font-bold">Both</h3>
                  <p class="text-xs text-slate-500 mt-1">Patient + Web combined</p>
                </button>
              </div>
            </div>

            <!-- Step 1: Filters -->
            <div v-else-if="currentStep === 1" key="step1" class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-slate-900">🔍 Filters</h2>
                <button @click="currentStep--" class="text-sm text-indigo-600 hover:underline">← Back</button>
              </div>

              <!-- Patient Data Filters -->
              <div v-if="form.dataType === 'patient' || form.dataType === 'both'" class="space-y-4 border-l-4 border-indigo-200 pl-4">
                <h3 class="font-semibold text-slate-700 flex items-center gap-2">
                  <i class="fas fa-user-injured text-indigo-500"></i> Patient Data Filters
                </h3>
                <label class="flex items-center gap-2 text-sm bg-white p-3 rounded-xl border border-slate-200">
                  <input type="checkbox" v-model="form.includePatientData" class="rounded text-indigo-600 focus:ring-indigo-500" />
                  Include detailed patient data in report
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Date From</label>
                    <input type="date" v-model="form.patientDateFrom" class="w-full border rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Date To</label>
                    <input type="date" v-model="form.patientDateTo" class="w-full border rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Procedure</label>
                    <select v-model="form.procedureFilter" class="w-full border rounded-lg p-2 text-sm bg-white">
                      <option value="all">All Procedures</option>
                      <option v-for="proc in procedures" :key="proc" :value="proc">{{ proc }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Country</label>
                    <input type="text" v-model="form.countryFilter" placeholder="e.g., Kenya" class="w-full border rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Status</label>
                    <select v-model="form.statusFilter" class="w-full border rounded-lg p-2 text-sm bg-white">
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Web Data Filters -->
              <div v-if="form.dataType === 'web' || form.dataType === 'both'" class="space-y-4 border-l-4 border-emerald-200 pl-4">
                <h3 class="font-semibold text-slate-700 flex items-center gap-2">
                  <i class="fas fa-globe text-emerald-500"></i> Web Data Filters
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Date From</label>
                    <input type="date" v-model="form.webDateFrom" class="w-full border rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Date To</label>
                    <input type="date" v-model="form.webDateTo" class="w-full border rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Source</label>
                    <select v-model="form.sourceFilter" class="w-full border rounded-lg p-2 text-sm bg-white">
                      <option value="all">All Sources</option>
                      <option v-for="src in trafficSources" :key="src" :value="src">{{ src }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Country</label>
                    <select v-model="form.webCountryFilter" class="w-full border rounded-lg p-2 text-sm bg-white">
                      <option value="all">All Countries</option>
                      <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-600 mb-1">Device</label>
                    <select v-model="form.deviceFilter" class="w-full border rounded-lg p-2 text-sm bg-white">
                      <option value="all">All Devices</option>
                      <option v-for="d in devices" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Next <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>

            <!-- Step 2: Recipients -->
            <div v-else-if="currentStep === 2" key="step2" class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-slate-900">📧 Recipient List</h2>
                <button @click="currentStep--" class="text-sm text-indigo-600 hover:underline">← Back</button>
              </div>
              <div class="flex gap-2">
                <input type="email" v-model="newEmail" placeholder="Enter email address" class="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" @keyup.enter="addEmail" />
                <button @click="addEmail" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">Add</button>
              </div>
              <div class="space-y-2">
                <div v-for="(email, idx) in form.recipients" :key="idx" class="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span class="text-sm">{{ email }}</span>
                  <button @click="removeEmail(idx)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </div>
                <p v-if="form.recipients.length === 0" class="text-sm text-slate-400 text-center py-4">No recipients added yet.</p>
              </div>
              <button @click="saveMailingList" class="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition">
                <i class="fas fa-save mr-1"></i> Save Mailing List
              </button>
              <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Next <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>

            <!-- Step 3: Frequency -->
            <div v-else-if="currentStep === 3" key="step3" class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-slate-900">⏰ Schedule</h2>
                <button @click="currentStep--" class="text-sm text-indigo-600 hover:underline">← Back</button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button @click="form.frequency = 'daily'" class="p-4 rounded-xl border-2 text-center transition-all" :class="form.frequency === 'daily' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-sun text-2xl text-amber-500"></i>
                  <p class="font-bold mt-1">Daily</p>
                </button>
                <button @click="form.frequency = 'weekly'" class="p-4 rounded-xl border-2 text-center transition-all" :class="form.frequency === 'weekly' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-calendar-week text-2xl text-blue-500"></i>
                  <p class="font-bold mt-1">Weekly</p>
                </button>
                <button @click="form.frequency = 'monthly'" class="p-4 rounded-xl border-2 text-center transition-all" :class="form.frequency === 'monthly' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'">
                  <i class="fas fa-calendar-alt text-2xl text-purple-500"></i>
                  <p class="font-bold mt-1">Monthly</p>
                </button>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-600 mb-1">Time of Day</label>
                <input type="time" v-model="form.time" class="border rounded-lg p-2 text-sm" />
              </div>
              <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Next <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>

            <!-- Step 4: Confirmation -->
            <div v-else key="step4" class="space-y-6 text-center">
              <div class="text-5xl">✅</div>
              <h2 class="text-xl font-bold text-slate-900">Settings Ready!</h2>
              <p class="text-slate-500">Your automated report will be generated according to your preferences.</p>
              <button @click="saveSettingsAndFinish" class="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition transform hover:scale-105">
                <i class="fas fa-check-circle mr-2"></i> Activate Automation
              </button>
              <button @click="currentStep--" class="text-sm text-indigo-600 hover:underline">← Back</button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Email Logs -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100">
          <h2 class="text-lg font-bold text-slate-900">📨 Email Logs</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-2 text-left">Date</th>
                <th class="px-4 py-2 text-left">Recipients</th>
                <th class="px-4 py-2 text-left">Report Type</th>
                <th class="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="log in emailLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="px-4 py-2">{{ formatDate(log.sentAt?.toDate()) }}</td>
                <td class="px-4 py-2">{{ log.recipients?.join(', ') }}</td>
                <td class="px-4 py-2">{{ log.reportType }}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ log.success ? 'Sent' : 'Failed' }}
                  </span>
                </td>
              </tr>
              <tr v-if="emailLogs.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-slate-400">No email logs yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import NavBar from '../components/NavBar.vue'
import { useAutomationSettings } from '../composables/useAutomationSettings'
import { useWixData } from '../composables/useWixData'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import { useReportGeneration } from '../composables/useReportGeneration'
import Chart from 'chart.js/auto'

const { settings, emailLogs, loadSettings, saveSettings, loadEmailLogs, sendReportEmail, cancelAutomation: cancelAutomationRemote } = useAutomationSettings()
const { procedures, patients } = useWixData()
const { gaData } = useGoogleAnalytics()
const { generateDetailedInsights } = useReportGeneration()

const currentStep = ref(0)
const newEmail = ref('')
const sendingNow = ref(false)
const steps = [
  { title: 'Data' },
  { title: 'Filters' },
  { title: 'Recipients' },
  { title: 'Schedule' },
  { title: 'Confirm' },
]

const defaultForm = {
  dataType: 'both',
  includePatientData: false,
  patientDateFrom: '',
  patientDateTo: '',
  procedureFilter: 'all',
  countryFilter: '',
  statusFilter: 'all',
  webDateFrom: '',
  webDateTo: '',
  sourceFilter: 'all',
  webCountryFilter: 'all',
  deviceFilter: 'all',
  recipients: [],
  frequency: 'weekly',
  time: '09:00',
  activatedAt: null,
}

const form = reactive({ ...defaultForm })
const activeAutomations = ref([])

const trafficSources = computed(() => (gaData.value?.trafficSources || []).map(s => s.source))
const countries = computed(() => (gaData.value?.topCountries || []).map(c => c.country))
const devices = computed(() => (gaData.value?.deviceCategories || []).map(d => d.device))

watch(settings, (newSettings) => {
  if (newSettings) {
    Object.assign(form, defaultForm, newSettings)
    if (newSettings.activatedAt) {
      activeAutomations.value = [{
        id: 'global',
        reportType: newSettings.dataType,
        frequency: newSettings.frequency,
        activatedAt: newSettings.activatedAt,
      }]
    } else {
      activeAutomations.value = []
    }
  }
}, { immediate: true })

onMounted(() => {
  loadSettings()
  loadEmailLogs()
})

const addEmail = () => {
  const email = newEmail.value.trim()
  if (email && !form.recipients.includes(email)) {
    form.recipients.push(email)
  }
  newEmail.value = ''
}

const removeEmail = (idx) => {
  form.recipients.splice(idx, 1)
}

const saveMailingList = async () => {
  await saveSettings({ ...form })
  alert('Mailing list saved!')
}

const saveSettingsAndFinish = async () => {
  const updatedForm = { ...form, activatedAt: new Date() }
  await saveSettings(updatedForm)
  activeAutomations.value = [{
    id: 'global',
    reportType: updatedForm.dataType,
    frequency: updatedForm.frequency,
    activatedAt: updatedForm.activatedAt,
  }]
  currentStep.value = 0
  alert('Automation activated!')
}

const handleCancelAutomation = async (id) => {
  await cancelAutomationRemote(id)
  activeAutomations.value = []
  alert('Automation cancelled.')
}

// Helper: generate chart image from config
async function generateChartImage(config, width = 600, height = 300) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const chart = new Chart(ctx, config)
  await new Promise(resolve => setTimeout(resolve, 300))
  const image = canvas.toDataURL('image/png')
  chart.destroy()
  return image
}

// Generate patient charts (only if includePatientData)
async function generatePatientCharts(data) {
  const charts = []
  if (!data.length) return charts

  const procMap = new Map()
  data.forEach(p => procMap.set(p.selectedProcedure, (procMap.get(p.selectedProcedure) || 0) + 1))
  const topProcs = [...procMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const procLabels = topProcs.map(e => e[0])
  const procValues = topProcs.map(e => e[1])

  const countryMap = new Map()
  data.forEach(p => countryMap.set(p.country, (countryMap.get(p.country) || 0) + 1))
  const countryLabels = [...countryMap.keys()]
  const countryValues = [...countryMap.values()]

  const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 }
  data.forEach(p => {
    const age = Number(p.age)
    if (age >= 18 && age <= 25) ageGroups['18-25']++
    else if (age >= 26 && age <= 35) ageGroups['26-35']++
    else if (age >= 36 && age <= 50) ageGroups['36-50']++
    else if (age > 50) ageGroups['51+']++
  })
  const ageLabels = Object.keys(ageGroups)
  const ageValues = Object.values(ageGroups)

  // Bar chart: top procedures
  charts.push({
    title: 'Top Procedures',
    image: await generateChartImage({
      type: 'bar',
      data: {
        labels: procLabels,
        datasets: [{
          label: 'Requests',
          data: procValues,
          backgroundColor: '#6366f1',
          borderRadius: 8,
        }]
      },
      options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
  })

  // Pie chart: countries
  charts.push({
    title: 'Country Distribution',
    image: await generateChartImage({
      type: 'pie',
      data: {
        labels: countryLabels,
        datasets: [{
          data: countryValues,
          backgroundColor: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16'],
          borderWidth: 0
        }]
      },
      options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom' } } }
    }, 400, 280)
  })

  // Bar chart: age groups
  charts.push({
    title: 'Age Distribution',
    image: await generateChartImage({
      type: 'bar',
      data: {
        labels: ageLabels,
        datasets: [{
          label: 'Patients',
          data: ageValues,
          backgroundColor: '#818cf8',
          borderRadius: 8,
        }]
      },
      options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
  })

  return charts
}

// Generate web charts
async function generateWebCharts(data) {
  const charts = []
  if (!data) return charts

  // Time series line chart
  if (data.timeSeries && data.timeSeries.length > 0) {
    charts.push({
      title: 'Visitors Over Time',
      image: await generateChartImage({
        type: 'line',
        data: {
          labels: data.timeSeries.map(d => d.date),
          datasets: [{
            label: 'Active Users',
            data: data.timeSeries.map(d => Number(d.activeUsers)),
            fill: false,
            borderColor: '#6366f1',
            tension: 0.1,
            pointBackgroundColor: '#6366f1'
          }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      })
    })
  }

  // Pie chart: top countries
  if (data.topCountries && data.topCountries.length > 0) {
    charts.push({
      title: 'Top Countries',
      image: await generateChartImage({
        type: 'pie',
        data: {
          labels: data.topCountries.map(c => c.country),
          datasets: [{
            data: data.topCountries.map(c => c.sessions),
            backgroundColor: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16'],
            borderWidth: 0
          }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom' } } }
      }, 400, 280)
    })
  }

  // Bar chart: traffic sources
  if (data.trafficSources && data.trafficSources.length > 0) {
    charts.push({
      title: 'Traffic Sources',
      image: await generateChartImage({
        type: 'bar',
        data: {
          labels: data.trafficSources.map(s => s.source),
          datasets: [{
            label: 'Sessions',
            data: data.trafficSources.map(s => s.sessions),
            backgroundColor: '#818cf8',
            borderRadius: 8,
          }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      })
    })
  }

  // Doughnut chart: devices
  if (data.deviceCategories && data.deviceCategories.length > 0) {
    charts.push({
      title: 'Device Breakdown',
      image: await generateChartImage({
        type: 'doughnut',
        data: {
          labels: data.deviceCategories.map(d => d.device),
          datasets: [{
            data: data.deviceCategories.map(d => d.sessions),
            backgroundColor: ['#34d399','#60a5fa','#fbbf24'],
            borderWidth: 0
          }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom' } } }
      }, 400, 280)
    })
  }

  return charts
}

const sendNow = async () => {
  if (!form.recipients || form.recipients.length === 0) {
    alert('Please add at least one recipient email.')
    return
  }
  sendingNow.value = true

  let reportType = 'Report'
  let reportData = { summary: {}, tables: [], aiInsights: [], images: [] }
  const filters = {
    dateFrom: form.patientDateFrom || form.webDateFrom,
    dateTo: form.patientDateTo || form.webDateTo,
  }

  // Patient section (AI insights always; detailed data and charts only if includePatientData)
  if (form.dataType === 'patient' || form.dataType === 'both') {
    const filteredPatients = patients.value || []
    // Patient summary always
    reportData.summary.totalPatients = filteredPatients.length

    // Patient AI insights always
    const patientInsights = generateDetailedInsights(filteredPatients)
    if (patientInsights) {
      reportData.aiInsights.push(
        { title: 'Procedure Demand Surge', message: `${patientInsights.mostRequested} leads your database, accounting for ${Math.round((patientInsights.mostRequestedCount || 0) / patientInsights.total * 100)}% of total inquiries. Ensure resource and inventory optimization for this segment.` },
        { title: 'Targeted Age Demographic', message: `The current dataset yields an average age of ${patientInsights.avgAge} years. The 26–35 bracket (${patientInsights.ageGroups['26-35']} patients) demonstrates the sharpest customer lifecycle conversion velocity.` },
        { title: 'Care Classification Footprint', message: `${patientInsights.nonSurgPercent}% of inbound leads requested non-surgical alternatives. Adding tiered skin-tightening or injectables packaging could capture unrealized revenue.` },
        { title: 'Geographic Footprint Opportunity', message: `The high concentration of submissions originates from ${patientInsights.countryDistribution[0]?.[0] || 'Kenya'}. Localized hyper-targeted clinical marketing and localized SEO focus will optimize conversion cost.` },
        { title: 'Asset Conversion Strategy', message: `Average transaction pricing maps at KES ${new Intl.NumberFormat('en-KE').format(patientInsights.avgValue)}. Integrating flexible multi-installment healthcare financing structures could reduce drop-off.` },
        { title: 'Patient Risk Profiling Matrix', message: `${patientInsights.highBmiCount} prospective clients present a calculated BMI ≥ 30.0, and ${patientInsights.pastSurgCount} note surgical backgrounds. Automated pre-anesthetic tracking flags are recommended.` }
      )
    }

    // Patient detailed data and charts only if includePatientData checked
    if (form.includePatientData) {
      reportData.tables.push({
        title: 'Patient Records',
        headers: ['Name', 'Procedure', 'Age', 'Price'],
        rows: filteredPatients.slice(0, 10).map(p => [p.name, p.selectedProcedure, p.age, p.calculatedPrice]),
      })
      reportData.images.push(...(await generatePatientCharts(filteredPatients)))
    }

    reportType = form.dataType === 'both' ? 'Patient & Web Report' : 'Patient Report'
  }

  // Web section (AI insights and charts always)
  if (form.dataType === 'web' || form.dataType === 'both') {
    if (gaData.value) {
      const summary = gaData.value.summary || {}
      reportData.summary.totalUsers = summary.totalUsers
      reportData.summary.sessions = summary.sessions
      reportData.summary.pageViews = summary.screenPageViews
      reportData.summary.bounceRate = summary.bounceRate

      reportData.tables.push({
        title: 'Top Pages',
        headers: ['Page', 'Views'],
        rows: (gaData.value.topPages || []).map(p => [p.pagePath, p.pageviews]),
      })
      reportData.tables.push({
        title: 'Traffic Sources',
        headers: ['Source', 'Sessions'],
        rows: (gaData.value.trafficSources || []).map(s => [s.source, s.sessions]),
      })

      // Web AI insights
      reportData.aiInsights.push(
        { title: 'Geographic Focus', message: `The majority of your traffic comes from ${gaData.value.topCountries?.[0]?.country || 'Kenya'}. Consider localized content and targeted ads for this region.` },
        { title: 'Top Performing Page', message: `"${gaData.value.topPages?.[0]?.pagePath || 'Home'}" is your most visited page. Ensure it has clear CTAs and fast loading times to convert visitors.` },
        { title: 'Traffic Acquisition', message: `Most sessions originate from ${gaData.value.trafficSources?.[0]?.source || 'Direct'}. Invest more in this channel or diversify to reduce dependency.` },
        { title: 'Mobile Experience', message: `${Math.round((gaData.value.deviceCategories?.find(d=>d.device==='mobile')?.sessions || 0) / (summary.sessions || 1) * 100)}% of sessions come from mobile devices. Optimize mobile UX to reduce bounce and improve engagement.` },
        { title: 'Engagement Health', message: `Bounce rate is ${summary.bounceRate}%. ${Number(summary.bounceRate) > 50 ? 'Consider improving content relevance or page speed.' : 'You are doing well, keep monitoring.'}` },
        { title: 'Content Strategy', message: `Your average session duration is ${formatDuration(summary.averageSessionDuration)}. Longer sessions indicate strong content engagement.` }
      )

      reportData.images.push(...(await generateWebCharts(gaData.value)))

      if (form.dataType === 'web') reportType = 'Web Analytics Report'
    } else {
      alert('Web data not available yet. Please try again later.')
      sendingNow.value = false
      return
    }
  }

  const result = await sendReportEmail(form.recipients, reportData, reportType, filters)
  sendingNow.value = false
  if (result.success) {
    alert('Report sent successfully!')
  } else {
    alert('Failed to send report: ' + result.error)
  }
}

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const sec = Number(seconds)
  const mins = Math.floor(sec / 60)
  const remainingSec = Math.round(sec % 60)
  return `${mins}m ${remainingSec}s`
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' })
}
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.1s ease;
}
.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}
</style>