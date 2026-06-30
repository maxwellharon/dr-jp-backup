<template>
    <div class="overflow-x-auto bg-white rounded-2xl shadow">
      <table class="min-w-full">
        <thead class="bg-slate-100">
          <tr>
            <th class="px-5 py-3 text-left">Name</th>
            <th class="px-5 py-3 text-left">Procedure</th>
            <th class="px-5 py-3 text-left">Age</th>
            <th class="px-5 py-3 text-left">Country</th>
            <th class="px-5 py-3 text-left">BMI</th>
            <th class="px-5 py-3 text-left">Non‑Surg</th>
            <th class="px-5 py-3 text-left">Price</th>
            <th class="px-5 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in patients" :key="p.id" class="border-b hover:bg-slate-50">
            <td class="px-5 py-2">{{ p.name || 'Anonymous' }}<div class="text-xs text-slate-400">{{ p.email || '' }}</div></td>
            <td class="px-5 py-2">{{ p.selectedProcedure || '—' }}</td>
            <td class="px-5 py-2">{{ p.age || '—' }}</td>
            <td class="px-5 py-2">{{ p.Country || '—' }}</td>
            <td class="px-5 py-2">{{ p.bmi || '—' }}</td>
            <td class="px-5 py-2"><span :class="p.isNonSurgical ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-1 rounded-full text-xs">{{ p.isNonSurgical ? 'Yes' : 'Surgical' }}</span></td>
            <td class="px-5 py-2">${{ p.calculatedPrice ? p.calculatedPrice.toLocaleString() : '—' }}</td>
            <td class="px-5 py-2"><button @click="$emit('delete', p.id)" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></td>
          </tr>
          <tr v-if="!patients.length"><td colspan="8" class="text-center py-8 text-slate-400">No patients found.</td></tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  defineProps(['patients'])
  defineEmits(['delete'])
  </script>