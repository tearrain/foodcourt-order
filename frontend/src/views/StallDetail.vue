<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getStall, getStallDishes } from '@/api'
import DishCard from '@/components/DishCard.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const stallId = computed(() => route.params.stallId as string)
const foodCourtId = computed(() => route.params.foodCourtId as string)
const stall = ref<any>(null)
const dishes = ref<any[]>([])
const categories = ref<string[]>([])
const activeCategory = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const [stallRes, dishRes] = await Promise.all([
      getStall(stallId.value),
      getStallDishes(stallId.value, { limit: 100 }),
    ]) as any[]
    stall.value = stallRes.data
    dishes.value = dishRes.data || []
    // Extract categories
    const cats = new Set<string>()
    dishes.value.forEach((d: any) => {
      if (d.category_name) cats.add(d.category_name)
    })
    categories.value = Array.from(cats)
  } catch {
    //
  } finally {
    loading.value = false
  }
})

const filteredDishes = computed(() => {
  if (!activeCategory.value) return dishes.value
  return dishes.value.filter((d: any) => d.category_name === activeCategory.value)
})

function goToDish(dish: any) {
  router.push(`/fc/${foodCourtId.value}/dish/${dish.id}`)
}

const displayName = computed(() => {
  if (!stall.value) return ''
  return locale.value === 'en' && stall.value.name_en ? stall.value.name_en : stall.value.name
})
</script>

<template>
  <div>
    <!-- Header with back button -->
    <div class="relative">
      <div class="h-48 bg-gray-200">
        <img
          v-if="stall?.cover_image_url"
          :src="stall.cover_image_url"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600"></div>
      </div>
      <button
        class="absolute top-10 left-4 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
        @click="router.back()"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Stall Info -->
    <div class="bg-white px-4 py-4 -mt-4 rounded-t-2xl relative z-10">
      <h1 class="text-xl font-bold">{{ displayName }}</h1>
      <p v-if="stall?.description" class="text-sm text-gray-500 mt-1">{{ stall.description }}</p>
      <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <span v-if="stall?.avg_rating" class="flex items-center gap-1">
          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {{ stall.avg_rating?.toFixed(1) }}
        </span>
        <span v-if="stall?.total_orders">{{ stall.total_orders }}+ {{ t('stall.orders') }}</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div v-if="categories.length" class="bg-white px-4 sticky top-0 z-10 border-b">
      <div class="flex gap-4 overflow-x-auto no-scrollbar py-3">
        <button
          class="text-sm whitespace-nowrap pb-1 border-b-2 transition-colors"
          :class="!activeCategory ? 'text-primary-500 border-primary-500 font-medium' : 'text-gray-500 border-transparent'"
          @click="activeCategory = ''"
        >
          {{ t('stall.allCategories') }}
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          class="text-sm whitespace-nowrap pb-1 border-b-2 transition-colors"
          :class="activeCategory === cat ? 'text-primary-500 border-primary-500 font-medium' : 'text-gray-500 border-transparent'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Dishes -->
    <div class="px-4 py-3">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
      <div v-else class="space-y-3 pb-4">
        <DishCard
          v-for="dish in filteredDishes"
          :key="dish.id"
          :dish="dish"
          @click="goToDish"
        />
        <div v-if="!filteredDishes.length" class="text-center py-8 text-gray-400">
          {{ t('common.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>
