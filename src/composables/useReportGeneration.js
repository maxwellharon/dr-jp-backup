// src/composables/useReportGeneration.js
import { useWixData } from './useWixData'

export function useReportGeneration() {
  const { patients } = useWixData()

  // Apply filters and return mapped records
  const generateReportData = (filters) => {
    let data = patients.value || []

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      data = data.filter(p => p.createdDate && new Date(p.createdDate) >= from)
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      data = data.filter(p => p.createdDate && new Date(p.createdDate) <= to)
    }
    if (filters.ageMin !== '' && filters.ageMin !== null) {
      const min = Number(filters.ageMin)
      data = data.filter(p => Number(p.age) >= min)
    }
    if (filters.ageMax !== '' && filters.ageMax !== null) {
      const max = Number(filters.ageMax)
      data = data.filter(p => Number(p.age) <= max)
    }
    if (filters.procedure) {
      data = data.filter(p => p.selectedProcedure === filters.procedure)
    }
    if (filters.country) {
      data = data.filter(p => p.Country === filters.country)
    }
    if (filters.nonSurgical === 'yes') {
      data = data.filter(p => p.isNonSurgical)
    } else if (filters.nonSurgical === 'no') {
      data = data.filter(p => !p.isNonSurgical)
    }
    if (filters.bmiHighRisk) {
      data = data.filter(p => Number(p.bmi) >= 30)
    }

    return data.map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      email: p.email || '',
      phone: p.phone || '',
      age: p.age || '',
      country: p.Country || '',
      procedure: p.selectedProcedure || '—',
      price: p.calculatedPrice || 0,
      isNonSurgical: p.isNonSurgical,
      bmi: p.bmi || '',
      weight: p.weight || '',
      height: p.height || '',
      pastSurgeries: p.pastSurgeries || '',
      createdDate: p.createdDate || ''
    }))
  }

  // Generate extremely detailed AI insights from a data array
  const generateDetailedInsights = (data) => {
    if (!data.length) return null

    const total = data.length
    const ages = data.map(p => Number(p.age)).filter(a => a > 0 && a < 120)
    const avgAge = ages.length ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : 0

    const nonSurgCount = data.filter(p => p.isNonSurgical).length
    const nonSurgPercent = total ? Math.round((nonSurgCount / total) * 100) : 0

    const totalValue = data.reduce((s, p) => s + Number(p.price || 0), 0)
    const avgValue = total ? Math.round(totalValue / total) : 0

    const bmis = data.map(p => Number(p.bmi)).filter(b => b > 10 && b < 90)
    const avgBmi = bmis.length ? (bmis.reduce((s, v) => s + v, 0) / bmis.length).toFixed(1) : '0.0'
    const highBmiCount = data.filter(p => Number(p.bmi) >= 30 && Number(p.bmi) <= 90).length

    const pastSurgCount = data.filter(p => {
      const val = String(p.pastSurgeries || '').toLowerCase()
      return val.includes('yes') || (val.length > 0 && !val.includes('no'))
    }).length

    // Top 5 procedures
    const procMap = new Map()
    data.forEach(p => procMap.set(p.procedure, (procMap.get(p.procedure) || 0) + 1))
    const topProcs = [...procMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const mostRequested = topProcs[0]?.[0] || 'N/A'
    const mostRequestedCount = topProcs[0]?.[1] || 0

    // Country distribution
    const countryMap = new Map()
    data.forEach(p => countryMap.set(p.country, (countryMap.get(p.country) || 0) + 1))
    const topCountries = [...countryMap.entries()].sort((a, b) => b[1] - a[1])

    // Age distribution (brackets)
    const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 }
    ages.forEach(age => {
      if (age >= 18 && age <= 25) ageGroups['18-25']++
      else if (age >= 26 && age <= 35) ageGroups['26-35']++
      else if (age >= 36 && age <= 50) ageGroups['36-50']++
      else if (age > 50) ageGroups['51+']++
    })

    // Monthly registration trend
    const monthly = new Map()
    data.forEach(p => {
      if (p.createdDate) {
        const d = new Date(p.createdDate)
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthly.set(key, (monthly.get(key) || 0) + 1)
        }
      }
    })
    const monthlyTrend = [...monthly.entries()].sort()

    // Average weight & height
    const weights = data.map(p => Number(p.weight)).filter(w => w > 0 && w < 500)
    const avgWeight = weights.length ? Math.round(weights.reduce((s, v) => s + v, 0) / weights.length) : 0
    const heights = data.map(p => Number(p.height)).filter(h => h > 0 && h < 300)
    const avgHeight = heights.length ? Math.round(heights.reduce((s, v) => s + v, 0) / heights.length) : 0

    return {
      total,
      avgAge,
      nonSurgCount,
      nonSurgPercent,
      totalValue,
      avgValue,
      avgBmi,
      highBmiCount,
      pastSurgCount,
      mostRequested,
      mostRequestedCount,
      topProcedures: topProcs,
      countryDistribution: topCountries,
      ageGroups,
      monthlyTrend,
      avgWeight,
      avgHeight
    }
  }

  const getUniqueProcedures = () => {
    const set = new Set()
      ; (patients.value || []).forEach(p => {
        if (p.selectedProcedure) set.add(p.selectedProcedure)
      })
    return [...set].sort()
  }

  const getUniqueCountries = () => {
    const set = new Set()
      ; (patients.value || []).forEach(p => {
        if (p.Country) set.add(p.Country)
      })
    return [...set].sort()
  }

  return {
    generateReportData,
    generateDetailedInsights,
    getUniqueProcedures,
    getUniqueCountries
  }
}