<template>
  <div class="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition">
    <h3 class="font-bold text-xl mb-3">Age Groups</h3>
    <canvas ref="canvas" width="400" height="250" style="max-height: 250px;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps(['data'])
const emit = defineEmits(['segment-click'])
const canvas = ref(null)
let chart = null

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['18-25', '26-35', '36-50', '51+'],
      datasets: [{
        data: props.data || [0,0,0,0],
        backgroundColor: ['#34d399','#60a5fa','#fbbf24','#f87171'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '55%',
      plugins: { legend: { position: 'bottom' } },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const label = chart.data.labels[index]
          emit('segment-click', label)
        }
      }
    }
  })
})

watch(() => props.data, (newData) => {
  if (chart) {
    chart.data.datasets[0].data = newData || [0,0,0,0]
    chart.update()
  }
})
</script>