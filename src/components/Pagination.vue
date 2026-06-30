<template>
    <div class="flex justify-center items-center gap-2">
      <button 
        @click="$emit('page-change', currentPage - 1)" 
        :disabled="currentPage <= 1" 
        class="px-3 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <i class="fas fa-chevron-left text-sm"></i>
      </button>
      <template v-for="page in displayedPages" :key="page">
        <button 
          v-if="page !== '...'" 
          @click="$emit('page-change', page)" 
          :class="page === currentPage ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'" 
          class="px-3 py-2 rounded-lg shadow transition font-medium"
        >
          {{ page }}
        </button>
        <span v-else class="px-2">…</span>
      </template>
      <button 
        @click="$emit('page-change', currentPage + 1)" 
        :disabled="currentPage >= totalPages" 
        class="px-3 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <i class="fas fa-chevron-right text-sm"></i>
      </button>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    currentPage: Number,
    totalPages: Number
  })
  
  defineEmits(['page-change'])
  
  const displayedPages = computed(() => {
    const pages = []
    const total = props.totalPages
    const current = props.currentPage
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...', total)
      } else if (current >= total - 3) {
        pages.push(1, '...')
        for (let i = total - 4; i <= total; i++) pages.push(i)
      } else {
        pages.push(1, '...')
        for (let i = current - 1; i <= current + 1; i++) pages.push(i)
        pages.push('...', total)
      }
    }
    return pages
  })
  </script>