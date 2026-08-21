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

      <!-- Active Automation Status -->
      <div v-if="settings?.activatedAt" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <p class="font-semibold text-emerald-800 text-sm">Automation Active</p>
            <p class="text-xs text-emerald-600">
              Running since {{ formatDate(settings.activatedAt?.toDate()) }} · Frequency: {{ settings.frequency }} at {{ settings.time }}
            </p>
          </div>
        </div>
        <button
          @click="cancelAutomation"
          class="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition"
        >
          <i class="fas fa-stop-circle mr-1"></i> Cancel Automation
        </button>
      </div>

      <!-- Wizard Container -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            class="flex items-center gap-2"
            :class="{ 'opacity-60': currentStep < idx }"
          >
            <div
              class="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
              :class="currentStep === idx ? 'bg-indigo-600 text-white scale-110' : currentStep > idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'"
            >
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

              <div class="flex gap-2">
                <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                  Next <i class="fas fa-arrow-right ml-1"></i>
                </button>
                <button @click="saveDraft" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition">
                  Save Draft
                </button>
              </div>
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
              <div class="flex gap-2">
                <button @click="saveMailingList" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition">
                  <i class="fas fa-save mr-1"></i> Save Mailing List
                </button>
                <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                  Next <i class="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
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
              <div class="flex gap-2">
                <button @click="currentStep++" class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">
                  Next <i class="fas fa-arrow-right ml-1"></i>
                </button>
                <button @click="saveDraft" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition">
                  Save Draft
                </button>
              </div>
            </div>

            <!-- Step 4: Confirmation -->
            <div v-else key="step4" class="space-y-6 text-center">
              <div class="text-5xl">✅</div>
              <h2 class="text-xl font-bold text-slate-900">Settings Ready!</h2>
              <p class="text-slate-500">Your automated report will be generated according to your preferences.</p>
              <button @click="activateAutomation" class="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition transform hover:scale-105">
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

const { settings, emailLogs, loadSettings, saveSettings, cancelAutomation, loadEmailLogs, sendReportEmail } = useAutomationSettings()
const { procedures, patients } = useWixData()
const { gaData, fetchData: fetchGA } = useGoogleAnalytics()

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
}

const form = reactive({ ...defaultForm })

const trafficSources = computed(() => (gaData.value?.trafficSources || []).map(s => s.source))
const countries = computed(() => (gaData.value?.topCountries || []).map(c => c.country))
const devices = computed(() => (gaData.value?.deviceCategories || []).map(d => d.device))

watch(settings, (newSettings) => {
  if (newSettings) {
    Object.assign(form, defaultForm, newSettings)
  }
}, { immediate: true })

onMounted(() => {
  loadSettings()
  loadEmailLogs()
  fetchGA()
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

const saveDraft = async () => {
  await saveSettings({ ...form })
  alert('Draft saved!')
}

const saveMailingList = async () => {
  await saveSettings({ ...form })
  alert('Mailing list saved!')
}

const activateAutomation = async () => {
  await saveSettings({
    ...form,
    activatedAt: new Date(), // Firestore timestamp
  })
  currentStep.value = 0
  alert('Automation activated!')
}

const sendNow = async () => {
  if (!form.recipients || form.recipients.length === 0) {
    alert('Please add at least one recipient email.')
    return
  }
  sendingNow.value = true

  let reportType = 'Report'
  let reportData = {}

  const periodFilters = {
    dateFrom: form.dataType === 'web' ? form.webDateFrom : form.patientDateFrom,
    dateTo: form.dataType === 'web' ? form.webDateTo : form.patientDateTo,
  };

  // Patient data (only if includePatientData is true)
  if ((form.dataType === 'patient' || form.dataType === 'both') && form.includePatientData) {
    const filteredPatients = patients.value || []
    reportData.summary = {
      totalPatients: filteredPatients.length,
      generatedAt: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
    }
    reportData.tables = [
      {
        title: 'Patient Data',
        headers: ['Name', 'Procedure', 'Age', 'Price'],
        rows: filteredPatients.slice(0, 10).map(p => [p.name, p.selectedProcedure, p.age, p.calculatedPrice]),
      },
    ]
    reportType = form.dataType === 'both' ? 'Patient & Web Report' : 'Patient Report'
  } else if (form.dataType === 'patient' && !form.includePatientData) {
    reportData.summary = {
      totalPatients: patients.value.length,
      note: 'Detailed patient data not included',
    }
    reportType = 'Patient Report'
  }

  // Web data (always included if dataType includes web)
  if (form.dataType === 'web' || form.dataType === 'both') {
    if (gaData.value) {
      const summary = gaData.value.summary || {}
      reportData.summary = {
        ...reportData.summary,
        totalUsers: summary.totalUsers,
        sessions: summary.sessions,
        pageViews: summary.screenPageViews,
        bounceRate: summary.bounceRate,
      }
      reportData.tables = reportData.tables || []
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
      if (form.dataType === 'web') {
        reportType = 'Web Analytics Report'
      }
    } else {
      alert('Web data not available yet. Please try again later.')
      sendingNow.value = false
      return
    }
  }

  const result = await sendReportEmail(form.recipients, reportData, reportType, periodFilters)
  sendingNow.value = false
  if (result.success) {
    alert('Report sent successfully!')
  } else {
    alert('Failed to send report: ' + result.error)
  }
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