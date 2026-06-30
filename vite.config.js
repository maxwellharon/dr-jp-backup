import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import apiProxyPlugin from './api-proxy-plugin.js'

export default defineConfig({
  plugins: [vue(), apiProxyPlugin()]
})