<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      <p class="text-sm font-medium text-slate-500 mt-4">Loading Google Analytics data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
      <p class="text-red-700 font-semibold">Failed to load site data</p>
      <p class="text-xs text-red-500 mt-1">{{ error }}</p>
      <button @click="refresh" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">
        Retry
      </button>
    </div>

    <!-- Site Report Content -->
    <template v-else-if="gaData">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
              <i class="fas fa-chart-bar text-indigo-500"></i> Site Analytics Report
            </h3>
            <p class="text-xs text-slate-500 mt-1">Data period: last 30 days</p>
          </div>
          <div class="flex gap-2 mt-3 sm:mt-0">
            <button @click="downloadExcel" class="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
              <i class="fas fa-file-excel mr-1"></i> Excel
            </button>
            <button @click="downloadPDF" class="bg-rose-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 transition">
              <i class="fas fa-file-pdf mr-1"></i> PDF
            </button>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          <div class="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <p class="text-xs font-medium text-indigo-600 uppercase tracking-wider">Total Users</p>
            <p class="text-2xl font-bold text-indigo-900">{{ formatNumber(summary.totalUsers) }}</p>
          </div>
          <div class="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <p class="text-xs font-medium text-emerald-600 uppercase tracking-wider">New Users</p>
            <p class="text-2xl font-bold text-emerald-900">{{ formatNumber(summary.newUsers) }}</p>
          </div>
          <div class="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <p class="text-xs font-medium text-amber-600 uppercase tracking-wider">Sessions</p>
            <p class="text-2xl font-bold text-amber-900">{{ formatNumber(summary.sessions) }}</p>
          </div>
          <div class="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
            <p class="text-xs font-medium text-rose-600 uppercase tracking-wider">Page Views</p>
            <p class="text-2xl font-bold text-rose-900">{{ formatNumber(summary.screenPageViews) }}</p>
          </div>
        </div>

        <!-- Traffic sources and devices tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
          <div>
            <h4 class="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wider text-slate-400">Traffic Sources</h4>
            <div class="bg-white rounded-xl border border-slate-200 p-3">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-slate-500">
                  <tr><th class="px-3 py-2 text-left">Source</th><th class="px-3 py-2 text-right">Sessions</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="src in trafficSources" :key="src.source">
                    <td class="px-3 py-2">{{ src.source }}</td>
                    <td class="px-3 py-2 text-right">{{ src.sessions }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wider text-slate-400">Device Breakdown</h4>
            <div class="bg-white rounded-xl border border-slate-200 p-3">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-slate-500">
                  <tr><th class="px-3 py-2 text-left">Device</th><th class="px-3 py-2 text-right">Sessions</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="dev in deviceCategories" :key="dev.device">
                    <td class="px-3 py-2 capitalize">{{ dev.device }}</td>
                    <td class="px-3 py-2 text-right">{{ dev.sessions }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border-t border-purple-200 p-5 md:p-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="h-8 w-8 bg-purple-600 text-white rounded-lg flex items-center justify-center">
              <i class="fas fa-brain"></i>
            </span>
            <h4 class="font-extrabold text-slate-900">AI Site Insights</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(ins, idx) in aiInsights" :key="idx" class="bg-white/70 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
              <span :class="['h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0', ins.iconBg]">
                <i :class="ins.icon"></i>
              </span>
              <div>
                <p class="font-bold text-slate-800 text-sm">{{ ins.title }}</p>
                <p class="text-xs text-slate-600 mt-1">{{ ins.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const { gaData, loading, error, refresh } = useGoogleAnalytics()

const summary = computed(() => gaData.value?.summary || {})
const timeSeries = computed(() => gaData.value?.timeSeries || [])
const topCountries = computed(() => gaData.value?.topCountries || [])
const topPages = computed(() => gaData.value?.topPages || [])
const trafficSources = computed(() => gaData.value?.trafficSources || [])
const deviceCategories = computed(() => gaData.value?.deviceCategories || [])

const aiInsights = computed(() => {
  if (!gaData.value) return []
  const s = summary.value
  const topCountry = topCountries.value[0]?.country || 'Kenya'
  const topPage = topPages.value[0]?.pagePath || 'Home'
  const topSource = trafficSources.value[0]?.source || 'Direct'
  const mobileSessions = Number(deviceCategories.value.find(d => d.device === 'mobile')?.sessions || 0)
  const totalSessions = Number(s.sessions) || 1
  const mobilePercent = Math.round((mobileSessions / totalSessions) * 100)
  const bounce = Number(s.bounceRate) || 0

  return [
    {
      title: 'Geographic Focus',
      message: `The majority of your traffic comes from ${topCountry}. Consider localized content and targeted ads for this region.`,
      icon: 'fas fa-globe-africa',
      iconBg: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Top Performing Page',
      message: `"${topPage}" is your most visited page. Ensure it has clear CTAs and fast loading times to convert visitors.`,
      icon: 'fas fa-file-alt',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Traffic Acquisition',
      message: `Most sessions originate from ${topSource}. Invest more in this channel or diversify to reduce dependency.`,
      icon: 'fas fa-chart-line',
      iconBg: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Mobile Experience',
      message: `${mobilePercent}% of sessions come from mobile devices. Optimize mobile UX to reduce bounce and improve engagement.`,
      icon: 'fas fa-mobile-alt',
      iconBg: 'bg-rose-50 text-rose-600'
    },
    {
      title: 'Engagement Health',
      message: `Bounce rate is ${bounce}%. ${bounce > 50 ? 'Consider improving content relevance or page speed.' : 'You are doing well, keep monitoring.'}`,
      icon: 'fas fa-heartbeat',
      iconBg: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Content Strategy',
      message: `Your average session duration is ${formatDuration(s.averageSessionDuration)}. Longer sessions indicate strong content engagement.`,
      icon: 'fas fa-clock',
      iconBg: 'bg-blue-50 text-blue-600'
    }
  ]
})

function formatNumber(value) {
  if (!value) return '0'
  return Number(value).toLocaleString('en-KE')
}

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const sec = Number(seconds)
  const mins = Math.floor(sec / 60)
  const remainingSec = Math.round(sec % 60)
  return `${mins}m ${remainingSec}s`
}

async function downloadExcel() {
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Total Users', summary.value.totalUsers],
    ['New Users', summary.value.newUsers],
    ['Sessions', summary.value.sessions],
    ['Page Views', summary.value.screenPageViews],
    ['Avg Session Duration', summary.value.averageSessionDuration],
    ['Bounce Rate', summary.value.bounceRate + '%'],
    ['Engagement Rate', summary.value.engagementRate + '%']
  ])

  const timeSheet = XLSX.utils.json_to_sheet(timeSeries.value.map(d => ({
    Date: d.date,
    ActiveUsers: d.activeUsers,
    NewUsers: d.newUsers,
    Sessions: d.sessions,
    PageViews: d.pageviews
  })))

  const countriesSheet = XLSX.utils.json_to_sheet(topCountries.value.map(c => ({
    Country: c.country,
    Sessions: c.sessions
  })))

  const pagesSheet = XLSX.utils.json_to_sheet(topPages.value.map(p => ({
    Page: p.pagePath,
    PageViews: p.pageviews
  })))

  const trafficSheet = XLSX.utils.json_to_sheet(trafficSources.value.map(t => ({
    Source: t.source,
    Sessions: t.sessions
  })))

  const deviceSheet = XLSX.utils.json_to_sheet(deviceCategories.value.map(d => ({
    Device: d.device,
    Sessions: d.sessions
  })))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
  XLSX.utils.book_append_sheet(wb, timeSheet, 'Time Series')
  XLSX.utils.book_append_sheet(wb, countriesSheet, 'Countries')
  XLSX.utils.book_append_sheet(wb, pagesSheet, 'Top Pages')
  XLSX.utils.book_append_sheet(wb, trafficSheet, 'Traffic Sources')
  XLSX.utils.book_append_sheet(wb, deviceSheet, 'Devices')
  XLSX.writeFile(wb, `Site_Analytics_${new Date().toISOString().slice(0,10)}.xlsx`)
}

async function downloadPDF() {
  const doc = new jsPDF('p', 'mm', 'a4')
  const now = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
  const primary = [30, 41, 59]
  const accent = [79, 70, 229]
  let y = 20

  // Header
  doc.setFillColor(...primary)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('DR. JP OGALO CLINIC', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Google Analytics Site Report', 14, 19)
  doc.text(`Generated: ${now}`, 14, 26)
  y = 40

  // Summary
  doc.setTextColor(...primary)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Metrics', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const metrics = [
    ['Total Users', formatNumber(summary.value.totalUsers)],
    ['New Users', formatNumber(summary.value.newUsers)],
    ['Sessions', formatNumber(summary.value.sessions)],
    ['Page Views', formatNumber(summary.value.screenPageViews)],
    ['Avg Session Duration', formatDuration(summary.value.averageSessionDuration)],
    ['Bounce Rate', summary.value.bounceRate + '%'],
    ['Engagement Rate', summary.value.engagementRate + '%']
  ]
  metrics.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y)
    y += 5
  })

  // AI Insights
  y += 5
  doc.setFillColor(...accent)
  doc.rect(14, y - 4, 182, 0.8, 'F')
  y += 6
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('AI Insights', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  aiInsights.value.forEach(ins => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(`${ins.title}`, 14, y)
    y += 4
    doc.text(`  ${ins.message}`, 14, y)
    y += 6
  })

  // Traffic sources table
  y += 4
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Traffic Sources', 14, y)
  y += 6
  autoTable(doc, {
    startY: y,
    head: [['Source', 'Sessions']],
    body: trafficSources.value.map(t => [t.source, t.sessions]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  })
  y = doc.lastAutoTable.finalY + 8

  // Device table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Categories', 14, y)
  y += 6
  autoTable(doc, {
    startY: y,
    head: [['Device', 'Sessions']],
    body: deviceCategories.value.map(d => [d.device, d.sessions]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  })
  y = doc.lastAutoTable.finalY + 8

  // Top pages table
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Top Pages', 14, y)
  y += 6
  autoTable(doc, {
    startY: y,
    head: [['Page', 'Page Views']],
    body: topPages.value.map(p => [p.pagePath, p.pageviews]),
    theme: 'striped',
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  })

  doc.save(`Site_Analytics_${new Date().toISOString().slice(0,10)}.pdf`)
}
</script>