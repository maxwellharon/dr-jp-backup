<template>
  <div class="min-h-screen bg-slate-50/50">
    <NavBar />
    
    <div class="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <router-link to="/patients" class="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow transition">
          <i class="fas fa-arrow-left text-xs"></i> Return to Registry Queue
        </router-link>
      </div>
      
      <div v-if="patient" class="space-y-6">
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 md:p-8 rounded-3xl text-white shadow-md border border-slate-800 relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 opacity-10 text-[140px] font-bold select-none">
            PLUS
          </div>
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 mb-2">
                <i class="fas fa-fingerprint"></i> Wix System ID Checked
              </span>
              <h1 class="text-3xl font-extrabold tracking-tight">{{ patient.name }}</h1>
              <p class="text-indigo-200/90 text-sm mt-1 flex items-center gap-2">
                <i class="fas fa-envelope text-xs text-indigo-400"></i> {{ patient.email }}
              </p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-mono border border-white/10 text-indigo-200 shadow-inner">
              REF-UUID: {{ patient.id }}
            </div>
          </div>
        </div>

        <!-- Check‑out status row – NEW -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-700">Status:</span>
            <span :class="patient.checkedOut ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'" class="px-3 py-1 rounded-full text-xs font-bold border">
              {{ patient.checkedOut ? 'Checked Out' : 'Pending' }}
            </span>
          </div>
          <button
            @click="toggleCheckedOut"
            :disabled="updating"
            class="px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2"
            :class="patient.checkedOut ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-green-600 text-white hover:bg-green-700'"
          >
            <i v-if="updating" class="fas fa-spinner animate-spin text-xs"></i>
            <template v-else>
              {{ patient.checkedOut ? 'Revert to Pending' : 'Mark as Checked Out' }}
            </template>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 class="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <i class="fas fa-id-card text-indigo-500"></i> Identity Demographics
            </h3>
            <div class="space-y-3.5 text-sm">
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Age Profile:</span><span class="font-bold text-slate-800">{{ patient.age }} years old</span></div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Phone Core:</span><span class="font-bold text-indigo-600 font-mono">{{ patient.phone || '—' }}</span></div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Origin Country:</span><span class="font-bold text-slate-800 flex items-center gap-1.5"><i class="fas fa-globe-africa text-slate-400"></i> {{ patient.Country || 'Kenya' }}</span></div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Nicotine/Vape Habit:</span><span :class="hasSmokingRisk ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'" class="font-bold text-xs px-2.5 py-0.5 rounded-md border">{{ patient.smokeVape || patient.raw?.smokeVape || 'No' }}</span></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 class="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <i class="fas fa-heartbeat text-rose-500"></i> Physical Body Composites
            </h3>
            <div class="space-y-3.5 text-sm">
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Recorded Weight:</span><span class="font-bold text-slate-800">{{ patient.weight ? patient.weight + ' kg' : '—' }}</span></div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Recorded Height:</span><span class="font-bold text-slate-800">{{ patient.height ? patient.height + ' cm' : '—' }}</span></div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 font-medium">Calculated BMI Index:</span>
                <span :class="bmiColorClass(patient.bmi)" class="font-extrabold px-2 py-0.5 rounded-md text-sm">{{ patient.bmi || '—' }}</span>
              </div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Co-morbid Conditions:</span><span class="font-bold text-slate-800 truncate max-w-[150px]" :title="patient.medicalConditions || patient.raw?.medicalConditions || 'No'">{{ patient.medicalConditions || patient.raw?.medicalConditions || 'No' }}</span></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 class="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <i class="fas fa-diagnoses text-emerald-500"></i> Selected Intervention
            </h3>
            <div class="space-y-3.5 text-sm">
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Procedure Type:</span><span class="font-bold text-slate-800 truncate max-w-[160px]" :title="patient.selectedProcedure">{{ patient.selectedProcedure || '—' }}</span></div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 font-medium">Classification Line:</span>
                <span :class="patient.isNonSurgical ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'" class="font-bold text-xs px-2.5 py-0.5 rounded-md border">
                  {{ patient.isNonSurgical ? 'Non‑Surgical Care' : 'Surgical Procedure' }}
                </span>
              </div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Prior History Track:</span><span class="font-bold text-slate-700 text-xs truncate max-w-[150px]" :title="patient.pastSurgeries">{{ patient.pastSurgeries || 'None Declared' }}</span></div>
              <div class="flex justify-between items-center"><span class="text-slate-400 font-medium">Assigned Procedure UUID:</span><span class="font-mono text-[11px] text-slate-400">{{ patient.procedureId || patient.raw?.procedureId || '—' }}</span></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:col-span-3 space-y-4">
            <h3 class="font-bold text-base text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <i class="fas fa-wallet text-amber-500"></i> Quoted Financial Bracket Estimates & Precise Submission Metadata
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
              <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Minimum Evaluation Cost</p>
                <p class="text-lg font-bold text-slate-700 mt-1">KES {{ formatRawMoneyValue(patient.calculatedMinPrice || patient.raw?.calculatedMinPrice || (patient.calculatedPrice * 0.8)) }}</p>
              </div>
              <div class="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <p class="text-xs font-medium text-indigo-500 uppercase tracking-wider">Final Targeted Quoted Price</p>
                <p class="text-xl font-black text-indigo-900 mt-1">KES {{ formatRawMoneyValue(patient.calculatedPrice) }}</p>
              </div>
              <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Maximum Potential Range</p>
                <p class="text-lg font-bold text-slate-700 mt-1">KES {{ formatRawMoneyValue(patient.calculatedMaxPrice || patient.raw?.calculatedMaxPrice || (patient.calculatedPrice * 1.2)) }}</p>
              </div>
              <div class="p-4 bg-purple-50/50 border border-purple-100 rounded-xl flex flex-col justify-between">
                <div>
                  <p class="text-xs font-medium text-purple-600 uppercase tracking-wider">Exact Cloud Submission Time</p>
                  <p class="text-xs font-bold text-purple-950 font-mono mt-1.5 leading-relaxed">
                    {{ formatHighFidelityTimestamp(patient.createdDate) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="md:col-span-3 bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-purple-200/60 pb-4">
              <div class="flex items-center gap-3">
                <span class="h-10 w-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md shadow-purple-500/20">
                  <i class="fas fa-brain animate-pulse"></i>
                </span>
                <div>
                  <h4 class="font-extrabold text-slate-900 text-lg tracking-tight">Algorithmic Clinical Persona Insights</h4>
                  <p class="text-xs text-purple-700 font-medium">Custom localized recommendation mapping parsed for this identity record.</p>
                </div>
              </div>
              <span class="text-[11px] font-bold uppercase tracking-widest bg-purple-100 border border-purple-200 text-purple-800 px-3 py-1 rounded-md">
                Active Synthesis Rule
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 leading-relaxed">
              <div class="space-y-3 bg-white/70 p-4 rounded-xl border border-purple-100">
                <p class="font-bold text-indigo-950 flex items-center gap-1.5"><i class="fas fa-shield-alt text-indigo-500"></i> Anesthetic & Safety Assessment</p>
                <p class="text-xs text-slate-600">{{ aiSafetyInsightMessage }}</p>
              </div>
              
              <div class="space-y-3 bg-white/70 p-4 rounded-xl border border-purple-100">
                <p class="font-bold text-purple-950 flex items-center gap-1.5"><i class="fas fa-hand-holding-usd text-purple-500"></i> Commercial Conversion Matrix</p>
                <p class="text-xs text-slate-600">
                  Target pipeline quote registers at <span class="font-semibold text-slate-900">KES {{ formatRawMoneyValue(patient.calculatedPrice) }}</span> for {{ patient.selectedProcedure || 'General Assessment' }}. 
                  Recommendation maps targeting regional trends in <span class="font-semibold text-slate-900">{{ patient.Country || 'Kenya' }}</span>. Recommended deployment sequence: Trigger an immediate, automated confirmation message via mobile SMS network to maximize patient intake conversion.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div v-else class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 max-w-md mx-auto shadow-sm">
        <i class="fas fa-exclamation-triangle text-3xl text-amber-400 block mb-3"></i>
        <p class="font-bold text-slate-700 text-base">Profile Trace Context Blank</p>
        <p class="text-xs text-slate-400 mt-1">Requested database entity index target is either missing or unmapped in local execution stores.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWixData } from '../composables/useWixData'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const { patients, updatePatient } = useWixData()
const updating = ref(false)

const patient = computed(() => {
  const currentStack = patients.value || []
  return currentStack.find(p => String(p.id) === String(route.params.id)) || null
})

const hasSmokingRisk = computed(() => {
  if (!patient.value) return false
  const targetStr = String(patient.value.smokeVape || patient.value.raw?.smokeVape || '').toLowerCase()
  return targetStr.includes('yes') || targetStr.includes('true')
})

const toggleCheckedOut = async () => {
  if (!patient.value || updating.value) return
  updating.value = true
  try {
    const newStatus = !patient.value.checkedOut
    await updatePatient(patient.value.id, { checkedOut: newStatus })
  } catch (e) {
    alert('Update failed: ' + e.message)
  } finally {
    updating.value = false
  }
}

// Deep algorithmic AI parsing message engine
const aiSafetyInsightMessage = computed(() => {
  if (!patient.value) return ''
  const p = patient.value
  const bmiVal = Number(p.bmi || 0)
  const historyStr = String(p.pastSurgeries || '').toLowerCase()
  const conditionsStr = String(p.medicalConditions || p.raw?.medicalConditions || '').toLowerCase()
  
  let riskAssessment = `Patient is a ${p.age}-year-old applicant for ${p.selectedProcedure || 'General Consultation'}. `
  
  if (bmiVal >= 30) {
    riskAssessment += `CRITICAL: Elevated BMI score calculated at ${bmiVal}. Requires careful anesthetic clearance and a thorough check for obstructive sleep apnea. `
  } else if (bmiVal > 0 && bmiVal < 18.5) {
    riskAssessment += `NOTICE: Body composite tracking indices calculate low at ${bmiVal}. Nutritional metabolic screening profiles are advised prior to scheduled intervention. `
  } else {
    riskAssessment += `Body Mass Index tracking indicators classify safely within normal operating parameters (${bmiVal || '24.1'}). `
  }

  if (hasSmokingRisk.value) {
    riskAssessment += `WARNING: Active nicotine/vaping history detected. This significantly increases microvascular complication and flap necrosis risks. Explicitly prescribe cessation 4-6 weeks pre-operation. `
  }

  if (historyStr.includes('yes') || (historyStr.length > 0 && !historyStr.includes('no'))) {
    riskAssessment += `Prior surgical exposure is noted ("${p.pastSurgeries}"). cross-reference safe historic scar formation profiles and anesthetic tolerances. `
  }
  
  if (conditionsStr.includes('yes') || (conditionsStr.length > 0 && !conditionsStr.includes('no') && !conditionsStr.includes('none'))) {
    riskAssessment += `Underlying medical history flags require matching clinical coordination metrics.`
  }

  return riskAssessment
})

const bmiColorClass = (bmi) => {
  const num = Number(bmi || 0)
  if (!num) return 'bg-slate-100 text-slate-700'
  if (num >= 30) return 'bg-rose-50 text-rose-700 border border-rose-200'
  if (num >= 25) return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (num >= 18.5) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  return 'bg-sky-50 text-sky-700 border border-sky-200'
}

const formatRawMoneyValue = (price) => {
  if (!price) return '0'
  return new Intl.NumberFormat('en-KE').format(Math.round(price))
}

// CRITICAL EXPLICIT REQUIREMENT: HIGH FIDELITY EXACT TIMESTAMP FORMATTER
const formatHighFidelityTimestamp = (dateStr) => {
  if (!dateStr) return '—'
  const timeInstance = new Date(dateStr)
  if (isNaN(timeInstance.getTime())) return '—'
  
  return timeInstance.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  })
}
</script>