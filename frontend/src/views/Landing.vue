<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getFoodCourts } from '@/api'

const router = useRouter()
const { t } = useI18n()
const foodCourts = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await getFoodCourts({ limit: 20 })
    foodCourts.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
})

function goToFoodCourt(id: string) {
  router.push(`/fc/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-primary-500 text-white px-6 pt-14 pb-8">
      <h1 class="text-2xl font-bold">FoodCourt</h1>
      <p class="text-sm opacity-80 mt-1">{{ t('home.nearbyFoodCourts') }}</p>
    </div>

    <div class="px-4 -mt-4">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>

      <div v-else class="space-y-3 pb-8">
        <div
          v-for="fc in foodCourts"
          :key="fc.id"
          class="bg-white rounded-xl p-4 shadow-sm"
          @click="goToFoodCourt(fc.id)"
        >
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-primary-500 text-xl font-bold">{{ fc.name?.charAt(0) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold truncate">{{ fc.name }}</h3>
              <p class="text-sm text-gray-500 truncate mt-0.5">{{ fc.address }}</p>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span v-if="fc.stall_count">{{ fc.stall_count }} {{ t('nav.stalls') }}</span>
                <span v-if="fc.avg_rating">{{ fc.avg_rating?.toFixed(1) }} {{ t('stall.rating') }}</span>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div v-if="!foodCourts.length" class="text-center py-12 text-gray-400">
          {{ t('common.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>
