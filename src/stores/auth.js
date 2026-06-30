import { ref } from 'vue'
import { auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const user = ref(null)
const loading = ref(true)

let resolveAuthReady
const authReady = new Promise(resolve => { resolveAuthReady = resolve })

onAuthStateChanged(auth, (u) => {
  user.value = u
  loading.value = false
  if (resolveAuthReady) resolveAuthReady()
})

export function useAuth() {
  return { user, loading, authReady }
}