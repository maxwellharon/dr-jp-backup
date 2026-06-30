<template>
  <div class="overflow-x-auto bg-white rounded-2xl shadow">
    <table class="min-w-full">
      <thead class="bg-slate-100">
        <tr>
          <th class="px-5 py-3 text-left">Name</th>
          <th class="px-5 py-3 text-left">Procedure</th>
          <th class="px-5 py-3 text-left">Age</th>
          <th class="px-5 py-3 text-left">Phone</th>
          <th class="px-5 py-3 text-left">Price (KES)</th>
          <th class="px-5 py-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in patients" :key="p.id" class="border-b hover:bg-slate-50">
          <td class="px-5 py-2">{{ p.name || 'Anonymous' }}<div class="text-xs text-slate-400">{{ p.email || '' }}</div></td>
          <td class="px-5 py-2">{{ p.selectedProcedure || '—' }}</td>
          <td class="px-5 py-2">{{ p.age || '—' }}</td>
          <td class="px-5 py-2">{{ p.phone || '—' }}</td>
          <td class="px-5 py-2">{{ formatPrice(p.calculatedPrice) }}</td>
          <td class="px-5 py-2">
            <router-link :to="`/patients/${p.id}`" class="text-indigo-600 hover:underline text-sm">View</router-link>
          </td>
        </tr>
        <tr v-if="!patients.length"><td colspan="6" class="text-center py-8 text-slate-400">No patients found.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps(['patients'])

const formatPrice = (price) => {
  if (!price) return '—'
  return new Intl.NumberFormat('en-KE').format(price)
}
</script>