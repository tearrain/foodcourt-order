<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'

const props = defineProps<{
  dish: {
    id: string
    name: string
    name_en?: string
    description?: string
    price: number
    original_price?: number
    image_url?: string
    is_recommended?: boolean
    is_sold_out?: boolean
    is_spicy?: boolean
    is_vegetarian?: boolean
    avg_rating?: number
    total_sold?: number
    remaining_stock?: number
    has_inventory?: boolean
  }
}>()

const emit = defineEmits<{ (e: 'click', dish: any): void }>()

const { t, locale } = useI18n()
const cartStore = useCartStore()

const displayName = $computed(() =>
  locale.value === 'en' && props.dish.name_en ? props.dish.name_en : props.dish.name
)

function addToCart() {
  if (props.dish.is_sold_out) return
  cartStore.addItem(props.dish)
}
</script>

<template>
  <div
    class="bg-white rounded-xl overflow-hidden shadow-sm flex"
    @click="emit('click', dish)"
  >
    <!-- Image -->
    <div class="relative w-28 h-28 flex-shrink-0">
      <img
        v-if="dish.image_url"
        :src="dish.image_url"
        :alt="displayName"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <!-- Tags -->
      <span
        v-if="dish.is_recommended"
        class="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded"
      >
        {{ t('dish.recommended') }}
      </span>
      <span
        v-if="dish.is_sold_out"
        class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium"
      >
        {{ t('dish.soldOut') }}
      </span>
    </div>
    <!-- Info -->
    <div class="flex-1 p-3 flex flex-col justify-between min-w-0">
      <div>
        <h3 class="font-medium text-sm truncate">{{ displayName }}</h3>
        <div class="flex items-center gap-1 mt-1">
          <span v-if="dish.is_spicy" class="text-xs bg-red-100 text-red-600 px-1 rounded">{{ t('dish.spicy') }}</span>
          <span v-if="dish.is_vegetarian" class="text-xs bg-green-100 text-green-600 px-1 rounded">{{ t('dish.vegetarian') }}</span>
        </div>
        <div v-if="dish.total_sold" class="text-xs text-gray-400 mt-1">
          {{ dish.total_sold }} {{ t('stall.orders') }}
        </div>
      </div>
      <div class="flex items-center justify-between mt-1">
        <div class="flex items-baseline gap-1">
          <span class="text-primary-500 font-bold text-base">{{ t('common.currency') }}{{ dish.price.toFixed(2) }}</span>
          <span v-if="dish.original_price && dish.original_price > dish.price" class="text-xs text-gray-400 line-through">
            {{ t('common.currency') }}{{ dish.original_price.toFixed(2) }}
          </span>
        </div>
        <button
          v-if="!dish.is_sold_out"
          class="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg leading-none"
          @click.stop="addToCart"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>
