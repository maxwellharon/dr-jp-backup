<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-indigo-600">Loading real Wix data...</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { useAuth } from './stores/auth'
const { loading } = useAuth()
</script>