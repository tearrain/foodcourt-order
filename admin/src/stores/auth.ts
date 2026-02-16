import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('fc-admin-token') || '')
  const user = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res: any = await adminLogin({ email, password })
    token.value = res.data?.token || res.token
    localStorage.setItem('fc-admin-token', token.value)
    user.value = res.data?.user || res.user
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('fc-admin-token')
  }

  return { token, user, isLoggedIn, login, logout }
})
