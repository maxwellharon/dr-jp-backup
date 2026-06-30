<template>
  <div class="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition">
    <h3 class="font-bold text-xl mb-3">Country Distribution</h3>
    <canvas ref="canvas" width="400" height="250" style="max-height: 250px;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({ data: Object })
const emit = defineEmits(['slice-click'])
const canvas = ref(null)
let chart = null

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: props.data.labels || [],
      datasets: [{
        data: props.data.values || [],
        backgroundColor: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#84cc16'],
        borderWidth: 0
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const label = chart.data.labels[index]
          emit('slice-click', label)
        }
      }
    }
  })
})

watch(() => props.data, (newData) => {
  if (chart) {
    chart.data.labels = newData.labels || []
    chart.data.datasets[0].data = newData.values || []
    chart.update()
  }
}, { deep: true })
</script>