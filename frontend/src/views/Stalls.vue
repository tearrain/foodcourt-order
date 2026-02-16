<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getStalls } from '@/api'
import StallCard from '@/components/StallCard.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const foodCourtId = computed(() => route.params.foodCourtId as string)

const stalls = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await getStalls(foodCourtId.value, { limit: 50 })
    stalls.value = res.data || []
  } catch {
    //
  } finally {
    loading.value = false
  }
})

function goToStall(stallId: string) {
  router.push(`/fc/${foodCourtId.value}/stall/${stallId}`)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="bg-white px-4 py-3 sticky top-0 z-10 border-b">
      <h1 class="text-lg font-bold">{{ t('home.allStalls') }}</h1>
    </div>

    <div class="px-4 pt-4">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
      <div v-else class="grid grid-cols-2 gap-3 pb-4">
        <StallCard
          v-for="stall in stalls"
          :key="stall.id"
          :stall="stall"
          @click="goToStall"
        />
      </div>
    </div>
  </div>
</template>
