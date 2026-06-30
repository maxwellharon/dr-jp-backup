<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    
    <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i class="fas fa-scroll text-indigo-600"></i> Clinical Procedure Catalog
          </h2>
          <p class="text-slate-500 text-sm mt-0.5">Configure, update, and audit baseline clinical item ranges synced from Wix collection definitions.</p>
        </div>
        <div class="bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm shadow-inner shrink-0">
          Active Catalogue Count: {{ filteredProcedures.length }}
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="relative">
          <i class="fas fa-search absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
          <input 
            v-model="search" 
            placeholder="Search procedure name, keywords..." 
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-700 placeholder-slate-400"
          />
        </div>

        <div class="relative">
          <select v-model="categoryFilter" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition text-sm text-slate-700 appearance-none">
            <option value="">All Categories</option>
            <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <i class="fas fa-chevron-down absolute right-3.5 top-4 text-slate-400 pointer-events-none text-xs"></i>
        </div>

        <div class="relative">
          <select v-model="sortBy" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition text-sm text-slate-700 appearance-none">
            <option value="name-az">Sort: Procedure Name (A-Z)</option>
            <option value="name-za">Sort: Procedure Name (Z-A)</option>
            <option value="price-low">Sort: Base Cost (Low → High)</option>
            <option value="price-high">Sort: Peak Cost (High → Low)</option>
          </select>
          <i class="fas fa-sort-amount-down absolute right-3.5 top-4 text-slate-400 pointer-events-none text-xs"></i>
        </div>

        <button @click="clearFilters" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2">
          <i class="fas fa-undo-alt text-xs"></i> Clear Adjustments
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center justify-center space-y-3">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600"></div>
        <p class="text-sm font-medium text-slate-500">Querying live procedure metadata collections...</p>
      </div>

      <template v-else>
        <div v-if="filteredProcedures.length === 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-400">
          <i class="fas fa-briefcase-medical text-4xl block mb-3 text-slate-300"></i>
          <p class="font-bold text-slate-700">No procedures match these parameters</p>
          <p class="text-xs text-slate-400 mt-0.5">Try widening search criteria or resetting column fields.</p>
        </div>

        <div v-else class="space-y-4">
          <div class="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Procedure Title</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Category Group</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Expected Pricing Bounds (KES)</th>
                    <th scope="col" class="px-6 py-4 text-left font-semibold">Clinical Overview Description</th>
                    <th scope="col" class="px-6 py-4 text-right font-semibold">Action Control</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  <tr v-for="proc in paginatedProcedures" :key="proc.id" class="hover:bg-indigo-50/20 transition-colors group">
                    <td class="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {{ proc.procedureName || 'Unnamed Procedure' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="categoryBadgeClass(proc.category)" class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border">
                        {{ proc.category || 'General Care' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-indigo-950">
                      KES {{ formatPrice(proc.minPrice) }} – {{ formatPrice(proc.maxPrice) }}
                    </td>
                    <td class="px-6 py-4 max-w-sm">
                      <p class="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                        {{ proc.description || 'No baseline operational specifications logged.' }}
                      </p>
                    </td>
                    <td class="px-6 py-4 text-right whitespace-nowrap text-xs font-medium">
                      <button @click="openProcedureModal(proc)" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ml-auto">
                        <i class="fas fa-eye text-[10px]"></i> View Specs
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p class="text-xs font-medium text-slate-500">
              Displaying catalog procedures {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredProcedures.length) }} of {{ filteredProcedures.length }}.
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

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showModal && activeProcedure" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" @click.self="closeProcedureModal">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col transform transition-transform scale-100 max-h-[90vh]">
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
            <div>
              <span class="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md text-indigo-200 font-semibold">
                {{ activeProcedure.category || 'General Evaluation' }}
              </span>
              <h3 class="font-extrabold text-lg tracking-tight mt-1 truncate max-w-[450px]" :title="activeProcedure.procedureName">
                {{ activeProcedure.procedureName }}
              </h3>
            </div>
            <button @click="closeProcedureModal" class="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white outline-none">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-700">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Cost Calculations Matrix</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                  <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Minimum Resource Floor</p>
                  <p class="text-xl font-black text-emerald-950 mt-1">KES {{ formatPrice(activeProcedure.minPrice) }}</p>
                </div>
                <div class="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                  <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Maximum Structural Cap</p>
                  <p class="text-xl font-black text-indigo-950 mt-1">KES {{ formatPrice(activeProcedure.maxPrice) }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fas fa-file-alt text-slate-400"></i> Clinical Treatment Specification Guidelines
              </p>
              <div class="bg-slate-50 border border-slate-200 p-5 rounded-2xl font-normal text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[250px] overflow-y-auto">
                {{ activeProcedure.description || 'No baseline analytical description records have been deployed to configure this catalog payload property.' }}
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
            <button @click="closeProcedureModal" class="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition shadow-sm">
              Acknowledge and Return
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

const { procedures, loading } = useWixData()

const search = ref('')
const categoryFilter = ref('')
const sortBy = ref('name-az')
const currentPage = ref(1)
const pageSize = 10

const showModal = ref(false)
const activeProcedure = ref(null)

const uniqueCategories = computed(() => {
  const collection = procedures.value || []
  return [...new Set(collection.map(p => p?.category).filter(Boolean))].sort()
})

const filteredProcedures = computed(() => {
  const baseList = procedures.value || []
  let list = [...baseList]
  if (search.value) {
    const s = search.value.toLowerCase().trim()
    list = list.filter(p => {
      if (!p) return false
      const name = String(p.procedureName || '').toLowerCase()
      const cat = String(p.category || '').toLowerCase()
      const desc = String(p.description || '').toLowerCase()
      return name.includes(s) || cat.includes(s) || desc.includes(s)
    })
  }
  if (categoryFilter.value) {
    list = list.filter(p => p?.category === categoryFilter.value)
  }
  if (sortBy.value === 'name-az') {
    list.sort((a, b) => String(a?.procedureName || '').localeCompare(String(b?.procedureName || '')))
  } else if (sortBy.value === 'name-za') {
    list.sort((a, b) => String(b?.procedureName || '').localeCompare(String(a?.procedureName || '')))
  } else if (sortBy.value === 'price-low') {
    list.sort((a, b) => Number(a?.minPrice || 0) - Number(b?.minPrice || 0))
  } else if (sortBy.value === 'price-high') {
    list.sort((a, b) => Number(b?.maxPrice || 0) - Number(a?.maxPrice || 0))
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredProcedures.value.length / pageSize) || 1)

const paginatedProcedures = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProcedures.value.slice(start, start + pageSize)
})

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = 1
})

const handlePageChange = (page) => { currentPage.value = page }

const clearFilters = () => {
  search.value = ''
  categoryFilter.value = ''
  sortBy.value = 'name-az'
  currentPage.value = 1
}

const openProcedureModal = (proc) => {
  activeProcedure.value = proc
  showModal.value = true
}

const closeProcedureModal = () => {
  showModal.value = false
  activeProcedure.value = null
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-KE').format(Math.round(price || 0))
}

const categoryBadgeClass = (category) => {
  const norm = String(category || '').toLowerCase()
  if (norm.includes('non') || norm.includes('inject') || norm.includes('skin')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (norm.includes('surg') || norm.includes('body') || norm.includes('breast')) {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
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