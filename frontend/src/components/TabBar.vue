<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'

const props = defineProps<{ foodCourtId: string }>()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()

const tabs = computed(() => [
  { name: 'home', icon: 'home', label: t('nav.home'), path: `/fc/${props.foodCourtId}` },
  { name: 'stalls', icon: 'store', label: t('nav.stalls'), path: `/fc/${props.foodCourtId}/stalls` },
  { name: 'cart', icon: 'cart', label: t('nav.cart'), path: `/fc/${props.foodCourtId}/cart`, badge: cartStore.totalItems },
  { name: 'orders', icon: 'receipt', label: t('nav.orders'), path: `/fc/${props.foodCourtId}/orders` },
])

const activeTab = computed(() => {
  const name = route.name as string
  if (name === 'stall-detail' || name === 'stalls') return 'stalls'
  if (name === 'cart' || name === 'checkout') return 'cart'
  if (name === 'orders' || name === 'order-detail') return 'orders'
  return 'home'
})

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
    <div class="flex justify-around items-center h-14 max-w-lg mx-auto">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex flex-col items-center justify-center flex-1 py-1 relative"
        :class="activeTab === tab.name ? 'text-primary-500' : 'text-gray-400'"
        @click="goTo(tab.path)"
      >
        <!-- Icons -->
        <svg v-if="tab.icon === 'home'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <svg v-else-if="tab.icon === 'store'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <svg v-else-if="tab.icon === 'cart'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <svg v-else-if="tab.icon === 'receipt'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <!-- Badge -->
        <span
          v-if="tab.badge && tab.badge > 0"
          class="absolute -top-0.5 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ tab.badge > 99 ? '99+' : tab.badge }}
        </span>
        <span class="text-xs mt-0.5">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
