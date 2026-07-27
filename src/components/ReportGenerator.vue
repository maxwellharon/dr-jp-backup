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
import jsPDF from 'jspdf'
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

// Excel export (unchanged)
const downloadExcel = () => {
  const wsData = filteredData.value.map(item => ({
    Name: item.name,
    Email: item.email,
    Phone: item.phone,
    Age: item.age,
    Country: item.country,
    Procedure: item.procedure,
    'Non‑Surgical': item.isNonSurgical ? 'Yes' : 'Surgical',
    'Price (KES)': item.price,
    BMI: item.bmi,
    Weight: item.weight,
    Height: item.height,
    'Past Surgeries': item.pastSurgeries,
    'Submission Date': item.createdDate ? new Date(item.createdDate).toLocaleDateString() : ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(wsData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, `Patient_Report_${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ------------------------------------------------------------
//  BEAUTIFUL PDF REPORT – comprehensive, styled, professional
// ------------------------------------------------------------
const downloadPDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const now = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
  const data = filteredData.value

  // ==========  COLOR PALETTE  ==========
  const primary = [30, 41, 59]    // slate-900
  const accent = [79, 70, 229]    // indigo-600
  const lightBg = [245, 247, 250] // slate-50

  // ==========  HEADER  ==========
  doc.setFillColor(...primary)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('DR. JP OGALO CLINIC', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Patient Data Report', 14, 19)
  doc.text(`Generated: ${now}`, 14, 26)

  // ==========  FILTER CRITERIA  ==========
  let y = 38
  doc.setTextColor(...primary)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Applied Filters', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
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

  if (filterLines.length === 0) filterLines.push('No filters applied – showing all records')

  filterLines.forEach(line => {
    doc.text(`• ${line}`, 14, y)
    y += 4.5
  })

  // ==========  SUMMARY STATISTICS  ==========
  const total = data.length
  const ages = data.map(p => Number(p.age)).filter(a => a > 0 && a < 120)
  const avgAge = ages.length ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : 0
  const nonSurgCount = data.filter(p => p.isNonSurgical).length
  const nonSurgPct = total ? Math.round((nonSurgCount / total) * 100) : 0
  const totalValue = data.reduce((s, p) => s + Number(p.price || 0), 0)
  const avgBmi = data.map(p => Number(p.bmi)).filter(b => b > 10 && b < 90)
  const avgBmiVal = avgBmi.length ? (avgBmi.reduce((s, v) => s + v, 0) / avgBmi.length).toFixed(1) : '0.0'
  const highBmiCount = data.filter(p => Number(p.bmi) >= 30).length
  const pastSurgCount = data.filter(p => {
    const val = String(p.pastSurgeries || '').toLowerCase()
    return val.includes('yes') || (val.length > 0 && !val.includes('no'))
  }).length

  // Top 5 procedures
  const procMap = new Map()
  data.forEach(p => procMap.set(p.procedure, (procMap.get(p.procedure) || 0) + 1))
  const topProcs = [...procMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Country distribution
  const countryMap = new Map()
  data.forEach(p => countryMap.set(p.country, (countryMap.get(p.country) || 0) + 1))
  const topCountries = [...countryMap.entries()].sort((a, b) => b[1] - a[1])

  y += 8
  doc.setFillColor(...accent)
  doc.rect(14, y - 5, 182, 0.8, 'F')
  y += 4
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', 14, y)
  y += 7

  // KPI Cards (simulated as stacked info)
  doc.setFontSize(10)
  const addSummaryRow = (label, value, unit = '') => {
    doc.setFont('helvetica', 'bold')
    doc.text(label + ':', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(` ${value} ${unit}`, 50, y)
    y += 6
  }

  addSummaryRow('Total Patients', total)
  addSummaryRow('Average Age', avgAge, 'years')
  addSummaryRow('Non‑Surgical %', nonSurgPct + '%')
  addSummaryRow('Average BMI', avgBmiVal)
  addSummaryRow('Total Quoted Value', 'KES ' + formatPrice(totalValue))
  addSummaryRow('BMI ≥ 30 (High Risk)', highBmiCount, 'patients')
  addSummaryRow('Prior Surgeries', pastSurgCount, 'patients')

  // Top procedures
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Top 5 Requested Procedures', 14, y)
  y += 6
  topProcs.forEach(([name, count], idx) => {
    doc.setFont('helvetica', 'normal')
    doc.text(`${idx + 1}. ${name} – ${count} leads`, 18, y)
    y += 5
  })

  // Country distribution
  if (topCountries.length) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Geographic Distribution', 14, y)
    y += 6
    topCountries.forEach(([country, cnt]) => {
      doc.setFont('helvetica', 'normal')
      doc.text(`• ${country}: ${cnt} (${Math.round(cnt / total * 100)}%)`, 18, y)
      y += 5
    })
  }

  // ==========  DETAIL TABLE  ==========
  y += 8
  doc.setFillColor(...accent)
  doc.rect(14, y - 5, 182, 0.8, 'F')
  y += 4
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Patient Records', 14, y)
  y += 7

  const tableColumns = ['Name', 'Age', 'Country', 'Procedure', 'Price (KES)', 'BMI']
  const tableRows = data.map(p => [
    p.name,
    p.age,
    p.country,
    p.procedure,
    formatPrice(p.price),
    p.bmi || '—'
  ])

  autoTable(doc, {
    startY: y,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: lightBg
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Report generated ${now}`, 14, 285)
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, 196, 285, { align: 'right' })
    }
  })

  doc.save(`Patient_Report_${new Date().toISOString().slice(0,10)}.pdf`)
}
</script>