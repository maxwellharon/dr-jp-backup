<template>
  <Transition name="modal">
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-3">Upload Patient Data</h3>
        <p class="text-sm text-slate-500 mb-3">CSV or JSON (fields: name, selectedProcedure, age, email, bmi, Country, isNonSurgical, calculatedPrice, etc.)</p>
        <input type="file" accept=".csv,.json" @change="handleFile" class="w-full border p-2 rounded-xl">
        <div v-if="status" class="mt-3 text-sm">{{ status }}</div>
        <div class="flex justify-end gap-3 mt-5">
          <button @click="$emit('close')" class="px-4 py-2 border rounded-xl hover:bg-gray-100 transition">Cancel</button>
          <button @click="seedSample" class="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-xl hover:bg-indigo-200 transition">Load Sample</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { useWixData } from '../composables/useWixData'

const { bulkUpload } = useWixData()
const emit = defineEmits(['close', 'uploaded'])
const status = ref('')

const handleFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  status.value = 'Processing...'
  try {
    const text = await file.text()
    let records = []
    if (file.name.endsWith('.json')) {
      records = JSON.parse(text)
      if (!Array.isArray(records)) records = [records]
    } else {
      const lines = text.split(/\r?\n/)
      const headers = lines[0].split(',').map(h => h.trim())
      records = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(',').map(v => v.trim())
        let obj = {}
        headers.forEach((h, i) => { obj[h] = vals[i] || null })
        if (obj.age) obj.age = parseInt(obj.age)
        if (obj.bmi) obj.bmi = parseFloat(obj.bmi)
        if (obj.calculatedPrice) obj.calculatedPrice = parseFloat(obj.calculatedPrice)
        if (obj.isNonSurgical) obj.isNonSurgical = obj.isNonSurgical === 'true' || obj.isNonSurgical === true
        return obj
      })
    }
    if (records.length) await bulkUpload(records)
    status.value = `✅ Imported ${records.length} records`
    setTimeout(() => { emit('close'); emit('uploaded') }, 1500)
  } catch (err) { status.value = `❌ Error: ${err.message}` }
}

const seedSample = async () => {
  const sample = [
    { name: 'John Doe', age: 34, selectedProcedure: 'Liposuction', isNonSurgical: false, calculatedPrice: 5500, Country: 'Kenya', email: 'john@example.com', bmi: 27 },
    { name: 'Jane Smith', age: 28, selectedProcedure: 'Botox', isNonSurgical: true, calculatedPrice: 800, Country: 'USA', email: 'jane@example.com', bmi: 22 },
    { name: 'Michael Ogalo', age: 45, selectedProcedure: 'Rhinoplasty', isNonSurgical: false, calculatedPrice: 6200, Country: 'Kenya', email: 'michael@example.com', bmi: 26 }
  ]
  try {
    await bulkUpload(sample)
    status.value = '✅ Added 3 sample patients'
    setTimeout(() => { emit('close'); emit('uploaded') }, 1500)
  } catch (err) { status.value = `❌ Error: ${err.message}` }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}
.modal-enter-from > div {
  transform: scale(0.95);
}
</style>