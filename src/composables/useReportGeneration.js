// src/composables/useReportGeneration.js
import { useWixData } from './useWixData'

export function useReportGeneration() {
  const { patients } = useWixData()

  // Filters & returns patient records
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

  // Generate AI-style insights from any patient array
  const generateInsights = (data) => {
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

    // Country distribution
    const countryMap = new Map()
    data.forEach(p => countryMap.set(p.country, (countryMap.get(p.country) || 0) + 1))
    const topCountries = [...countryMap.entries()].sort((a, b) => b[1] - a[1])

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
      topProcedures: topProcs,
      countryDistribution: topCountries,
      monthlyTrend
    }
  }

  // Get unique values for filters
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

  return { generateReportData, generateInsights, getUniqueProcedures, getUniqueCountries }
}