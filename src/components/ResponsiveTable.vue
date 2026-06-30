<template>
  <!-- Desktop table -->
  <div class="hidden md:block overflow-x-auto bg-white rounded-2xl shadow">
    <table class="min-w-full">
      <thead class="bg-slate-100">
        <tr>
          <!-- dynamic headers, plus optional Actions -->
          <th v-for="h in headers" :key="h" class="px-5 py-3 text-left">{{ h }}</th>
          <th v-if="actions" class="px-5 py-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id" class="border-b hover:bg-slate-50 transition">
          <!-- Name -->
          <td class="px-5 py-3 font-medium">
            {{ item.name || 'Anonymous' }}
            <div v-if="item.email" class="text-xs text-slate-400">{{ item.email }}</div>
          </td>
          <!-- Procedure -->
          <td class="px-5 py-3">{{ item.selectedProcedure || '—' }}</td>
          <!-- Age (fallback already set by mapper) -->
          <td class="px-5 py-3">{{ item.age ?? '—' }}</td>
          <!-- Phone (fallback already set by mapper) -->
          <td class="px-5 py-3">{{ item.phone || '—' }}</td>
          <!-- Price -->
          <td class="px-5 py-3">{{ formatPrice(item.calculatedPrice) }}</td>
          <!-- Actions -->
          <td v-if="actions" class="px-5 py-3 flex gap-2">
            <button @click="$emit('view', item)" class="text-indigo-600 hover:underline text-sm">
              <i class="fas fa-eye"></i>
            </button>
            <button @click="$emit('delete', item.id)" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
        <tr v-if="!data.length">
          <td :colspan="headers.length + (actions ? 1 : 0)" class="text-center py-8 text-slate-400">
            No data found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile cards -->
  <div class="md:hidden space-y-4">
    <div v-for="item in data" :key="item.id" class="bg-white rounded-xl shadow p-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-lg">{{ item.name || 'Anonymous' }}</h3>
          <p class="text-sm text-slate-500">{{ item.email || '' }}</p>
        </div>
        <span v-if="actions" class="flex gap-2">
          <button @click="$emit('view', item)" class="text-indigo-600"><i class="fas fa-eye"></i></button>
          <button @click="$emit('delete', item.id)" class="text-red-500"><i class="fas fa-trash-alt"></i></button>
        </span>
      </div>
      <dl class="mt-3 space-y-1 text-sm">
        <div class="flex justify-between">
          <dt class="text-slate-500">Procedure:</dt>
          <dd>{{ item.selectedProcedure || '—' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Age:</dt>
          <dd>{{ item.age ?? '—' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Phone:</dt>
          <dd>{{ item.phone || '—' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Price:</dt>
          <dd>{{ formatPrice(item.calculatedPrice) }}</dd>
        </div>
      </dl>
    </div>
    <div v-if="!data.length" class="text-center py-8 text-slate-400 bg-white rounded-xl shadow">
      No data found.
    </div>
  </div>
</template>

<script setup>
defineProps({
  headers: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  actions: { type: Boolean, default: false }
})

defineEmits(['view', 'delete'])

const formatPrice = (price) => {
  if (!price) return '—'
  return new Intl.NumberFormat('en-KE').format(Math.round(price))
}
</script>