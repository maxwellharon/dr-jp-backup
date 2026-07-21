<template>
    <div class="space-y-6">
      <!-- Filter Panel -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <i class="fas fa-filter text-indigo-500"></i> Report Filters
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Date From</label>
            <input type="date" v-model="filters.dateFrom" class="w-full border rounded-xl p-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Date To</label>
            <input type="date" v-model="filters.dateTo" class="w-full border rounded-xl p-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Age Min</label>
            <input type="number" v-model="filters.ageMin" placeholder="18" class="w-full border rounded-xl p-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Age Max</label>
            <input type="number" v-model="filters.ageMax" placeholder="65" class="w-full border rounded-xl p-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Procedure</label>
            <select v-model="filters.procedure" class="w-full border rounded-xl p-2 text-sm bg-white">
              <option value="">All</option>
              <option v-for="p in uniqueProcedures" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Country</label>
            <select v-model="filters.country" class="w-full border rounded-xl p-2 text-sm bg-white">
              <option value="">All</option>
              <option v-for="c in uniqueCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Non‑Surgical</label>
            <select v-model="filters.nonSurgical" class="w-full border rounded-xl p-2 text-sm bg-white">
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">Surgical only</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">BMI ≥ 30 (High Risk)</label>
            <select v-model="filters.bmiHighRisk" class="w-full border rounded-xl p-2 text-sm bg-white">
              <option :value="false">No</option>
              <option :value="true">Yes</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <button @click="applyFilters" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
            <i class="fas fa-check mr-1"></i> Apply Filters
          </button>
          <button @click="resetFilters" class="border border-slate-200 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition">
            <i class="fas fa-undo mr-1"></i> Reset
          </button>
        </div>
      </div>
  
      <!-- Preview Table -->
      <div v-if="filteredData.length > 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b border-slate-100">
          <h4 class="font-bold text-slate-800">
            <i class="fas fa-table mr-1 text-indigo-500"></i> Preview ({{ filteredData.length }} records)
          </h4>
          <div class="flex gap-2">
            <button @click="downloadExcel" class="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
              <i class="fas fa-file-excel mr-1"></i> Excel
            </button>
            <button @click="downloadPDF" class="bg-rose-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 transition">
              <i class="fas fa-file-pdf mr-1"></i> PDF
            </button>
          </div>
        </div>
        <div class="overflow-x-auto p-2">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th class="px-3 py-2 text-left">Name</th>
                <th class="px-3 py-2 text-left">Email</th>
                <th class="px-3 py-2 text-left">Age</th>
                <th class="px-3 py-2 text-left">Country</th>
                <th class="px-3 py-2 text-left">Procedure</th>
                <th class="px-3 py-2 text-right">Price (KES)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in filteredData.slice(0, 50)" :key="item.id" class="hover:bg-indigo-50/30">
                <td class="px-3 py-2 font-medium">{{ item.name }}</td>
                <td class="px-3 py-2 text-xs text-slate-500">{{ item.email }}</td>
                <td class="px-3 py-2">{{ item.age }}</td>
                <td class="px-3 py-2">{{ item.country }}</td>
                <td class="px-3 py-2">{{ item.procedure }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ formatPrice(item.price) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="filteredData.length > 50" class="text-xs text-slate-400 mt-2 p-2">Showing first 50 records in preview.</p>
        </div>
      </div>
      <div v-else-if="applied" class="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
        <i class="fas fa-inbox text-3xl block mb-2"></i> No records match the selected filters.
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed } from 'vue'
  import { useReportGeneration } from '../composables/useReportGeneration'
  import * as XLSX from 'xlsx'
  import { jsPDF } from 'jspdf' 
  import autoTable from 'jspdf-autotable'
  
  const { generateReportData, getUniqueProcedures, getUniqueCountries } = useReportGeneration()
  
  const filters = reactive({
    dateFrom: '',
    dateTo: '',
    ageMin: '',
    ageMax: '',
    procedure: '',
    country: '',
    nonSurgical: '',
    bmiHighRisk: false
  })
  
  const applied = ref(false)
  const filteredData = ref([])
  const uniqueProcedures = computed(() => getUniqueProcedures())
  const uniqueCountries = computed(() => getUniqueCountries())
  
  const applyFilters = () => {
    filteredData.value = generateReportData(filters)
    applied.value = true
  }
  
  const resetFilters = () => {
    Object.assign(filters, {
      dateFrom: '',
      dateTo: '',
      ageMin: '',
      ageMax: '',
      procedure: '',
      country: '',
      nonSurgical: '',
      bmiHighRisk: false
    })
    filteredData.value = []
    applied.value = false
  }
  
  const formatPrice = (price) => new Intl.NumberFormat('en-KE').format(Math.round(price || 0))
  
  // Excel download
  const downloadExcel = () => {
    const wsData = filteredData.value.map(item => ({
      Name: item.name,
      Email: item.email,
      Phone: item.phone,
      Age: item.age,
      Country: item.country,
      Procedure: item.procedure,
      'Non-Surgical': item.isNonSurgical ? 'Yes' : 'Surgical',
      'Price (KES)': item.price,
      BMI: item.bmi,
      'Submission Date': item.createdDate ? new Date(item.createdDate).toLocaleDateString() : ''
    }))
  
    const worksheet = XLSX.utils.json_to_sheet(wsData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    XLSX.writeFile(workbook, `Patient_Report_${new Date().toISOString().slice(0,10)}.xlsx`)
  }
  
  // PDF download
  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const now = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
  
    // Header with logo placeholder
    doc.setFillColor(30, 41, 59) // slate-900
    doc.rect(0, 0, 210, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('DR. JP OGALO CLINIC', 14, 10)
    doc.setFontSize(9)
    doc.text('Patient Data Report', 14, 16)
    doc.text(`Generated: ${now}`, 14, 22)
  
    // Subtitle
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text('Filter Criteria', 14, 35)
  
    // Filter summary
    const filterLines = []
    if (filters.dateFrom) filterLines.push(`Date From: ${filters.dateFrom}`)
    if (filters.dateTo) filterLines.push(`Date To: ${filters.dateTo}`)
    if (filters.ageMin) filterLines.push(`Age Min: ${filters.ageMin}`)
    if (filters.ageMax) filterLines.push(`Age Max: ${filters.ageMax}`)
    if (filters.procedure) filterLines.push(`Procedure: ${filters.procedure}`)
    if (filters.country) filterLines.push(`Country: ${filters.country}`)
    if (filters.nonSurgical === 'yes') filterLines.push('Non‑Surgical only')
    if (filters.nonSurgical === 'no') filterLines.push('Surgical only')
    if (filters.bmiHighRisk) filterLines.push('BMI ≥ 30 (High Risk)')
  
    doc.setFontSize(9)
    doc.setTextColor(100)
    filterLines.forEach((line, idx) => {
      doc.text(`• ${line}`, 14, 42 + (idx * 5))
    })
  
    // Summary statistics
    const total = filteredData.value.length
    const avgAge = total ? Math.round(filteredData.value.reduce((s, p) => s + (Number(p.age) || 0), 0) / total) : 0
    const totalValue = filteredData.value.reduce((s, p) => s + Number(p.price || 0), 0)
  
    const summaryY = 42 + filterLines.length * 5 + 5
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(`Total Records: ${total}`, 14, summaryY)
    doc.text(`Average Age: ${avgAge}`, 14, summaryY + 5)
    doc.text(`Total Value: KES ${formatPrice(totalValue)}`, 14, summaryY + 10)
  
    // Table
    const tableColumns = ['Name', 'Age', 'Country', 'Procedure', 'Price (KES)']
    const tableRows = filteredData.value.map(p => [
      p.name,
      p.age,
      p.country,
      p.procedure,
      formatPrice(p.price)
    ])
  
    autoTable(doc, {
      startY: summaryY + 16,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 }
    })
  
    doc.save(`Patient_Report_${new Date().toISOString().slice(0,10)}.pdf`)
  }
  </script>