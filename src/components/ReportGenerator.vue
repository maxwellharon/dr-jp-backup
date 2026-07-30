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
          <label class="block text-xs font-semibold text-slate-500 mb-1">BMI &gt;= 30 (High Risk)</label>
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
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const { generateReportData, generateInsights, getUniqueProcedures, getUniqueCountries } = useReportGeneration()

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

// ------------------------- Excel export -------------------------
const downloadExcel = () => {
  const data = filteredData.value
  const insights = generateInsights(data)

  // Main data sheet
  const wsData = data.map(item => ({
    Name: item.name,
    Email: item.email,
    Phone: item.phone,
    Age: item.age,
    Country: item.country,
    Procedure: item.procedure,
    'Non-Surgical': item.isNonSurgical ? 'Yes' : 'Surgical',
    'Price (KES)': item.price,
    BMI: item.bmi,
    Weight: item.weight,
    Height: item.height,
    'Past Surgeries': item.pastSurgeries,
    'Submission Date': item.createdDate ? new Date(item.createdDate).toLocaleDateString() : ''
  }))
  const mainSheet = XLSX.utils.json_to_sheet(wsData)

  // Summary sheet
  let summaryRows = [['AI-Generated Insights', '']]
  if (insights) {
    summaryRows.push(['Total Patients', insights.total])
    summaryRows.push(['Average Age', insights.avgAge + ' years'])
    summaryRows.push(['Non-Surgical %', insights.nonSurgPercent + '%'])
    summaryRows.push(['Average BMI', insights.avgBmi])
    summaryRows.push(['Total Quoted Value (KES)', formatPrice(insights.totalValue)])
    summaryRows.push(['Average Quote Value (KES)', formatPrice(insights.avgValue)])
    summaryRows.push(['BMI >= 30 (High Risk)', insights.highBmiCount + ' patients'])
    summaryRows.push(['Prior Surgeries', insights.pastSurgCount + ' patients'])
    summaryRows.push(['Most Requested Procedure', insights.mostRequested])
    summaryRows.push([])
    summaryRows.push(['Top 5 Procedures', 'Count'])
    insights.topProcedures.forEach(([name, count]) => summaryRows.push([name, count]))
    summaryRows.push([])
    summaryRows.push(['Country', 'Count', 'Percent'])
    insights.countryDistribution.forEach(([country, cnt]) => {
      const pct = Math.round(cnt / insights.total * 100)
      summaryRows.push([country, cnt, pct + '%'])
    })
    summaryRows.push([])
    summaryRows.push(['Monthly Registrations', 'Count'])
    insights.monthlyTrend.forEach(([month, cnt]) => summaryRows.push([month, cnt]))
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Patient Data')
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'AI Insights')
  XLSX.writeFile(workbook, `Patient_Report_${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ------------------------- PDF export (with charts + summary + insights) -------------------------
const downloadPDF = async () => {
  const data = filteredData.value
  const insights = generateInsights(data)

  // Compute chart data
  const procedureCounts = {}
  data.forEach(p => {
    const proc = p.procedure || 'Unknown'
    procedureCounts[proc] = (procedureCounts[proc] || 0) + 1
  })
  const procLabels = Object.keys(procedureCounts).sort((a,b) => procedureCounts[b] - procedureCounts[a])
  const procValues = procLabels.map(l => procedureCounts[l])

  const countryCounts = {}
  data.forEach(p => {
    const c = p.country || 'Unknown'
    countryCounts[c] = (countryCounts[c] || 0) + 1
  })
  const countryLabels = Object.keys(countryCounts).sort((a,b) => countryCounts[b] - countryCounts[a])
  const countryValues = countryLabels.map(l => countryCounts[l])

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

  const regMonths = {}
  data.forEach(p => {
    if (p.createdDate) {
      const d = new Date(p.createdDate)
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
        regMonths[key] = (regMonths[key] || 0) + 1
      }
    }
  })
  const monthLabels = Object.keys(regMonths).sort()
  const monthValues = monthLabels.map(m => regMonths[m])

  const chartColors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16','#14b8a6','#f97316']

  // Helper to create a chart image
  const chartToImage = (config, width = 600, height = 300) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const chart = new Chart(ctx, config)
      setTimeout(() => {
        const url = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(url)
      }, 300)
    })
  }

  const procChartConfig = {
    type: 'bar',
    data: {
      labels: procLabels,
      datasets: [{ label: 'Requests', data: procValues, backgroundColor: '#818cf8', borderRadius: 8 }]
    },
    options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  }

  const countryChartConfig = {
    type: 'pie',
    data: {
      labels: countryLabels,
      datasets: [{ data: countryValues, backgroundColor: chartColors.slice(0, countryLabels.length), borderWidth: 0 }]
    },
    options: { responsive: false, plugins: { legend: { position: 'bottom' } } }
  }

  const ageChartConfig = {
    type: 'bar',
    data: {
      labels: ageLabels,
      datasets: [{ label: 'Patients', data: ageValues, backgroundColor: '#6366f1', borderRadius: 8 }]
    },
    options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  }

  const regChartConfig = {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{ label: 'New Patients', data: monthValues, fill: false, borderColor: '#10b981', tension: 0.1, pointBackgroundColor: '#10b981' }]
    },
    options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  }

  const [procImg, countryImg, ageImg, regImg] = await Promise.all([
    chartToImage(procChartConfig, 600, 300),
    chartToImage(countryChartConfig, 400, 280),
    chartToImage(ageChartConfig, 600, 250),
    chartToImage(regChartConfig, 600, 250)
  ])

  // Build PDF
  const doc = new jsPDF('p', 'mm', 'a4')
  const now = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
  const primary = [30, 41, 59]
  const accent = [79, 70, 229]
  const lightBg = [245, 247, 250]
  let y = 0

  // --- HEADER ---
  doc.setFillColor(...primary)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('DR. JP OGALO CLINIC', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Patient Data Report with AI Insights', 14, 19)
  doc.text(`Generated: ${now}`, 14, 26)
  y = 38

  // --- FILTER CRITERIA ---
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
  if (filters.nonSurgical === 'yes') filterLines.push('Non-Surgical only')
  if (filters.nonSurgical === 'no') filterLines.push('Surgical only')
  if (filters.bmiHighRisk) filterLines.push('BMI >= 30 (High Risk)')
  if (filterLines.length === 0) filterLines.push('No filters applied - showing all records')
  filterLines.forEach(line => {
    doc.text(`- ${line}`, 14, y)
    y += 4.5
  })

  // --- AI CLINICAL ANALYTICS (narrative cards) ---
  y += 6
  if (insights) {
    doc.setFillColor(...accent)
    doc.rect(14, y - 5, 182, 0.8, 'F')
    y += 4
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('AI Clinical Analytics & Strategy', 14, y)
    y += 8

    const insightCards = [
      {
        title: 'Procedure Demand Surge',
        message: `${insights.mostRequested} leads your database, accounting for ${Math.round((insights.topProcedures[0]?.[1] || 0) / insights.total * 100)}% of total inquiries. Ensure resource and inventory optimization for this segment.`
      },
      {
        title: 'Targeted Age Demographic',
        message: `The current dataset yields an average age of ${insights.avgAge} years. The 26–35 distribution bracket demonstrates the sharpest customer lifecycle conversion velocity.`
      },
      {
        title: 'Care Classification Footprint',
        message: `${insights.nonSurgPercent}% of inbound leads requested non-surgical alternatives. Adding tiered skin-tightening or injectables packaging could capture unrealized revenue.`
      },
      {
        title: 'Geographic Footprint Opportunity',
        message: `The high concentration of submissions originates from ${insights.countryDistribution[0]?.[0] || 'Kenya'}. Localized hyper-targeted clinical marketing and localized SEO focus will optimize conversion cost.`
      },
      {
        title: 'Asset Conversion Strategy',
        message: `Average transaction pricing maps at KES ${formatPrice(insights.avgValue)}. Integrating flexible multi-installment healthcare financing structures could reduce drop-off.`
      },
      {
        title: 'Patient Risk Profiling Matrix',
        message: `${insights.highBmiCount} prospective clients present a calculated BMI >= 30.0, and ${insights.pastSurgCount} note surgical backgrounds. Automated pre-anesthetic tracking flags are recommended.`
      }
    ]

    insightCards.forEach(card => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, y, 182, 22, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...primary)
      doc.text(card.title, 18, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(card.message, 18, y + 12, { maxWidth: 174 })
      y += 24
    })

    // --- DETAILED AI INSIGHTS SUMMARY (the block user wants) ---
    y += 6
    doc.setFillColor(...accent)
    doc.rect(14, y - 5, 182, 0.8, 'F')
    y += 4
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primary)
    doc.text('AI-Generated Insights Summary', 14, y)
    y += 8

    const summaryData = [
      ['Total Patients:', String(insights.total)],
      ['Average Age:', `${insights.avgAge} years`],
      ['Non-Surgical %:', `${insights.nonSurgPercent}%`],
      ['Average BMI:', insights.avgBmi],
      ['Total Quoted Value:', `KES ${formatPrice(insights.totalValue)}`],
      ['Average Quote Value:', `KES ${formatPrice(insights.avgValue)}`],
      ['BMI >= 30 (High Risk):', `${insights.highBmiCount} patients`],
      ['Prior Surgeries:', `${insights.pastSurgCount} patients`],
      ['Most Requested Procedure:', insights.mostRequested]
    ]

    doc.setFontSize(10)
    summaryData.forEach(([label, value]) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.text(label, 18, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 70, y)
      y += 6
    })

    // Top 5 Procedures
    y += 2
    doc.setFont('helvetica', 'bold')
    doc.text('Top 5 Requested Procedures:', 18, y)
    y += 6
    insights.topProcedures.forEach(([name, count], idx) => {
      doc.setFont('helvetica', 'normal')
      doc.text(`${idx + 1}. ${name} - ${count} leads`, 22, y)
      y += 5
    })

    // Geographic Distribution
    y += 2
    doc.setFont('helvetica', 'bold')
    doc.text('Geographic Distribution:', 18, y)
    y += 6
    insights.countryDistribution.forEach(([country, cnt]) => {
      const pct = Math.round(cnt / insights.total * 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`- ${country}: ${cnt} (${pct}%)`, 22, y)
      y += 5
    })

    // Monthly Registration Trend
    if (insights.monthlyTrend.length) {
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.text('Monthly Registration Trend:', 18, y)
      y += 6
      insights.monthlyTrend.forEach(([month, cnt]) => {
        doc.setFont('helvetica', 'normal')
        doc.text(`${month}: ${cnt}`, 22, y)
        y += 5
      })
    }

    // --- CHARTS ---
    y += 8
    doc.setFillColor(...accent)
    doc.rect(14, y - 5, 182, 0.8, 'F')
    y += 4
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Visual Data Insights', 14, y)
    y += 10

    const chartWidth = 88
    doc.addImage(procImg, 'PNG', 14, y, chartWidth, 50)
    doc.addImage(countryImg, 'PNG', 14 + chartWidth + 6, y, chartWidth, 50)
    y += 55
    doc.addImage(ageImg, 'PNG', 14, y, chartWidth, 45)
    doc.addImage(regImg, 'PNG', 14 + chartWidth + 6, y, chartWidth, 45)
    y += 55
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('Insufficient data to generate AI insights.', 14, y)
    y += 10
  }

  // --- DETAILED PATIENT RECORDS (new page) ---
  doc.addPage()
  y = 20
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primary)
  doc.text('Detailed Patient Records', 14, y)
  y += 8

  const tableColumns = ['Name', 'Age', 'Country', 'Procedure', 'Price (KES)', 'BMI']
  const tableRows = data.map(p => [
    p.name,
    p.age,
    p.country,
    p.procedure,
    formatPrice(p.price),
    (Number(p.bmi) > 0 && Number(p.bmi) < 100) ? p.bmi : '—'
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
    didDrawPage: () => {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Report generated ${now}`, 14, 285)
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, 196, 285, { align: 'right' })
    }
  })

  doc.save(`Patient_Report_${new Date().toISOString().slice(0,10)}.pdf`)
}
</script>