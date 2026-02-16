<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { getRecommendedDishes, getStalls } from '@/api'
import DishCard from '@/components/DishCard.vue'
import StallCard from '@/components/StallCard.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const appStore = useAppStore()

const foodCourtId = computed(() => route.params.foodCourtId as string)
const recommendedDishes = ref<any[]>([])
const stalls = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const [dishRes, stallRes] = await Promise.all([
      getRecommendedDishes({ food_court_id: foodCourtId.value, limit: 6 }),
      getStalls(foodCourtId.value, { limit: 10 }),
    ]) as any[]
    recommendedDishes.value = dishRes.data || []
    stalls.value = stallRes.data || []
  } catch {
    // handle
  } finally {
    loading.value = false
  }
})

function goToStall(stallId: string) {
  router.push(`/fc/${foodCourtId.value}/stall/${stallId}`)
}

function goToDish(dish: any) {
  router.push(`/fc/${foodCourtId.value}/dish/${dish.id}`)
}

function goToSearch() {
  router.push(`/fc/${foodCourtId.value}/search`)
}

const foodCourtName = computed(() => {
  const fc = appStore.foodCourt
  if (!fc) return ''
  return locale.value === 'en' && fc.name_en ? fc.name_en : fc.name
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="bg-primary-500 text-white px-4 pt-10 pb-6">
      <h1 class="text-xl font-bold">{{ foodCourtName || 'FoodCourt' }}</h1>
      <p v-if="appStore.foodCourt?.address" class="text-sm opacity-80 mt-1">
        {{ appStore.foodCourt.address }}
      </p>
      <!-- Search Bar -->
      <div class="mt-4 relative" @click="goToSearch">
        <div class="bg-white/20 rounded-full px-4 py-2.5 flex items-center gap-2 text-white/80">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-sm">{{ t('home.searchPlaceholder') }}</span>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-2">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>

      <template v-else>
        <!-- Recommended Dishes -->
        <section v-if="recommendedDishes.length" class="mb-6">
          <div class="flex items-center justify-between mb-3 pt-4">
            <h2 class="font-bold text-lg">{{ t('home.recommended') }}</h2>
          </div>
          <div class="space-y-3">
            <DishCard
              v-for="dish in recommendedDishes"
              :key="dish.id"
              :dish="dish"
              @click="goToDish"
            />
          </div>
        </section>

        <!-- Stalls -->
        <section v-if="stalls.length">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-lg">{{ t('home.allStalls') }}</h2>
            <button
              class="text-primary-500 text-sm"
              @click="router.push(`/fc/${foodCourtId}/stalls`)"
            >
              {{ t('home.viewAll') }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 pb-4">
            <StallCard
              v-for="stall in stalls"
              :key="stall.id"
              :stall="stall"
              @click="goToStall"
            />
          </div>
        </section>

        <!-- Empty -->
        <div v-if="!recommendedDishes.length && !stalls.length" class="text-center py-12 text-gray-400">
          <p>{{ t('common.noData') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>
