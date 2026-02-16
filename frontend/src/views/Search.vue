<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { searchDishes } from '@/api'
import DishCard from '@/components/DishCard.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const foodCourtId = computed(() => route.params.foodCourtId as string)

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

let debounceTimer: any = null

function onInput() {
  clearTimeout(debounceTimer)
  if (!query.value.trim()) {
    results.value = []
    searched.value = false
    return
  }
  debounceTimer = setTimeout(doSearch, 400)
}

async function doSearch() {
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const res: any = await searchDishes({ q: query.value, food_court_id: foodCourtId.value })
    results.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
}

function goToDish(dish: any) {
  router.push(`/fc/${foodCourtId.value}/dish/${dish.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Search header -->
    <div class="bg-white px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
      <button @click="router.back()">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="flex-1 relative">
        <input
          v-model="query"
          type="text"
          :placeholder="t('home.searchPlaceholder')"
          class="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          autofocus
          @input="onInput"
          @keyup.enter="doSearch"
        />
      </div>
    </div>

    <!-- Results -->
    <div class="px-4 py-3">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
      <div v-else-if="searched && !results.length" class="text-center py-12 text-gray-400">
        {{ t('common.noData') }}
      </div>
      <div v-else class="space-y-3">
        <DishCard
          v-for="dish in results"
          :key="dish.id"
          :dish="dish"
          @click="goToDish"
        />
      </div>
    </div>
  </div>
</template>
