<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAdminOrders, confirmOrder, prepareOrder, readyOrder, completeOrder } from '@/api'

const router = useRouter()
const { t } = useI18n()

const orders = ref<any[]>([])
const loading = ref(true)
const statusFilter = ref('')

const filters = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'order.status.pending' },
  { value: 'paid', label: 'order.status.paid' },
  { value: 'preparing', label: 'order.status.preparing' },
  { value: 'ready', label: 'order.status.ready' },
  { value: 'completed', label: 'order.status.completed' },
  { value: 'cancelled', label: 'order.status.cancelled' },
]

onMounted(() => fetchOrders())

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = { limit: 50 }
    if (statusFilter.value) params.status = statusFilter.value
    const res: any = await getAdminOrders(params)
    orders.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

async function handleAction(orderId: string, action: string) {
  try {
    if (action === 'confirm') await confirmOrder(orderId)
    else if (action === 'prepare') await prepareOrder(orderId)
    else if (action === 'ready') await readyOrder(orderId)
    else if (action === 'complete') await completeOrder(orderId)
    fetchOrders()
  } catch {
    //
  }
}

function getActions(status: string) {
  const map: Record<string, { action: string; label: string; color: string }[]> = {
    paid: [{ action: 'confirm', label: 'order.confirmOrder', color: 'bg-blue-500' }],
    confirmed: [{ action: 'prepare', label: 'order.startPrepare', color: 'bg-orange-500' }],
    preparing: [{ action: 'ready', label: 'order.markReady', color: 'bg-green-500' }],
    ready: [{ action: 'complete', label: 'order.completeOrder', color: 'bg-gray-600' }],
  }
  return map[status] || []
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('order.title') }}</h1>

    <!-- Status Filters -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="f in filters"
        :key="f.value"
        class="px-3 py-1.5 rounded-lg text-sm transition-colors"
        :class="statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
        @click="statusFilter = f.value; fetchOrders()"
      >
        {{ f.value ? t(f.label) : f.label }}
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b bg-gray-50">
            <th class="px-5 py-3 font-medium">{{ t('order.orderNo') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('order.type') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('order.items') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('order.amount') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('order.orderStatus') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('order.createdAt') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 font-mono text-xs cursor-pointer text-primary-600" @click="router.push(`/orders/${order.id}`)">
              {{ order.order_no }}
            </td>
            <td class="px-5 py-3">{{ order.order_type === 'dine_in' ? t('order.dineIn') : order.order_type === 'takeout' ? t('order.takeout') : t('order.delivery') }}</td>
            <td class="px-5 py-3">{{ order.item_count }}</td>
            <td class="px-5 py-3 font-medium">{{ t('common.currency') }}{{ order.total_amount?.toFixed(2) }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="statusColor(order.status)">
                {{ t(`order.status.${order.status}`) }}
              </span>
            </td>
            <td class="px-5 py-3 text-gray-500 text-xs">{{ order.created_at }}</td>
            <td class="px-5 py-3">
              <div class="flex gap-1">
                <button
                  v-for="act in getActions(order.status)"
                  :key="act.action"
                  class="px-2 py-1 text-white rounded text-xs"
                  :class="act.color"
                  @click="handleAction(order.id, act.action)"
                >
                  {{ t(act.label) }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="7" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
