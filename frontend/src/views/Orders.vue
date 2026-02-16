<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getOrders } from '@/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const foodCourtId = computed(() => route.params.foodCourtId as string)

const orders = ref<any[]>([])
const loading = ref(true)
const activeStatus = ref('')

const statusFilters = [
  { value: '', label: 'common.all' },
  { value: 'pending', label: 'order.status.pending' },
  { value: 'preparing', label: 'order.status.preparing' },
  { value: 'ready', label: 'order.status.ready' },
  { value: 'completed', label: 'order.status.completed' },
]

onMounted(() => fetchOrders())

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = { limit: 20 }
    if (activeStatus.value) params.status = activeStatus.value
    const res: any = await getOrders(params)
    orders.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    paid: 'text-blue-600 bg-blue-50',
    confirmed: 'text-blue-600 bg-blue-50',
    preparing: 'text-orange-600 bg-orange-50',
    ready: 'text-green-600 bg-green-50',
    completed: 'text-gray-600 bg-gray-50',
    cancelled: 'text-red-600 bg-red-50',
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

function goToOrder(orderId: string) {
  router.push(`/fc/${foodCourtId.value}/order/${orderId}`)
}
</script>

<template>
  <div>
    <div class="bg-white px-4 py-3 sticky top-0 z-10 border-b">
      <h1 class="text-lg font-bold">{{ t('order.title') }}</h1>
      <!-- Status filter -->
      <div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          class="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
          :class="activeStatus === f.value
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 text-gray-600'"
          @click="activeStatus = f.value; fetchOrders()"
        >
          {{ t(f.label) }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else-if="!orders.length" class="flex flex-col items-center py-20 text-gray-400">
      <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="mt-4">{{ t('order.noOrders') }}</p>
      <p class="text-sm mt-1">{{ t('order.noOrdersHint') }}</p>
    </div>

    <div v-else class="px-4 py-3 space-y-3 pb-20">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-xl p-4"
        @click="goToOrder(order.id)"
      >
        <div class="flex justify-between items-start">
          <div class="text-sm text-gray-500">{{ order.order_no }}</div>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="statusColor(order.status)">
            {{ t(`order.status.${order.status}`) }}
          </span>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          {{ order.item_count }} {{ t('cart.itemCount', { count: order.item_count }) }}
        </div>
        <div class="mt-2 flex justify-between items-center">
          <span class="text-primary-500 font-bold">
            {{ t('common.currency') }}{{ order.total_amount?.toFixed(2) }}
          </span>
          <span class="text-xs text-gray-400">{{ order.created_at }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
