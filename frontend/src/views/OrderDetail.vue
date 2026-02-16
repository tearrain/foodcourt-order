<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getOrder, cancelOrder as apiCancelOrder } from '@/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const orderId = computed(() => route.params.orderId as string)
const order = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await getOrder(orderId.value)
    order.value = res.data
  } catch {
    //
  } finally {
    loading.value = false
  }
})

const canCancel = computed(() => {
  return order.value && ['pending', 'paid'].includes(order.value.status)
})

async function handleCancel() {
  if (!confirm(t('order.cancelOrder') + '?')) return
  try {
    await apiCancelOrder(orderId.value, { reason: 'User cancelled' })
    order.value.status = 'cancelled'
  } catch {
    //
  }
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600',
    paid: 'text-blue-600',
    confirmed: 'text-blue-600',
    preparing: 'text-orange-600',
    ready: 'text-green-600',
    completed: 'text-gray-600',
    cancelled: 'text-red-600',
  }
  return colors[status] || 'text-gray-600'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white px-4 py-3 sticky top-0 z-10 border-b flex items-center gap-3">
      <button @click="router.back()">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-bold">{{ t('order.title') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else-if="order" class="pb-20">
      <!-- Status -->
      <div class="bg-white mx-4 mt-3 rounded-xl p-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">{{ order.order_no }}</span>
          <span class="font-medium" :class="statusColor(order.status)">
            {{ t(`order.status.${order.status}`) }}
          </span>
        </div>
        <div v-if="order.table_number" class="text-sm text-gray-500 mt-1">
          {{ t('order.tableNumber') }}: {{ order.table_number }}
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white mx-4 mt-3 rounded-xl p-4">
        <div
          v-for="item in (order.items || [])"
          :key="item.id"
          class="flex justify-between py-2 text-sm border-b last:border-0"
        >
          <div class="flex-1">
            <span>{{ item.dish_name || item.dish_snapshot?.name }}</span>
            <span v-if="item.stall_name" class="text-xs text-gray-400 ml-1">({{ item.stall_name }})</span>
            <span class="text-gray-400 ml-2">x{{ item.quantity }}</span>
          </div>
          <span class="ml-2">{{ t('common.currency') }}{{ item.subtotal_amount?.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Amount -->
      <div class="bg-white mx-4 mt-3 rounded-xl p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">{{ t('cart.subtotal') }}</span>
          <span>{{ t('common.currency') }}{{ order.subtotal_amount?.toFixed(2) }}</span>
        </div>
        <div v-if="order.tax_amount" class="flex justify-between">
          <span class="text-gray-500">{{ t('cart.tax') }}</span>
          <span>{{ t('common.currency') }}{{ order.tax_amount?.toFixed(2) }}</span>
        </div>
        <div v-if="order.discount_amount" class="flex justify-between text-green-600">
          <span>{{ t('cart.discount') }}</span>
          <span>-{{ t('common.currency') }}{{ order.discount_amount?.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base border-t pt-2">
          <span>{{ t('cart.total') }}</span>
          <span class="text-primary-500">{{ t('common.currency') }}{{ order.total_amount?.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Remark -->
      <div v-if="order.user_remark" class="bg-white mx-4 mt-3 rounded-xl p-4 text-sm">
        <span class="text-gray-500">{{ t('order.remark') }}:</span>
        <span class="ml-1">{{ order.user_remark }}</span>
      </div>

      <!-- Actions -->
      <div v-if="canCancel" class="mx-4 mt-4">
        <button
          class="w-full py-3 border border-red-500 text-red-500 rounded-xl font-medium"
          @click="handleCancel"
        >
          {{ t('order.cancelOrder') }}
        </button>
      </div>
    </div>
  </div>
</template>
