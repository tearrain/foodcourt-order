<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useCartStore } from '@/stores/cart'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const appStore = useAppStore()
const cartStore = useCartStore()

const foodCourtId = computed(() => route.params.foodCourtId as string)
const hideTabBar = computed(() => ['checkout', 'order-detail', 'dish-detail'].includes(route.name as string))

onMounted(async () => {
  if (foodCourtId.value) {
    await appStore.initFoodCourt(foodCourtId.value)
    cartStore.fetchCart()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <RouterView />
    <TabBar v-if="!hideTabBar" :food-court-id="foodCourtId" />
  </div>
</template>
