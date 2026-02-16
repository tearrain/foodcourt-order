<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAdminStats, getAdminOrders } from '@/api'

const { t } = useI18n()

const stats = ref<any>({})
const recentOrders = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [statsRes, ordersRes] = await Promise.allSettled([
      getAdminStats(),
      getAdminOrders({ limit: 5 }),
    ])
    if (statsRes.status === 'fulfilled') stats.value = (statsRes.value as any).data || {}
    if (ordersRes.status === 'fulfilled') recentOrders.value = (ordersRes.value as any).data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
})

const statCards = [
  { key: 'total_orders', label: 'dashboard.totalOrders', icon: 'receipt', color: 'bg-blue-500' },
  { key: 'total_revenue', label: 'dashboard.totalRevenue', icon: 'currency', color: 'bg-green-500', isCurrency: true },
  { key: 'total_users', label: 'dashboard.totalUsers', icon: 'users', color: 'bg-purple-500' },
  { key: 'total_stalls', label: 'dashboard.totalStalls', icon: 'store', color: 'bg-orange-500' },
]

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
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
    <h1 class="text-2xl font-bold mb-6">{{ t('dashboard.title') }}</h1>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="bg-white rounded-xl p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ t(card.label) }}</p>
            <p class="text-2xl font-bold mt-1">
              <template v-if="card.isCurrency">{{ t('common.currency') }}</template>
              {{ card.isCurrency ? (stats[card.key] || 0).toFixed(2) : (stats[card.key] || 0) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white" :class="card.color">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Today stats row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <p class="text-sm text-gray-500">{{ t('dashboard.todayOrders') }}</p>
        <p class="text-3xl font-bold mt-2">{{ stats.orders_today || 0 }}</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <p class="text-sm text-gray-500">{{ t('dashboard.todayRevenue') }}</p>
        <p class="text-3xl font-bold mt-2">{{ t('common.currency') }}{{ (stats.revenue_today || 0).toFixed(2) }}</p>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-white rounded-xl shadow-sm">
      <div class="px-5 py-4 border-b border-gray-100">
        <h2 class="font-semibold">{{ t('dashboard.recentOrders') }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="px-5 py-3 font-medium">{{ t('order.orderNo') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('order.items') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('order.amount') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('order.orderStatus') }}</th>
              <th class="px-5 py-3 font-medium">{{ t('order.createdAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id" class="border-b last:border-0 hover:bg-gray-50">
              <td class="px-5 py-3 font-mono text-xs">{{ order.order_no }}</td>
              <td class="px-5 py-3">{{ order.item_count }}</td>
              <td class="px-5 py-3 font-medium">{{ t('common.currency') }}{{ order.total_amount?.toFixed(2) }}</td>
              <td class="px-5 py-3">
                <span class="px-2 py-1 rounded-full text-xs" :class="statusColor(order.status)">
                  {{ t(`order.status.${order.status}`) }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-500">{{ order.created_at }}</td>
            </tr>
            <tr v-if="!recentOrders.length">
              <td colspan="5" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
