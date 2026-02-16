<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getDish } from '@/api'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const cartStore = useCartStore()

const dishId = computed(() => route.params.dishId as string)
const dish = ref<any>(null)
const loading = ref(true)
const quantity = ref(1)
const adding = ref(false)

onMounted(async () => {
  try {
    const res: any = await getDish(dishId.value)
    dish.value = res.data
  } catch {
    //
  } finally {
    loading.value = false
  }
})

const displayName = computed(() => {
  if (!dish.value) return ''
  return locale.value === 'en' && dish.value.name_en ? dish.value.name_en : dish.value.name
})

const displayDesc = computed(() => {
  if (!dish.value) return ''
  return locale.value === 'en' && dish.value.description_en ? dish.value.description_en : dish.value.description
})

async function addToCart() {
  if (!dish.value || dish.value.is_sold_out || adding.value) return
  adding.value = true
  try {
    await cartStore.addItem(dish.value, quantity.value)
    router.back()
  } catch {
    //
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Back button -->
    <button
      class="fixed top-10 left-4 z-20 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
      @click="router.back()"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div v-if="loading" class="flex justify-center pt-24">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else-if="dish">
      <!-- Image -->
      <div class="h-64 bg-gray-200">
        <img v-if="dish.image_url" :src="dish.image_url" :alt="displayName" class="w-full h-full object-cover" />
      </div>

      <!-- Info -->
      <div class="px-4 py-4">
        <div class="flex items-start justify-between">
          <h1 class="text-xl font-bold flex-1">{{ displayName }}</h1>
          <div class="flex items-center gap-1 ml-2">
            <span v-if="dish.is_spicy" class="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{{ t('dish.spicy') }}</span>
            <span v-if="dish.is_vegetarian" class="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">{{ t('dish.vegetarian') }}</span>
          </div>
        </div>

        <p v-if="displayDesc" class="text-sm text-gray-500 mt-2">{{ displayDesc }}</p>

        <!-- Stats -->
        <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span v-if="dish.avg_rating" class="flex items-center gap-1">
            <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {{ dish.avg_rating?.toFixed(1) }}
          </span>
          <span v-if="dish.total_sold">{{ dish.total_sold }} {{ t('stall.orders') }}</span>
          <span v-if="dish.has_inventory && dish.remaining_stock != null">
            {{ t('dish.remaining', { count: dish.remaining_stock }) }}
          </span>
        </div>

        <!-- Price -->
        <div class="flex items-baseline gap-2 mt-4">
          <span class="text-2xl font-bold text-primary-500">{{ t('common.currency') }}{{ dish.price.toFixed(2) }}</span>
          <span v-if="dish.original_price && dish.original_price > dish.price" class="text-sm text-gray-400 line-through">
            {{ t('common.currency') }}{{ dish.original_price.toFixed(2) }}
          </span>
        </div>

        <!-- Quantity selector -->
        <div class="flex items-center gap-4 mt-6">
          <button
            class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500"
            :disabled="quantity <= 1"
            @click="quantity > 1 && quantity--"
          >
            -
          </button>
          <span class="text-lg font-medium w-8 text-center">{{ quantity }}</span>
          <button
            class="w-8 h-8 rounded-full border border-primary-500 text-primary-500 flex items-center justify-center"
            :disabled="quantity >= (dish.max_per_order || 99)"
            @click="quantity++"
          >
            +
          </button>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 safe-bottom z-30">
        <button
          class="w-full py-3 rounded-xl font-medium text-white"
          :class="dish.is_sold_out ? 'bg-gray-300' : 'bg-primary-500 active:bg-primary-600'"
          :disabled="dish.is_sold_out || adding"
          @click="addToCart"
        >
          <template v-if="dish.is_sold_out">{{ t('dish.soldOut') }}</template>
          <template v-else>{{ t('dish.addToCart') }} - {{ t('common.currency') }}{{ (dish.price * quantity).toFixed(2) }}</template>
        </button>
      </div>
    </template>
  </div>
</template>
