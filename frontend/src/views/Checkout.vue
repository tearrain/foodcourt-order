<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import { createOrder, createPayment } from '@/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()

const foodCourtId = computed(() => route.params.foodCourtId as string)
const orderType = ref('dine_in')
const tableNumber = ref('')
const remark = ref('')
const paymentMethod = ref('mock')
const submitting = ref(false)
const orderSuccess = ref(false)
const createdOrderId = ref('')

const orderTypes = [
  { value: 'dine_in', labelKey: 'order.dineIn' },
  { value: 'takeout', labelKey: 'order.takeout' },
]

async function submitOrder() {
  if (submitting.value) return
  if (orderType.value === 'dine_in' && !tableNumber.value) return

  submitting.value = true
  try {
    const items = cartStore.items.map(item => ({
      dish_id: item.dish_id,
      quantity: item.quantity,
      customizations: item.customizations,
    }))

    const orderRes: any = await createOrder({
      food_court_id: foodCourtId.value,
      order_type: orderType.value,
      table_number: tableNumber.value || undefined,
      items,
      user_remark: remark.value || undefined,
    })

    const orderId = orderRes.data?.order_id || orderRes.data?.id
    createdOrderId.value = orderId

    // Create payment
    await createPayment({
      order_id: orderId,
      payment_method: paymentMethod.value,
    })

    orderSuccess.value = true
    cartStore.clear()
  } catch {
    //
  } finally {
    submitting.value = false
  }
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
      <h1 class="text-lg font-bold">{{ t('order.createOrder') }}</h1>
    </div>

    <!-- Success view -->
    <div v-if="orderSuccess" class="flex flex-col items-center justify-center py-20 px-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-xl font-bold mt-4">{{ t('order.orderPlaced') }}</h2>
      <p class="text-gray-500 mt-2">{{ t('order.orderPlacedHint') }}</p>
      <button
        class="mt-8 px-8 py-3 bg-primary-500 text-white rounded-xl font-medium"
        @click="router.push(`/fc/${foodCourtId}/order/${createdOrderId}`)"
      >
        {{ t('order.viewOrder') }}
      </button>
    </div>

    <!-- Order form -->
    <div v-else class="pb-24">
      <!-- Order type -->
      <div class="bg-white mt-3 mx-4 rounded-xl p-4">
        <div class="flex gap-3">
          <button
            v-for="ot in orderTypes"
            :key="ot.value"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="orderType === ot.value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600'"
            @click="orderType = ot.value"
          >
            {{ t(ot.labelKey) }}
          </button>
        </div>
        <!-- Table number for dine-in -->
        <div v-if="orderType === 'dine_in'" class="mt-4">
          <label class="text-sm text-gray-500">{{ t('order.tableNumber') }}</label>
          <input
            v-model="tableNumber"
            type="text"
            :placeholder="t('order.enterTable')"
            class="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <!-- Order summary -->
      <div class="bg-white mt-3 mx-4 rounded-xl p-4">
        <h3 class="font-medium mb-3">{{ t('cart.itemCount', { count: cartStore.totalItems }) }}</h3>
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="flex justify-between items-center py-2 text-sm"
        >
          <span class="flex-1 truncate">{{ item.dish_name }} x{{ item.quantity }}</span>
          <span class="text-gray-600 ml-2">{{ t('common.currency') }}{{ item.subtotal.toFixed(2) }}</span>
        </div>
        <div class="border-t mt-2 pt-2 flex justify-between font-medium">
          <span>{{ t('cart.total') }}</span>
          <span class="text-primary-500">{{ t('common.currency') }}{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Remark -->
      <div class="bg-white mt-3 mx-4 rounded-xl p-4">
        <label class="text-sm text-gray-500">{{ t('order.remark') }}</label>
        <textarea
          v-model="remark"
          :placeholder="t('order.remarkPlaceholder')"
          class="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
          rows="2"
        ></textarea>
      </div>

      <!-- Submit -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 safe-bottom z-30">
        <button
          class="w-full py-3 rounded-xl font-medium text-white bg-primary-500 active:bg-primary-600 disabled:bg-gray-300"
          :disabled="submitting || (orderType === 'dine_in' && !tableNumber)"
          @click="submitOrder"
        >
          {{ submitting ? t('common.loading') : t('order.payNow') }} - {{ t('common.currency') }}{{ cartStore.totalAmount.toFixed(2) }}
        </button>
      </div>
    </div>
  </div>
</template>
