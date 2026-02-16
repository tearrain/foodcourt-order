<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const cartStore = useCartStore()

const foodCourtId = computed(() => route.params.foodCourtId as string)

function dishName(item: any) {
  return locale.value === 'en' && item.dish_name_en ? item.dish_name_en : item.dish_name
}

function goToCheckout() {
  router.push(`/fc/${foodCourtId.value}/checkout`)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="bg-white px-4 py-3 sticky top-0 z-10 border-b flex items-center justify-between">
      <h1 class="text-lg font-bold">{{ t('cart.title') }}</h1>
      <button
        v-if="cartStore.items.length"
        class="text-sm text-red-500"
        @click="cartStore.clear()"
      >
        {{ t('cart.clearAll') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!cartStore.items.length" class="flex flex-col items-center justify-center py-20">
      <svg class="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      <p class="text-gray-400 mt-4">{{ t('cart.empty') }}</p>
      <p class="text-gray-300 text-sm mt-1">{{ t('cart.emptyHint') }}</p>
      <button
        class="mt-6 px-6 py-2 bg-primary-500 text-white rounded-full text-sm"
        @click="router.push(`/fc/${foodCourtId}`)"
      >
        {{ t('cart.browseMenu') }}
      </button>
    </div>

    <!-- Cart items grouped by stall -->
    <div v-else class="pb-24">
      <div
        v-for="(group, stallId) in cartStore.stallGroups"
        :key="stallId"
        class="bg-white mt-3 mx-4 rounded-xl overflow-hidden"
      >
        <!-- Stall header -->
        <div class="px-4 py-2.5 bg-gray-50 border-b text-sm font-medium text-gray-600">
          {{ t('cart.stallSection', { stall: group.stall_name }) }}
        </div>
        <!-- Items -->
        <div v-for="item in group.items" :key="item.id" class="px-4 py-3 flex items-center gap-3 border-b last:border-0">
          <img
            v-if="item.dish_image"
            :src="item.dish_image"
            class="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
          <div v-else class="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium truncate">{{ dishName(item) }}</h4>
            <p class="text-primary-500 text-sm font-medium mt-1">
              {{ t('common.currency') }}{{ item.unit_price.toFixed(2) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 text-sm"
              @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
            >
              -
            </button>
            <span class="text-sm w-5 text-center">{{ item.quantity }}</span>
            <button
              class="w-6 h-6 rounded-full border border-primary-500 text-primary-500 flex items-center justify-center text-sm"
              @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom checkout bar -->
      <div class="fixed bottom-16 left-0 right-0 bg-white border-t px-4 py-3 z-30">
        <div class="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span class="text-sm text-gray-500">{{ t('cart.total') }}:</span>
            <span class="text-xl font-bold text-primary-500 ml-1">
              {{ t('common.currency') }}{{ cartStore.totalAmount.toFixed(2) }}
            </span>
          </div>
          <button
            class="px-8 py-2.5 bg-primary-500 text-white rounded-full font-medium"
            @click="goToCheckout"
          >
            {{ t('cart.checkout') }} ({{ cartStore.totalItems }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
