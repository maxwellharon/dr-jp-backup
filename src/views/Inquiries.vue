<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    
    <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i class="fas fa-envelope-open-text text-indigo-600"></i> Live Messages Inbox
          </h2>
          <p class="text-slate-500 text-sm mt-0.5">Review general public questions and form submissions synced from the Wix cloud engine.</p>
        </div>
        <div class="bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm shadow-inner shrink-0">
          Total Entries Count: {{ filteredInquiries.length }}
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="relative sm:col-span-2">
          <i class="fas fa-search absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
          <input 
            v-model="search" 
            placeholder="Search matching email accounts, subjects, or message transcripts..." 
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-700 placeholder-slate-400"
          />
        </div>

        <div class="relative">
          <select v-model="sortBy" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition text-sm text-slate-700 appearance-none">
            <option value="recent">Sort: Most Recently Received</option>
            <option value="email-az">Sort: Sender Email (A-Z)</option>
            <option value="subject-az">Sort: Subject Header (A-Z)</option>
          </select>
          <i class="fas fa-sort-amount-down absolute right-3.5 top-4 text-slate-400 pointer-events-none text-xs"></i>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center justify-center space-y-3">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600"></div>
        <p class="text-sm font-medium text-slate-500">Retrieving secure communications log tables...</p>
      </div>

      <template v-else>
        <div v-if="filteredInquiries.length === 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-400">
          <i class="fas fa-inbox text-4xl block mb-3 text-slate-300"></i>
          <p class="font-bold text-slate-700">No matching communications tracked</p>
          <p class="text-xs text-slate-400 mt-0.5">Try altering text keywords or removing filters to expand parsing ranges.</p>
        </div>

        <div v-else class="space-y-4">
          <div class="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Exact Receipt Timestamp</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Sender Email Address</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Subject Matter Line</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Message Transcript Abstract</th>
                    <th scope="col" class="px-6 py-4 text-right font-semibold">Action Control</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  <tr v-for="inq in paginatedInquiries" :key="inq.id" class="hover:bg-indigo-50/20 transition-colors group">
                    <td class="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-500">
                      {{ formatHighFidelityTimestamp(inq.createdDate) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                        <i class="far fa-user text-[10px] opacity-70"></i> {{ inq.email || 'anonymous@wix.io' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-800">
                      {{ inq.subject || '—' }}
                    </td>
                    <td class="px-6 py-4 max-w-xs">
                      <p class="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                        {{ inq.message || '—' }}
                      </p>
                    </td>
                    <td class="px-6 py-4 text-right whitespace-nowrap text-xs font-medium">
                      <button @click="openInquiryModal(inq)" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ml-auto">
                        <i class="fas fa-expand-arrows-alt text-[10px]"></i> Inspect Full Text
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p class="text-xs font-medium text-slate-500">
              Displaying indices tracking items {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredInquiries.length) }} of {{ filteredInquiries.length }}.
            </p>
            <Pagination 
              :current-page="currentPage" 
              :total-pages="totalPages" 
              @page-change="handlePageChange" 
            />
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="showModal && activeInquiry" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col transform transition-transform scale-100 max-h-[90vh]">
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
            <div>
              <span class="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md text-indigo-200 font-semibold">Transmission Packet Readout</span>
              <h3 class="font-extrabold text-lg tracking-tight mt-0.5 truncate max-w-[450px]" :title="activeInquiry.subject">{{ activeInquiry.subject || 'No Subject Specified' }}</h3>
            </div>
            <button @click="closeInquiryModal" class="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white outline-none">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sender Account Email</p>
                <p class="font-bold text-slate-900 mt-0.5 font-mono break-all">{{ activeInquiry.email }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exact Cloud Delivery Code</p>
                <p class="font-bold text-slate-600 mt-0.5 font-mono">{{ formatHighFidelityTimestamp(activeInquiry.createdDate) }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fas fa-align-left text-slate-400"></i> Explicit Body Transcript Text Message
              </p>
              <div class="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl font-normal text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[300px] overflow-y-auto">
                {{ activeInquiry.message || 'The data structure tracking this specific collection payload message body string contains an empty sequence.' }}
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
            <button @click="closeInquiryModal" class="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition shadow-sm">
              Acknowledge and Close Panel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWixData } from '../composables/useWixData'
import NavBar from '../components/NavBar.vue'
import Pagination from '../components/Pagination.vue'

const { inquiries, loading } = useWixData()
const currentPage = ref(1)
const pageSize = 10
const search = ref('')
const sortBy = ref('recent')

// Dialog modal UI control state values
const showModal = ref(false)
const activeInquiry = ref(null)

// Highly defensive dynamic evaluation filter stream
const filteredInquiries = computed(() => {
  const baseList = inquiries.value || []
  let list = [...baseList] // Safe proxy array clone mutation bypass isolation

  // 1. Text Search Evaluation match layers
  if (search.value) {
    const s = search.value.toLowerCase().trim()
    list = list.filter(inq => {
      if (!inq) return false
      const email = String(inq.email || '').toLowerCase()
      const subject = String(inq.subject || '').toLowerCase()
      const msg = String(inq.message || '').toLowerCase()
      
      return email.includes(s) || subject.includes(s) || msg.includes(s)
    })
  }

  // 2. Sorting Core Engine Execution Sequence rules
  if (sortBy.value === 'recent') {
    list.sort((a, b) => {
      const dateB = b?.createdDate ? new Date(b.createdDate).getTime() : 0
      const dateA = a?.createdDate ? new Date(a.createdDate).getTime() : 0
      return dateB - dateA
    })
  } else if (sortBy.value === 'email-az') {
    list.sort((a, b) => String(a?.email || '').localeCompare(String(b?.email || '')))
  } else if (sortBy.value === 'subject-az') {
    list.sort((a, b) => String(a?.subject || '').localeCompare(String(b?.subject || '')))
  }

  return list
})

const totalPages = computed(() => Math.ceil(filteredInquiries.value.length / pageSize) || 1)

const paginatedInquiries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredInquiries.value.slice(start, start + pageSize)
})

// Auto sync indices mapping parameters cleanly
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = 1
  }
})

const handlePageChange = (page) => {
  currentPage.value = page
}

// Modal Toggle Action Controls
const openInquiryModal = (inquiry) => {
  activeInquiry.value = inquiry
  showModal.value = true
}

const closeInquiryModal = () => {
  showModal.value = false
  activeInquiry.value = null
}

// Precise Exact High-Fidelity Submission Timestamp Formatter Engine
const formatHighFidelityTimestamp = (dateStr) => {
  if (!dateStr) return '—'
  const timeInstance = new Date(dateStr)
  if (isNaN(timeInstance.getTime())) return '—'
  
  return timeInstance.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>