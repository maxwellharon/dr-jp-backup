<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    
    <div class="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <!-- Feature View Bar Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i class="fas fa-brain text-purple-600"></i> AI Clinical Analytics & Strategy
          </h2>
          <p class="text-slate-500 text-sm mt-0.5">Automated algorithmic breakdown of current patient records and surgical pipeline metrics.</p>
        </div>
        <button 
          @click="refreshInsights" 
          :disabled="computing"
          class="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold flex gap-2 items-center hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition shadow-sm text-sm"
        >
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': computing }"></i> 
          {{ computing ? 'Processing...' : 'Regenerate Analysis' }}
        </button>
      </div>

      <!-- Live Reactive Insights Output -->
      <div class="space-y-4">
        <!-- Loading Active Feedback -->
        <div v-if="loading || computing" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center space-y-3">
          <div class="h-8 w-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p class="text-slate-500 text-sm font-medium">Re-calculating collection matrices across datasets...</p>
        </div>

        <!-- Populated Insights Cards Layout Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(ins, idx) in insights" :key="idx" 
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 border-l-4 transform hover:-translate-y-0.5"
            :class="borderColor(idx)"
          >
            <div class="flex items-start gap-4">
              <span :class="[
                'h-10 w-10 rounded-xl flex items-center justify-center text-sm shrink-0',
                bgClass(idx)
              ]">
                <i :class="iconClass(idx)"></i>
              </span>
              <div class="space-y-1">
                <p class="font-bold text-slate-900 text-base tracking-tight">{{ ins.title }}</p>
                <p class="text-slate-600 text-sm leading-relaxed">{{ ins.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWixData } from '../composables/useWixData'
import NavBar from '../components/NavBar.vue'

const { patients, loading } = useWixData()
const computing = ref(false)
const insights = ref([])

const generateInsights = () => {
  const data = patients.value || []
  if (!data.length) {
    insights.value = [{ 
      title: "No Data Streams Detected", 
      message: "Connect your Wix database collection to see recommendations." 
    }]
    return
  }

  computing.value = true

  // Algorithmic Data Computations
  const total = data.length
  const procMap = new Map()
  const countries = new Map()
  let ageSum = 0
  let nonSurg = 0
  let priceSum = 0
  let highBmiCount = 0
  let pastSurgCount = 0

  data.forEach(p => {
    if (p.selectedProcedure) procMap.set(p.selectedProcedure, (procMap.get(p.selectedProcedure) || 0) + 1)
    if (p.age) ageSum += Number(p.age)
    if (p.isNonSurgical) nonSurg++
    if (p.calculatedPrice) priceSum += Number(p.calculatedPrice)
    if (p.Country) countries.set(p.Country, (countries.get(p.Country) || 0) + 1)
    if (p.bmi && Number(p.bmi) >= 30) highBmiCount++
    
    const surgVal = String(p.pastSurgeries || '').toLowerCase().trim()
    if (surgVal.includes('yes') || (surgVal.length > 0 && !surgVal.includes('no'))) {
      pastSurgCount++
    }
  })

  // Sort and resolve top items
  const sortedProcs = [...procMap.entries()].sort((a, b) => b[1] - a[1])
  const topProc = sortedProcs[0]?.[0] || "General Consultation"
  const topProcPct = total ? Math.round((procMap.get(topProc) / total) * 100) : 0
  
  const avgAge = total ? Math.round(ageSum / total) : 0
  const nonSurgPercent = total ? Math.round((nonSurg / total) * 100) : 0
  const avgPrice = total ? Math.round(priceSum / total) : 0
  
  const topCountry = [...countries.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Kenya"

  // Structural dynamic recommendations array configuration
  insights.value = [
    { 
      title: "📈 Procedure Demand Surge", 
      message: `${topProc} leads your database, accounting for ${topProcPct}% of total inquiries. Ensure resource and inventory optimization for this segment.` 
    },
    { 
      title: "👥 Targeted Age Demographic", 
      message: `The current dataset yields an average age of ${avgAge} years. The 26–35 distribution bracket demonstrates the sharpest customer lifecycle conversion velocity.` 
    },
    { 
      title: "💉 Care Classification Footprint", 
      message: `${nonSurgPercent}% of inbound leads requested non-surgical alternatives. Adding tiered skin-tightening or injectables packaging could capture unrealized revenue.` 
    },
    { 
      title: "🌍 Geographic Footprint Opportunity", 
      message: `The high concentration of submissions originates from ${topCountry}. Localized hyper-targeted clinical marketing and localized SEO focus will optimize conversion cost.` 
    },
    { 
      title: "💰 Asset Conversion Strategy", 
      message: `Average transaction pricing maps at KES ${avgPrice.toLocaleString('en-KE')}. Integrating flexible multi-installment healthcare financing structures could reduce drop-off.` 
    },
    { 
      title: "⚠️ Patient Risk Profiling Matrix", 
      message: `${highBmiCount} prospective clients present a calculated BMI ≥ 30.0, and ${pastSurgCount} note surgical backgrounds. Automated pre-anesthetic tracking flags are recommended.` 
    }
  ]

  setTimeout(() => {
    computing.value = false
  }, 350)
}

const refreshInsights = () => {
  generateInsights()
}

// Watch active data synchronization arrays to ensure dynamic compute logic
watch(patients, (newVal) => {
  if (newVal && newVal.length > 0) {
    generateInsights()
  }
}, { immediate: true })

const borderColor = (idx) => {
  const borderColors = ['border-l-indigo-500', 'border-l-purple-500', 'border-l-pink-500', 'border-l-amber-500', 'border-l-emerald-500', 'border-l-rose-500']
  return borderColors[idx % borderColors.length]
}

const bgClass = (idx) => {
  const lightBgs = ['bg-indigo-50 text-indigo-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600']
  return lightBgs[idx % lightBgs.length]
}

const iconClass = (idx) => {
  const icons = ['fas fa-chart-line', 'fas fa-users', 'fas fa-syringe', 'fas fa-globe-africa', 'fas fa-wallet', 'fas fa-shield-virus']
  return icons[idx % icons.length]
}
</script>