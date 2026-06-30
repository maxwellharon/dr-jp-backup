<template>
  <div class="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition">
    <h3 class="font-bold text-xl mb-3">📅 Patient Registrations Over Time</h3>
    <canvas ref="canvas" width="400" height="250" style="max-height: 250px;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps(['data'])
const emit = defineEmits(['point-click'])
const canvas = ref(null)
let chart = null

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.labels || [],
      datasets: [{
        label: 'New Patients',
        data: props.data.counts || [],
        fill: false,
        borderColor: '#6366f1',
        tension: 0.1,
        pointBackgroundColor: '#6366f1'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const label = chart.data.labels[index]
          emit('point-click', label)
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