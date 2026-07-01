<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <div
      @click="$emit('card-click', 'total')"
      class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-indigo-500 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer"
    >
      <div class="text-slate-500 text-sm">Total Patients</div>
      <div class="text-3xl font-bold">{{ total }}</div>
    </div>
    <div
      @click="$emit('card-click', 'procedure')"
      class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-emerald-500 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer"
    >
      <div class="text-slate-500 text-sm">Most Requested</div>
      <div class="text-xl font-bold truncate">{{ mostRequested || '—' }}</div>
    </div>
    <div
      @click="$emit('card-click', 'age')"
      class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-amber-500 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer"
    >
      <div class="text-slate-500 text-sm">Average Age</div>
      <div class="text-3xl font-bold">{{ avgAge }}</div>
    </div>
    <div
      @click="$emit('card-click', 'nonSurgical')"
      class="bg-white p-5 rounded-2xl shadow-md border-l-8 border-rose-500 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer"
    >
      <div class="text-slate-500 text-sm">Non‑Surgical %</div>
      <div class="text-3xl font-bold">{{ nonSurgPercent }}%</div>
    </div>
  </div>
</template>

<script setup>
defineProps(['total', 'mostRequested', 'avgAge', 'nonSurgPercent'])
defineEmits(['card-click'])
</script>