<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSettlements } from '@/api'

const { t } = useI18n()

const settlements = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await getSettlements({ limit: 50 })
    settlements.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('settlement.title') }}</h1>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b bg-gray-50">
            <th class="px-5 py-3 font-medium">{{ t('settlement.stall') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('settlement.orderCount') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('settlement.grossAmount') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('settlement.commission') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('settlement.netAmount') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('settlement.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in settlements" :key="s.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 font-medium">{{ s.stall_name || s.stall_id }}</td>
            <td class="px-5 py-3">{{ s.item_count || 0 }}</td>
            <td class="px-5 py-3">{{ t('common.currency') }}{{ (s.gross_settlement_amount || s.subtotal_amount || 0).toFixed(2) }}</td>
            <td class="px-5 py-3 text-red-500">{{ t('common.currency') }}{{ (s.platform_commission_amount || 0).toFixed(2) }}</td>
            <td class="px-5 py-3 font-medium text-green-600">{{ t('common.currency') }}{{ (s.net_settlement_amount || 0).toFixed(2) }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs" :class="s.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ s.status === 'settled' ? t('settlement.settled') : t('settlement.pending') }}
              </span>
            </td>
          </tr>
          <tr v-if="!settlements.length">
            <td colspan="6" class="px-5 py-8 text-center text-gray-400">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
