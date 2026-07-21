// src/composables/useReportGeneration.js
import { useWixData } from './useWixData'

export function useReportGeneration() {
  const { patients } = useWixData()

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
      createdDate: p.createdDate || ''
    }))
  }

  const getUniqueProcedures = () => {
    const set = new Set()
    ;(patients.value || []).forEach(p => {
      if (p.selectedProcedure) set.add(p.selectedProcedure)
    })
    return [...set].sort()
  }

  const getUniqueCountries = () => {
    const set = new Set()
    ;(patients.value || []).forEach(p => {
      if (p.Country) set.add(p.Country)
    })
    return [...set].sort()
  }

  return { generateReportData, getUniqueProcedures, getUniqueCountries }
}