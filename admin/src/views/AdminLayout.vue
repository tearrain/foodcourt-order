<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { setLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

const sidebarOpen = ref(true)

const navItems = [
  { name: 'dashboard', icon: 'chart', path: '/' },
  { name: 'food-courts', icon: 'building', path: '/food-courts' },
  { name: 'stalls', icon: 'store', path: '/stalls' },
  { name: 'dishes', icon: 'food', path: '/dishes' },
  { name: 'orders', icon: 'receipt', path: '/orders' },
  { name: 'settlements', icon: 'wallet', path: '/settlements' },
  { name: 'settings', icon: 'gear', path: '/settings' },
]

const currentNav = computed(() => {
  const path = route.path
  if (path === '/') return 'dashboard'
  return navItems.find(n => n.path !== '/' && path.startsWith(n.path))?.name || 'dashboard'
})

function toggleLang() {
  setLocale(locale.value === 'en' ? 'zh-CN' : 'en')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="bg-white border-r border-gray-200 transition-all duration-200 flex flex-col"
      :class="sidebarOpen ? 'w-60' : 'w-16'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-4 border-b border-gray-200">
        <span v-if="sidebarOpen" class="text-lg font-bold text-primary-600">FoodCourt</span>
        <span v-else class="text-lg font-bold text-primary-600 mx-auto">FC</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4 space-y-1 px-2">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="currentNav === item.name
            ? 'bg-primary-50 text-primary-600 font-medium'
            : 'text-gray-600 hover:bg-gray-50'"
        >
          <!-- Simple icon placeholders -->
          <span class="w-5 h-5 flex items-center justify-center text-xs">
            <template v-if="item.icon === 'chart'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </template>
            <template v-else-if="item.icon === 'building'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </template>
            <template v-else-if="item.icon === 'store'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </template>
            <template v-else-if="item.icon === 'food'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </template>
            <template v-else-if="item.icon === 'receipt'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </template>
            <template v-else-if="item.icon === 'wallet'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </template>
            <template v-else>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </template>
          </span>
          <span v-if="sidebarOpen">{{ t(`nav.${item.name === 'food-courts' ? 'foodCourts' : item.name}`) }}</span>
        </router-link>
      </nav>

      <!-- Bottom -->
      <div class="border-t border-gray-200 p-3 space-y-2">
        <button
          class="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          @click="toggleLang"
        >
          <span class="text-xs">{{ locale === 'en' ? '中文' : 'EN' }}</span>
        </button>
        <button
          class="w-full text-left px-3 py-2 text-sm text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
          @click="logout"
        >
          {{ sidebarOpen ? t('auth.logout') : '' }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 overflow-auto">
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
        <button class="text-gray-500" @click="sidebarOpen = !sidebarOpen">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>
      <div class="p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>
