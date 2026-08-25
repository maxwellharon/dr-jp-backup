// src/composables/useReportGeneration.js
import { useWixData } from './useWixData'

export function useReportGeneration() {
  const { patients } = useWixData()

  // Apply filters and return mapped records
  const generateReportData = (filters = {}) => {
    let data = Array.isArray(patients.value) ? [...patients.value] : []

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      from.setHours(0, 0, 0, 0)

      data = data.filter(p => {
        if (!p.createdDate) return false
        const created = new Date(p.createdDate)
        return !Number.isNaN(created.getTime()) && created >= from
      })
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)

      data = data.filter(p => {
        if (!p.createdDate) return false
        const created = new Date(p.createdDate)
        return !Number.isNaN(created.getTime()) && created <= to
      })
    }

    if (filters.ageMin !== '' && filters.ageMin !== null && filters.ageMin !== undefined) {
      const min = Number(filters.ageMin)

      if (!Number.isNaN(min)) {
        data = data.filter(p => {
          const age = Number(p.age)
          return !Number.isNaN(age) && age >= min
        })
      }
    }

    if (filters.ageMax !== '' && filters.ageMax !== null && filters.ageMax !== undefined) {
      const max = Number(filters.ageMax)

      if (!Number.isNaN(max)) {
        data = data.filter(p => {
          const age = Number(p.age)
          return !Number.isNaN(age) && age <= max
        })
      }
    }

    if (filters.procedure) {
      data = data.filter(
        p => String(p.selectedProcedure || '').trim() === String(filters.procedure).trim()
      )
    }

    if (filters.country) {
      data = data.filter(
        p => String(p.Country || '').trim() === String(filters.country).trim()
      )
    }

    if (filters.nonSurgical === 'yes') {
      data = data.filter(p => p.isNonSurgical === true)
    } else if (filters.nonSurgical === 'no') {
      data = data.filter(p => p.isNonSurgical !== true)
    }

    if (filters.bmiHighRisk) {
      data = data.filter(p => {
        const bmi = Number(p.bmi)
        return !Number.isNaN(bmi) && bmi >= 30
      })
    }

    return data.map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      email: p.email || '',
      phone: p.phone || '',
      age: p.age || '',
      country: p.Country || '',
      procedure: p.selectedProcedure || '—',
      price: Number(p.calculatedPrice) || 0,
      isNonSurgical: p.isNonSurgical === true,
      bmi: p.bmi || '',
      weight: p.weight || '',
      height: p.height || '',
      pastSurgeries: p.pastSurgeries || '',
      createdDate: p.createdDate || ''
    }))
  }

  // Generate detailed AI insights from a data array
  const generateDetailedInsights = (data = []) => {
    if (!Array.isArray(data) || !data.length) return null

    const total = data.length

    const ages = data
      .map(p => Number(p.age))
      .filter(age => Number.isFinite(age) && age > 0 && age < 120)

    const avgAge = ages.length
      ? Number(
        (
          ages.reduce((sum, value) => sum + value, 0) / ages.length
        ).toFixed(1)
      )
      : 0

    const nonSurgCount = data.filter(p => p.isNonSurgical === true).length

    const nonSurgPercent = total
      ? Number(((nonSurgCount / total) * 100).toFixed(1))
      : 0

    const totalValue = data.reduce((sum, p) => {
      const price = Number(p.price)
      return sum + (Number.isFinite(price) ? price : 0)
    }, 0)

    const avgValue = total
      ? Number((totalValue / total).toFixed(1))
      : 0

    const bmis = data
      .map(p => Number(p.bmi))
      .filter(bmi => Number.isFinite(bmi) && bmi > 10 && bmi < 90)

    const avgBmi = bmis.length
      ? Number(
        (
          bmis.reduce((sum, value) => sum + value, 0) / bmis.length
        ).toFixed(1)
      )
      : 0

    const highBmiCount = data.filter(p => {
      const bmi = Number(p.bmi)
      return Number.isFinite(bmi) && bmi >= 30 && bmi <= 90
    }).length

    const pastSurgCount = data.filter(p => {
      const value = String(p.pastSurgeries || '').trim().toLowerCase()

      if (!value) return false
      if (value === 'no') return false
      if (value === 'false') return false
      if (value === 'none') return false
      if (value === 'no previous surgery') return false

      return (
        value.includes('yes') ||
        value.includes('surgery') ||
        value.includes('surgeries') ||
        value.length > 0
      )
    }).length

    // Procedure distribution
    const procMap = new Map()

    data.forEach(p => {
      const procedure = p.procedure || 'Unknown'

      procMap.set(
        procedure,
        (procMap.get(procedure) || 0) + 1
      )
    })

    const allProcedures = [...procMap.entries()]
      .sort((a, b) => b[1] - a[1])

    const topProcs = allProcedures.slice(0, 5)

    const procedureValueBreakdown = [...procMap.keys()]
      .map(procedure => {
        const rows = data.filter(
          p => (p.procedure || 'Unknown') === procedure
        )

        const totalProcedureValue = rows.reduce(
          (sum, p) => {
            const price = Number(p.price)
            return sum + (Number.isFinite(price) ? price : 0)
          },
          0
        )

        return [
          procedure,
          rows.length,
          Number(totalProcedureValue.toFixed(1)),
          rows.length
            ? Number((totalProcedureValue / rows.length).toFixed(1))
            : 0
        ]
      })
      .sort((a, b) => b[2] - a[2])

    const mostRequested = topProcs[0]?.[0] || 'N/A'
    const mostRequestedCount = topProcs[0]?.[1] || 0

    // Country distribution
    const countryMap = new Map()

    data.forEach(p => {
      const country = p.country || 'Unknown'

      countryMap.set(
        country,
        (countryMap.get(country) || 0) + 1
      )
    })

    const topCountries = [...countryMap.entries()]
      .sort((a, b) => b[1] - a[1])

    // Age distribution
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-50': 0,
      '51+': 0
    }

    ages.forEach(age => {
      if (age >= 18 && age <= 25) {
        ageGroups['18-25']++
      } else if (age >= 26 && age <= 35) {
        ageGroups['26-35']++
      } else if (age >= 36 && age <= 50) {
        ageGroups['36-50']++
      } else if (age > 50) {
        ageGroups['51+']++
      }
    })

    const bmiCategories = {
      'Underweight (<18.5)': 0,
      'Normal (18.5-24.9)': 0,
      'Overweight (25-29.9)': 0,
      'Obese (30+)': 0
    }

    bmis.forEach(bmi => {
      if (bmi < 18.5) {
        bmiCategories['Underweight (<18.5)']++
      } else if (bmi < 25) {
        bmiCategories['Normal (18.5-24.9)']++
      } else if (bmi < 30) {
        bmiCategories['Overweight (25-29.9)']++
      } else {
        bmiCategories['Obese (30+)']++
      }
    })

    // Monthly registration trend
    const monthly = new Map()

    data.forEach(p => {
      if (!p.createdDate) return

      const date = new Date(p.createdDate)

      if (Number.isNaN(date.getTime())) return

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`

      monthly.set(
        key,
        (monthly.get(key) || 0) + 1
      )
    })

    const monthlyTrend = [...monthly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))

    // Weight
    const weights = data
      .map(p => Number(p.weight))
      .filter(weight => Number.isFinite(weight) && weight > 0 && weight < 500)

    const avgWeight = weights.length
      ? Number(
        (
          weights.reduce((sum, value) => sum + value, 0) / weights.length
        ).toFixed(1)
      )
      : 0

    // Height
    const heights = data
      .map(p => Number(p.height))
      .filter(height => Number.isFinite(height) && height > 0 && height < 300)

    const avgHeight = heights.length
      ? Number(
        (
          heights.reduce((sum, value) => sum + value, 0) / heights.length
        ).toFixed(1)
      )
      : 0

    // Additional useful intelligence
    const ageGroupEntries = Object.entries(ageGroups)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])

    const dominantAgeGroup = ageGroupEntries[0]?.[0] || 'N/A'
    const dominantAgeGroupCount = ageGroupEntries[0]?.[1] || 0

    const dominantCountry = topCountries[0]?.[0] || 'N/A'
    const dominantCountryCount = topCountries[0]?.[1] || 0

    const averagePriceFormatted = Number(avgValue.toFixed(1))
    const totalValueFormatted = Number(totalValue.toFixed(1))

    return {
      total,

      avgAge,

      nonSurgCount,
      nonSurgPercent,

      totalValue: totalValueFormatted,
      avgValue: averagePriceFormatted,

      avgBmi,
      highBmiCount,

      pastSurgCount,

      mostRequested,
      mostRequestedCount,

      topProcedures: topProcs,
      allProcedures,
      procedureValueBreakdown,

      countryDistribution: topCountries,
      dominantCountry,
      dominantCountryCount,

      ageGroups,
      dominantAgeGroup,
      dominantAgeGroupCount,
      bmiCategories,

      monthlyTrend,

      avgWeight,
      avgHeight
    }
  }

  const getUniqueProcedures = () => {
    const set = new Set()

      ; (patients.value || []).forEach(p => {
        if (p.selectedProcedure) {
          set.add(String(p.selectedProcedure).trim())
        }
      })

    return [...set]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }

  const getUniqueCountries = () => {
    const set = new Set()

      ; (patients.value || []).forEach(p => {
        if (p.Country) {
          set.add(String(p.Country).trim())
        }
      })

    return [...set]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }

  return {
    generateReportData,
    generateDetailedInsights,
    getUniqueProcedures,
    getUniqueCountries
  }
}