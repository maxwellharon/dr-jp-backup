<template>
  <div class="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition">
    <h3 class="font-bold text-xl mb-3">Procedure Requests</h3>
    <canvas ref="canvas" width="400" height="250" style="max-height: 250px;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps(['data'])
const emit = defineEmits(['bar-click'])
const canvas = ref(null)
let chart = null

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.data.labels || [],
      datasets: [{
        label: 'Requests',
        data: props.data.counts || [],
        backgroundColor: '#818cf8',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const label = chart.data.labels[index]
          emit('bar-click', label)
        }
      }
    }
  })
})

watch(() => props.data, (newData) => {
  if (chart) {
    chart.data.labels = newData.labels || []
    chart.data.datasets[0].data = newData.counts || []
    chart.update()
  }
}, { deep: true })
</script>